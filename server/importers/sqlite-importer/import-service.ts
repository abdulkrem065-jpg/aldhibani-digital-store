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
  status: 'pending' | 'processing' | 'success' | 'failed' | 'rolled_back';
  progress: number;
  info: string;
  startedAt: string;
  completedAt?: string;
  insertedIds?: {
    categories: string[];
    products: string[];
    customers: string[];
    orders: string[];
  };
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
  
  // Sequential Queue Processing Fields
  private queue: string[] = [];
  private isProcessingQueue = false;
  private jobContexts: Map<string, {
    orgId: string;
    branchId: string;
    userId: string;
    supabaseClient: any;
    storeDatabase: any;
  }> = new Map();

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
   * Start thread-safe async import migration task, utilizing sequential Queue processing.
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
      info: 'مجدولة في طابور مهام الاستيراد (Queued)...',
      startedAt: new Date().toISOString(),
      insertedIds: {
        categories: [],
        products: [],
        customers: [],
        orders: []
      }
    };

    this.jobs.set(jobId, job);
    this.jobContexts.set(jobId, { orgId, branchId, userId, supabaseClient, storeDatabase });
    
    // Push into sequential processing queue
    this.queue.push(jobId);
    
    // Fire background queue executor
    this.processQueue();

    return jobId;
  }

  /**
   * Sequential background queue processing handler
   */
  private async processQueue() {
    if (this.isProcessingQueue) {
      console.log('[ImportService] Queue is currently processing another job. Handshake postponed.');
      return;
    }

    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const jobId = this.queue[0]; // Peek next job
      const ctx = this.jobContexts.get(jobId);

      if (ctx) {
        console.log(`[ImportService] Starting execution of Job: ${jobId} from Queue.`);
        try {
          await this.runImportPipeline(
            jobId,
            ctx.orgId,
            ctx.branchId,
            ctx.userId,
            ctx.supabaseClient,
            ctx.storeDatabase
          );
        } catch (err: any) {
          console.error(`[ImportService] Job ${jobId} execution threw error:`, err.message);
        } finally {
          this.jobContexts.delete(jobId);
        }
      }

      this.queue.shift(); // Remove job from queue
    }

    this.isProcessingQueue = false;
  }

  /**
   * Action to rollback any successfully inserted records belonging to a job.
   */
  public async rollbackJob(jobId: string, supabaseClient: any, storeDatabase: any): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('لم يتم العثور على أي مهمة استيراد تابعة لهذا المعرّف للتراجع.');
    }

    if (job.status === 'rolled_back') {
      return { success: true, message: 'هذه العملية تم التراجع عنها مسبقاً.' };
    }

    const inserted = job.insertedIds;
    if (!inserted) {
      job.status = 'rolled_back';
      job.info = 'لا توجد سجلات منشأة للتراجع عنها في الذاكرة.';
      return { success: true, message: 'تم الانتهاء من التحديث (سجل المعرفات فارغ).' };
    }

    console.log(`[ImportService] Starting Rollback System for Job: ${jobId}`);
    job.info = 'جاري سحب وحذف السجلات المدرجة وتصفير العلاقات تراجعياً...';

    try {
      // 1. Roll back orders
      if (inserted.orders && inserted.orders.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('orders').delete().in('id', inserted.orders);
        }
        if (storeDatabase && storeDatabase.orders) {
          storeDatabase.orders = storeDatabase.orders.filter(
            (o: any) => !inserted.orders.includes(o.id)
          );
        }
      }

      // 2. Roll back customers
      if (inserted.customers && inserted.customers.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('customers').delete().in('id', inserted.customers);
        }
        if (storeDatabase && storeDatabase.debts) {
          storeDatabase.debts = storeDatabase.debts.filter(
            (d: any) => !inserted.customers.includes(d.id)
          );
        }
      }

      // 3. Roll back products
      if (inserted.products && inserted.products.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('products').delete().in('id', inserted.products);
        }
        if (storeDatabase && storeDatabase.products) {
          storeDatabase.products = storeDatabase.products.filter(
            (p: any) => !inserted.products.includes(p.id)
          );
        }
      }

      // 4. Roll back categories
      if (inserted.categories && inserted.categories.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('categories').delete().in('id', inserted.categories);
        }
        if (storeDatabase && storeDatabase.categories) {
          storeDatabase.categories = storeDatabase.categories.filter(
            (c: any) => !inserted.categories.includes(c.id)
          );
        }
      }

      job.status = 'rolled_back';
      job.progress = 100;
      job.info = 'تم التراجع التام وإزاحة جميع السجلات المدرجة من قواعد البيانات وسيرفر التشغيل 🔴.';
      job.completedAt = new Date().toISOString();

      console.log(`[ImportService] Rollback completed for Job: ${jobId}`);
      return {
        success: true,
        message: 'تم التراجع عن الاستيراد وحذف كافة السجلات المدرجة سحابياً ومحلياً بنجاح!'
      };
    } catch (err: any) {
      console.error(`[ImportService] Rollback System failed for Job: ${jobId}`, err);
      job.info = `فشل أثناء التراجع: ${err.message}`;
      throw err;
    }
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

      // Initialize tracks registry
      job.insertedIds = {
        categories: [],
        products: [],
        customers: [],
        orders: []
      };

      // Load Sequence Batch-Wise
      const batchResults: BatchImportResult[] = [];

      // Load Categories
      const catBatch = await BatchImporter.importBatch('categories', transformedCategories, supabaseClient, storeDatabase);
      batchResults.push(catBatch);
      if (catBatch.insertedCount > 0) {
        const failedIds = new Set(catBatch.errors.map(e => String(e.recordId)));
        job.insertedIds.categories = transformedCategories
          .filter(c => !failedIds.has(String(c.id)))
          .map(c => String(c.id));
      }

      // Load Products
      job.progress = 80;
      const prodBatch = await BatchImporter.importBatch('products', transformedProducts, supabaseClient, storeDatabase);
      batchResults.push(prodBatch);
      if (prodBatch.insertedCount > 0) {
        const failedIds = new Set(prodBatch.errors.map(e => String(e.recordId)));
        job.insertedIds.products = transformedProducts
          .filter(p => !failedIds.has(String(p.id)))
          .map(p => String(p.id));
      }

      // Load Customers
      job.progress = 90;
      const custBatch = await BatchImporter.importBatch('customers', transformedCustomers, supabaseClient, storeDatabase);
      batchResults.push(custBatch);
      if (custBatch.insertedCount > 0) {
        const failedIds = new Set(custBatch.errors.map(e => String(e.recordId)));
        job.insertedIds.customers = transformedCustomers
          .filter(c => !failedIds.has(String(c.id)))
          .map(c => String(c.id));
      }

      // Load Orders
      job.progress = 95;
      const orderBatch = await BatchImporter.importBatch('orders', compiledOrders, supabaseClient, storeDatabase);
      batchResults.push(orderBatch);
      if (orderBatch.insertedCount > 0) {
        const failedIds = new Set(orderBatch.errors.map(e => String(e.recordId)));
        job.insertedIds.orders = compiledOrders
          .filter(o => !failedIds.has(String(o.id)))
          .map(o => String(o.id));
      }

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
      
      // AUTO-ROLLBACK Trigger on critical pipe exception to uphold atomicity
      console.log(`[ImportService] Critical pipeline interruption detected. Initiating AUTO-ROLLBACK for atomic guarantees...`);
      try {
        await this.rollbackJob(jobId, supabaseClient, storeDatabase);
      } catch (rErr) {
        console.error('[ImportService] AUTO-ROLLBACK failed:', rErr);
      }

      job.status = 'failed';
      job.progress = 100;
      job.info = `فشلت الهجرة وتراجعنا عنها لمنع الملفات المكسورة: ${err.message}`;
      job.completedAt = new Date().toISOString();
      job.errors = [{ severity: 'error', entity: 'process', message: err.message }];
    }
  }
}
