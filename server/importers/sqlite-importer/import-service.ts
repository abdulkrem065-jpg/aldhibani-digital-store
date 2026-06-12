import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SqliteReader } from './sqlite-reader';
import { UUIDGenerator } from './uuid-generator';
import { DataTransformer } from './data-transformer';
import { OrganizationInjector } from './organization-injector';
import { InvoiceJsonConverter } from './invoice-json-converter';
import { ImportValidator, ValidationError } from './import-validator';
import { BatchImporter, BatchImportResult } from './batch-importer';

export interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress: number;
  info: string;
  startedAt: string;
  completedAt?: string;
  summary?: {
    categories: number;
    products: number;
    customers: number;
    orders: number;
    batchResults: BatchImportResult[];
  };
  errors?: ValidationError[] | any[];
}

export class ImportService {
  private static instance: ImportService | null = null;
  private jobs: Map<string, ImportJob> = new Map();
  private tempDbPath = path.join(process.cwd(), 'backup_import_temp.sqlite');

  private constructor() {}

  public static getInstance(): ImportService {
    if (!this.instance) {
      this.instance = new ImportService();
    }
    return this.instance;
  }

  /**
   * Save uploaded file buffer to a persistent SQLite path on disk.
   */
  public async saveUpload(buffer: Buffer): Promise<any> {
    fs.writeFileSync(this.tempDbPath, buffer);
    const reader = new SqliteReader(buffer);
    await reader.load();
    
    const isValid = reader.verifyIntegrity();
    if (!isValid) {
      reader.close();
      throw new Error('النسخة الاحتياطية تالفة أو غير صالحة للتحليل (SQLite integrity check failed).');
    }

    const metadata = await reader.getTablesMetadata();
    reader.close();

    // Reset stable UUID cache upon uploading fresh file to prevent cross-file conflicts
    UUIDGenerator.reset();

    const stats = fs.statSync(this.tempDbPath);
    return {
      success: true,
      fileSize: stats.size,
      tablesCount: metadata.length,
      tables: metadata.map(t => ({ name: t.name, rows: t.rowCount }))
    };
  }

  /**
   * Reads SQLite tables and runs ETL pre-flight check.
   */
  public async analyzeBackup(): Promise<any> {
    if (!fs.existsSync(this.tempDbPath)) {
      throw new Error('لم يتم العثور على ملف مرفوع للتحليل. من فضلك ارفع النسخة الاحتياطية أولاً.');
    }

    const buffer = fs.readFileSync(this.tempDbPath);
    const reader = new SqliteReader(buffer);
    await reader.load();

    const metadata = await reader.getTablesMetadata();
    
    // Core statistics count
    const itemsCount = metadata.find(t => t.name === 'items')?.rowCount || 0;
    const catCount = metadata.find(t => t.name === 'item_type')?.rowCount || 0;
    const custCount = metadata.find(t => t.name === 'customers')?.rowCount || 0;
    const billsCount = metadata.find(t => t.name === 'bills')?.rowCount || 0;
    const transCount = metadata.find(t => t.name === 'transactions')?.rowCount || 0;

    let preflightErrorCount = 0;
    let preflightWarningCount = 0;

    // Pull first rows sample for validation simulation
    const rawCategories = reader.getTableRows('item_type', 100);
    const rawProducts = reader.getTableRows('items', 100);
    const rawCustomers = reader.getTableRows('customers', 100);

    const products = rawProducts.map(p => DataTransformer.transformProduct(p));
    const categories = rawCategories.map(c => DataTransformer.transformCategory(c));
    const customers = rawCustomers.map(c => DataTransformer.transformCustomer(c));

    const report = ImportValidator.validate({
      categories,
      products,
      customers,
      orders: [],
      accounts: [],
      accountingEntries: []
    });

    reader.close();

    return {
      integrityOk: true,
      stats: {
        productsCount: itemsCount,
        categoriesCount: catCount,
        customersCount: custCount,
        billsCount: billsCount,
        transactionsCount: transCount
      },
      validation: report
    };
  }

  /**
   * Fetch sample transformed rows.
   */
  public async previewRecords(limit: number = 5): Promise<any> {
    if (!fs.existsSync(this.tempDbPath)) {
      throw new Error('لا يوجد ملف نشط لعرض معاينته.');
    }

    const buffer = fs.readFileSync(this.tempDbPath);
    const reader = new SqliteReader(buffer);
    await reader.load();

    // 1. Fetch raw rows
    const rawCategories = reader.getTableRows('item_type', limit);
    const rawProducts = reader.getTableRows('items', limit);
    const rawCustomers = reader.getTableRows('customers', limit);
    const rawBills = reader.getTableRows('bills', limit);

    // 2. Transform rows
    const categories = rawCategories.map(c => DataTransformer.transformCategory(c));
    const products = rawProducts.map(p => DataTransformer.transformProduct(p));
    const customers = rawCustomers.map(c => DataTransformer.transformCustomer(c));
    const orders = rawBills.map(b => InvoiceJsonConverter.compile(b, []));

    reader.close();

    return {
      success: true,
      preview: {
        categories,
        products,
        customers,
        orders
      }
    };
  }

  /**
   * Start thread-safe async import migration task.
   */
  public startImport(
    orgId: string,
    branchId: string,
    userId: string,
    supabaseClient: any,
    storeDatabase: any
  ): string {
    if (!fs.existsSync(this.tempDbPath)) {
      throw new Error('لا يوجد ملف نشط للبدء بعملية النقل.');
    }

    const jobId = crypto.randomUUID();
    const job: ImportJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      info: 'جاري تهيئة خادم النقل المجمع...',
      startedAt: new Date().toISOString()
    };

    this.jobs.set(jobId, job);

    // Execute full sequence in background threads asynchronously
    this.runImportPipeline(jobId, orgId, branchId, userId, supabaseClient, storeDatabase);

    return jobId;
  }

  /**
   * GET single job status.
   */
  public getJob(jobId: string): ImportJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Core pipeline orchestrator
   */
  private async runImportPipeline(
    jobId: string,
    orgId: string,
    branchId: string,
    userId: string,
    supabaseClient: any,
    storeDatabase: any
  ) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.progress = 5;
      job.info = 'قراءة وفحص الجداول الرئيسية في الذاكرة المؤقتة...';

      const buffer = fs.readFileSync(this.tempDbPath);
      const reader = new SqliteReader(buffer);
      await reader.load();

      // Step A: Load and transform Categories
      job.progress = 10;
      job.info = 'جاري استيراد الفئات والتبويبات وتأمين البنية الهيكلية...';
      const rawCategories = reader.getTableRows('item_type');
      const transformedCategories = rawCategories.map(c => {
        const tr = DataTransformer.transformCategory(c);
        return OrganizationInjector.inject(tr, orgId, branchId, userId);
      });

      // Build mapping map of category codes -> names
      const categoryNameMap: Record<number, string> = {};
      rawCategories.forEach(c => {
        categoryNameMap[c.id] = c.name;
      });

      job.progress = 20;
      job.info = 'جاري استيراد المنتجات وقائمة البضائع وتصفية النماذج المتكررة...';
      // Step B: Load and transform Products
      const rawProducts = reader.getTableRows('items');
      const transformedProducts = rawProducts.map(p => {
        const tr = DataTransformer.transformProduct(p, categoryNameMap);
        return OrganizationInjector.inject(tr, orgId, branchId, userId);
      });

      job.progress = 35;
      job.info = 'جاري نقل سجلات العملاء ومطابقة قوائم الذمم والديون...';
      // Step C: Load and transform Customers
      const rawCustomers = reader.getTableRows('customers');
      const transformedCustomers = rawCustomers.map(c => {
        const tr = DataTransformer.transformCustomer(c);
        return OrganizationInjector.inject(tr, orgId, branchId, userId);
      });

      job.progress = 50;
      job.info = 'جاري فحص تفاصيل وسجلات الفواتير والمستندات الدفترية القديمة...';
      // Step D: Load and transform Invoices (Invoices compile logic)
      const rawBills = reader.getTableRows('bills');
      const rawTransactions = reader.getTableRows('bill_transactions');
      const compiledOrders = InvoiceJsonConverter.compileBatch(rawBills, rawTransactions).map(order => {
        return OrganizationInjector.inject(order, orgId, branchId, userId);
      });

      // Validation Step prior to loading
      job.progress = 60;
      job.info = 'جاري التحقق من التكرار والباركود المكسور وتأمين التكامل العلاقات الدقيقة...';
      
      const validationReport = ImportValidator.validate({
        categories: transformedCategories,
        products: transformedProducts,
        customers: transformedCustomers,
        orders: compiledOrders,
        accounts: [],
        accountingEntries: []
      });

      if (!validationReport.isValid && validationReport.totalErrors > 50) {
        throw new Error(`النظام يحتوي على عدد كبير من الأخطاء الحرجة (${validationReport.totalErrors} خطأ). يرجى إصلاح الملف القديم أولاً.`);
      }

      job.progress = 70;
      job.info = 'جاري البدء بحفظ وتغذية قاعدة بيانات السحابية والذاكرة المحلية...';

      // Load Sequence Batch-Wise
      const batchResults: BatchImportResult[] = [];

      // Load Categories
      const catBatch = await BatchImporter.importBatch('categories', transformedCategories, supabaseClient, storeDatabase);
      batchResults.push(catBatch);

      // Load Products
      job.progress = 80;
      const prodBatch = await BatchImporter.importBatch('products', transformedProducts, supabaseClient, storeDatabase);
      batchResults.push(prodBatch);

      // Load Customers
      job.progress = 90;
      const custBatch = await BatchImporter.importBatch('customers', transformedCustomers, supabaseClient, storeDatabase);
      batchResults.push(custBatch);

      // Load Orders
      job.progress = 95;
      const orderBatch = await BatchImporter.importBatch('orders', compiledOrders, supabaseClient, storeDatabase);
      batchResults.push(orderBatch);

      reader.close();

      // Pipeline complete successfully
      job.status = 'success';
      job.progress = 100;
      job.info = 'اكتملت عملية الاستيراد والهجرة بنجاح تام 🟢!';
      job.completedAt = new Date().toISOString();
      job.summary = {
        categories: transformedCategories.length,
        products: transformedProducts.length,
        customers: transformedCustomers.length,
        orders: compiledOrders.length,
        batchResults
      };
      job.errors = validationReport.errors;

      console.log(`[ImportService] Pipeline job ${jobId} succeeded!`);
    } catch (err: any) {
      console.error(`[ImportService] Pipeline job failed for ${jobId}:`, err.message);
      job.status = 'failed';
      job.progress = 100;
      job.info = `فشلت الهجرة: ${err.message}`;
      job.completedAt = new Date().toISOString();
      job.errors = [{ severity: 'error', entity: 'process', message: err.message }];
    }
  }
}
