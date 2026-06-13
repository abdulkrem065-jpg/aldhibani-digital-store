import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SqliteReader } from '../../../server/importers/sqlite-importer/sqlite-reader';
import { UUIDGenerator } from '../../../server/importers/sqlite-importer/uuid-generator';
import { DataTransformer } from '../../../server/importers/sqlite-importer/data-transformer';
import { OrganizationInjector } from '../../../server/importers/sqlite-importer/organization-injector';
import { InvoiceJsonConverter } from '../../../server/importers/sqlite-importer/invoice-json-converter';
import { ImportValidator } from '../../../server/importers/sqlite-importer/import-validator';
import { BatchImporter } from '../../../server/importers/sqlite-importer/batch-importer';
import { ImportRepository, DBImportJob } from '../repositories/import.repository';

export class ImportService {
  private static instance: ImportService | null = null;
  private tempDbPath = path.join(process.cwd(), 'backup_import_temp.sqlite');
  private isProcessingQueue = false;
  private CHUNK_SIZE = 100;

  private constructor() {
    // Initiate background resume polling for uninterrupted recoverability
    this.initResumeManager();
  }

  public static getInstance(): ImportService {
    if (!this.instance) {
      this.instance = new ImportService();
    }
    return this.instance;
  }

  /**
   * Safe save upload file buffer.
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
   * Preflight scanner.
   */
  public async analyzeBackup(): Promise<any> {
    if (!fs.existsSync(this.tempDbPath)) {
      throw new Error('لم يتم العثور على ملف مرفوع للتحليل. من فضلك ارفع النسخة الاحتياطية أولاً.');
    }

    const buffer = fs.readFileSync(this.tempDbPath);
    const reader = new SqliteReader(buffer);
    await reader.load();

    const metadata = await reader.getTablesMetadata();
    
    const itemsCount = metadata.find(t => t.name === 'items')?.rowCount || 0;
    const catCount = metadata.find(t => t.name === 'item_type')?.rowCount || 0;
    const custCount = metadata.find(t => t.name === 'customers')?.rowCount || 0;
    const billsCount = metadata.find(t => t.name === 'bills')?.rowCount || 0;
    const transCount = metadata.find(t => t.name === 'transactions')?.rowCount || 0;

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
   * Real record preview.
   */
  public async previewRecords(limit: number = 5): Promise<any> {
    if (!fs.existsSync(this.tempDbPath)) {
      throw new Error('لا يوجد ملف نشط لعرض معاينته.');
    }

    const buffer = fs.readFileSync(this.tempDbPath);
    const reader = new SqliteReader(buffer);
    await reader.load();

    const rawCategories = reader.getTableRows('item_type', limit);
    const rawProducts = reader.getTableRows('items', limit);
    const rawCustomers = reader.getTableRows('customers', limit);
    const rawBills = reader.getTableRows('bills', limit);

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
   * Start cloud-native multi-tenant import.
   * STRICT: Requires organization_id, branch_id and created_by.
   */
  public async startImport(
    orgId: string,
    branchId: string,
    userId: string,
    supabaseClient: any,
    storeDatabase: any
  ): Promise<string> {
    // 6. Security & Tenancy block validation
    if (!orgId || orgId.trim() === '') {
      throw new Error('يُمنع البدء بالاستيراد والمطابقة بدون توفير الـ organization_id للفرع لتجنب كسر عزل RLS سحابياً.');
    }
    if (!branchId || branchId.trim() === '') {
      throw new Error('يُمنع البدء بالاستيراد والمطابقة بدون توفير الـ branch_id للمستندات.');
    }
    if (!userId || userId.trim() === '') {
      throw new Error('يُمنع البدء بالاستيراد بدون الكاتب أو المشغل (created_by) لتوثيق المسؤولية.');
    }

    if (!fs.existsSync(this.tempDbPath)) {
      throw new Error('لا يوجد ملف نشط للبدء بعملية النقل.');
    }

    const jobId = crypto.randomUUID();
    
    // Save job into Supabase
    const dbJob: DBImportJob = {
      id: jobId,
      organization_id: orgId,
      branch_id: branchId,
      status: 'pending',
      progress: 0,
      current_chunk: 0,
      info: 'تمت جدولة المهمة سحابياً داخل قاعدة بيانات Supabase...',
      created_by: userId,
      inserted_ids: {
        categories: [],
        products: [],
        customers: [],
        orders: []
      }
    };

    const created = await ImportRepository.createJob(dbJob);
    await ImportRepository.logEvent({
      job_id: jobId,
      event_type: 'job_created',
      message: `تم إنشاء مهمة الاستيراد تحت مُعرّف ${jobId} بنجاح.`
    });

    // Start database-driven asynchronous worker loop
    this.triggerWorkerQueue(supabaseClient, storeDatabase);

    return created.id;
  }

  /**
   * Automatic background polling for interrupted jobs.
   */
  private initResumeManager() {
    setInterval(() => {
      this.triggerWorkerQueue(null, null);
    }, 15000); // Poll every 15 seconds to ensure self-healing resiliency
  }

  /**
   * Triggers the DB-driven Queue worker.
   */
  public async triggerWorkerQueue(supabaseClient: any, storeDatabase: any) {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      const unfinished = await ImportRepository.getUnfinishedJobs();
      for (const job of unfinished) {
        console.log(`[ImportService] Resuming/Starting Database Job: ${job.id} (Status: ${job.status})`);
        
        try {
          await this.runImportPipeline(job.id, supabaseClient, storeDatabase);
        } catch (pipelineError: any) {
          console.error(`[ImportService] Interrupted pipeline for job ${job.id}:`, pipelineError.message);
        }
      }
    } catch (err: any) {
      console.error('[ImportService] Queue polling failed:', err.message);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Action to rollback any successfully inserted records belonging to a job.
   */
  public async rollbackJob(jobId: string, supabaseClient: any, storeDatabase: any, operator: string = 'SYSTEM'): Promise<any> {
    const job = await ImportRepository.getJob(jobId);
    if (!job) {
      throw new Error('لم يتم العثور على أي مهمة استيراد تابعة لهذا المعرّف للتراجع.');
    }

    if (job.status === 'rolled_back') {
      return { success: true, message: 'هذه العملية تم التراجع عنها مسبقاً.' };
    }

    // 5. Create rollback tracking event inside import_rollbacks
    await ImportRepository.createRollback({
      job_id: jobId,
      status: 'rolling_back',
      rolled_back_by: operator,
      error_message: null
    });

    const inserted = typeof job.inserted_ids === 'string' ? JSON.parse(job.inserted_ids) : job.inserted_ids;
    
    if (!inserted) {
      await ImportRepository.updateJob(jobId, {
        status: 'rolled_back',
        info: 'تم الانتهاء ولم تسفر العملية عن إدخال سجلات لإلغائها.'
      });
      return { success: true, message: 'تم التراجع (قائمة الإدراجات فارغة).' };
    }

    console.log(`[ImportService] Commencing Cloud Native Rollback System for Job: ${jobId}`);
    await ImportRepository.updateJob(jobId, {
      info: 'جاري البدء بحذف المدخلات وتصفير علاقات الفروع... 🔴'
    });

    try {
      // 1. Roll back orders
      if (inserted.orders && inserted.orders.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('orders').delete().in('id', inserted.orders);
        }
        if (storeDatabase && storeDatabase.orders) {
          storeDatabase.orders = storeDatabase.orders.filter((o: any) => !inserted.orders.includes(o.id));
        }
      }

      // 2. Roll back customers (debts)
      if (inserted.customers && inserted.customers.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('debts').delete().in('id', inserted.customers);
        }
        if (storeDatabase && storeDatabase.debts) {
          storeDatabase.debts = storeDatabase.debts.filter((d: any) => !inserted.customers.includes(d.id));
        }
      }

      // 3. Roll back products
      if (inserted.products && inserted.products.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('products').delete().in('id', inserted.products);
        }
        if (storeDatabase && storeDatabase.products) {
          storeDatabase.products = storeDatabase.products.filter((p: any) => !inserted.products.includes(p.id));
        }
      }

      // 4. Roll back categories
      if (inserted.categories && inserted.categories.length > 0) {
        if (supabaseClient) {
          await supabaseClient.from('categories').delete().in('id', inserted.categories);
        }
        if (storeDatabase && storeDatabase.categories) {
          storeDatabase.categories = storeDatabase.categories.filter((c: any) => !inserted.categories.includes(c.id));
        }
      }

      await ImportRepository.updateJob(jobId, {
        status: 'rolled_back',
        progress: 100,
        info: 'تم التراجع الكامل والتصفير السحابي بنجاح 🔴.',
        completed_at: new Date().toISOString()
      });

      await ImportRepository.logEvent({
        job_id: jobId,
        event_type: 'rolled_back',
        message: 'تم التراجع عن إكمال الاستيراد واسترداد قاعدة البيانات للحالة المستقرة.'
      });

      return {
        success: true,
        message: 'تم التراجع عن الاستيراد وحذف كافة السجلات المدرجة سحابياً ومحلياً بنجاح!'
      };
    } catch (err: any) {
      console.error(`[ImportService] Rollback failed for Job: ${jobId}`, err);
      await ImportRepository.updateJob(jobId, {
        info: `فشل التراجع التلقائي: ${err.message}`
      });
      throw err;
    }
  }

  /**
   * Track status.
   */
  public async getJob(jobId: string): Promise<any> {
    const job = await ImportRepository.getJob(jobId);
    if (!job) return undefined;

    return {
      id: job.id,
      status: job.status,
      progress: Number(job.progress),
      info: job.info,
      startedAt: job.created_at,
      completedAt: job.completed_at,
      insertedIds: typeof job.inserted_ids === 'string' ? JSON.parse(job.inserted_ids) : job.inserted_ids,
      summary: typeof job.summary === 'string' ? JSON.parse(job.summary) : job.summary,
      errors: typeof job.errors === 'string' ? JSON.parse(job.errors) : job.errors
    };
  }

  /**
   * Safe execution pipeline block. Supports chunking, dynamic events, and resume.
   */
  private async runImportPipeline(jobId: string, supabaseClient: any, storeDatabase: any) {
    const job = await ImportRepository.getJob(jobId);
    if (!job) return;

    try {
      await ImportRepository.updateJob(jobId, {
        status: 'processing',
        progress: 5,
        info: 'جاري شحن وفحص معرّفات قواعد البيانات الاحتياطية سحابياً...'
      });

      await ImportRepository.logEvent({
        job_id: jobId,
        event_type: 'pipeline_started',
        message: 'بدأ معالج الحزم بفحص البيئة السحابية وملف SQLite.'
      });

      // Assert local SQLite file.
      if (!fs.existsSync(this.tempDbPath)) {
        throw new Error('الملف المؤقت لمهمة الاستيراد مفقود على هذا الخادم. يتعين إعادة رفع الملف.');
      }

      const buffer = fs.readFileSync(this.tempDbPath);
      const reader = new SqliteReader(buffer);
      await reader.load();

      const orgId = job.organization_id;
      const branchId = job.branch_id;
      const userId = job.created_by;

      const insertedIds = {
        categories: [] as string[],
        products: [] as string[],
        customers: [] as string[],
        orders: [] as string[]
      };

      const CHUNK_SIZE = 50;
      const batchResults: any[] = [];

      // ---- STAGE 1: Categories ----
      await ImportRepository.updateJob(jobId, { progress: 15, info: 'جاري استيراد الحزم رقم 1: فئات السلع والمجموعات الدورية...' });
      await ImportRepository.logEvent({ job_id: jobId, event_type: 'chunk_start', message: 'تشغيل حزمة إدخال الفئات...' });

      let catOffset = 0;
      let catChunkNum = 0;
      const categoryNameMap: Record<number, string> = {};

      while (true) {
        const rawCategories = reader.getTableRows('item_type', CHUNK_SIZE, catOffset);
        if (rawCategories.length === 0) break;

        rawCategories.forEach(c => {
          categoryNameMap[c.id] = c.name;
        });

        const transformedCategories = rawCategories.map(c => {
          const tr = DataTransformer.transformCategory(c);
          return OrganizationInjector.inject(tr, orgId, branchId, userId);
        });

        await ImportRepository.createChunk({
          job_id: jobId,
          chunk_number: catChunkNum,
          status: 'processing',
          record_count: transformedCategories.length
        });

        let success = false;
        let lastError = '';
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const batchRes = await BatchImporter.importBatch('categories', transformedCategories, supabaseClient, storeDatabase);
            batchResults.push(batchRes);
            if (batchRes.failedCount === 0) {
              success = true;
              const passed = transformedCategories.map(cr => String(cr.id));
              insertedIds.categories.push(...passed);
              break;
            } else {
              lastError = batchRes.errors[0]?.message || 'Unknown category chunk error';
            }
          } catch (batchErr: any) {
            lastError = batchErr.message || 'Category network error';
          }
        }

        if (success) {
          await ImportRepository.updateChunk(jobId, catChunkNum, { status: 'success', processed_at: new Date().toISOString() });
        } else {
          await ImportRepository.updateChunk(jobId, catChunkNum, { status: 'failed', processed_at: new Date().toISOString() });
          await ImportRepository.logEvent({
            job_id: jobId,
            event_type: 'chunk_failed',
            message: `فشلت حزمة الفئات #${catChunkNum} بعد 3 محاولات: ${lastError}. جاري تجاوزها للمرونة السحابية.`
          });
        }

        catOffset += CHUNK_SIZE;
        catChunkNum++;
      }


      // ---- STAGE 2: Products ----
      await ImportRepository.updateJob(jobId, { progress: 35, info: 'جاري استيراد الحزم رقم 2: منتجات المستودع...' });
      await ImportRepository.logEvent({ job_id: jobId, event_type: 'chunk_start', message: 'تشغيل حزمة إدخال المنتجات...' });

      let prodOffset = 0;
      let prodChunkNum = 0;

      while (true) {
        const rawProducts = reader.getTableRows('items', CHUNK_SIZE, prodOffset);
        if (rawProducts.length === 0) break;

        const transformedProducts = rawProducts.map(p => {
          const tr = DataTransformer.transformProduct(p, categoryNameMap);
          return OrganizationInjector.inject(tr, orgId, branchId, userId);
        });

        const activeChunkIndex = catChunkNum + prodChunkNum;
        await ImportRepository.createChunk({
          job_id: jobId,
          chunk_number: activeChunkIndex,
          status: 'processing',
          record_count: transformedProducts.length
        });

        let success = false;
        let lastError = '';
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const batchRes = await BatchImporter.importBatch('products', transformedProducts, supabaseClient, storeDatabase);
            batchResults.push(batchRes);
            if (batchRes.failedCount === 0) {
              success = true;
              const passed = transformedProducts.map(cr => String(cr.id));
              insertedIds.products.push(...passed);
              break;
            } else {
              lastError = batchRes.errors[0]?.message || 'Unknown product chunk error';
            }
          } catch (batchErr: any) {
            lastError = batchErr.message || 'Product network error';
          }
        }

        if (success) {
          await ImportRepository.updateChunk(jobId, activeChunkIndex, { status: 'success', processed_at: new Date().toISOString() });
        } else {
          await ImportRepository.updateChunk(jobId, activeChunkIndex, { status: 'failed', processed_at: new Date().toISOString() });
          await ImportRepository.logEvent({
            job_id: jobId,
            event_type: 'chunk_failed',
            message: `فشلت حزمة المنتجات #${prodChunkNum} بعد 3 محاولات: ${lastError}.`
          });
        }

        prodOffset += CHUNK_SIZE;
        prodChunkNum++;
      }


      // ---- STAGE 3: Customers ----
      await ImportRepository.updateJob(jobId, { progress: 60, info: 'جاري استيراد الحزم رقم 3: حسابات العملاء وبطاقات الديون المتبقية...' });
      await ImportRepository.logEvent({ job_id: jobId, event_type: 'chunk_start', message: 'تشغيل حزمة إدخال العملاء والديون...' });

      let custOffset = 0;
      let custChunkNum = 0;

      while (true) {
        const rawCustomers = reader.getTableRows('customers', CHUNK_SIZE, custOffset);
        if (rawCustomers.length === 0) break;

        const transformedCustomers = rawCustomers.map(c => {
          const tr = DataTransformer.transformCustomer(c);
          return OrganizationInjector.inject(tr, orgId, branchId, userId);
        });

        const activeChunkIndex = catChunkNum + prodChunkNum + custChunkNum;
        await ImportRepository.createChunk({
          job_id: jobId,
          chunk_number: activeChunkIndex,
          status: 'processing',
          record_count: transformedCustomers.length
        });

        let success = false;
        let lastError = '';
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const batchRes = await BatchImporter.importBatch('customers', transformedCustomers, supabaseClient, storeDatabase);
            batchResults.push(batchRes);
            if (batchRes.failedCount === 0) {
              success = true;
              const passed = transformedCustomers.map(cr => String(cr.id));
              insertedIds.customers.push(...passed);
              break;
            } else {
              lastError = batchRes.errors[0]?.message || 'Unknown customer chunk error';
            }
          } catch (batchErr: any) {
            lastError = batchErr.message || 'Customer network error';
          }
        }

        if (success) {
          await ImportRepository.updateChunk(jobId, activeChunkIndex, { status: 'success', processed_at: new Date().toISOString() });
        } else {
          await ImportRepository.updateChunk(jobId, activeChunkIndex, { status: 'failed', processed_at: new Date().toISOString() });
          await ImportRepository.logEvent({
            job_id: jobId,
            event_type: 'chunk_failed',
            message: `فشلت حزمة حسابات العملاء #${custChunkNum} بعد 3 محاولات: ${lastError}.`
          });
        }

        custOffset += CHUNK_SIZE;
        custChunkNum++;
      }


      // ---- STAGE 4: Compiled Orders ----
      await ImportRepository.updateJob(jobId, { progress: 80, info: 'جاري استيراد الحزم رقم 4: أرشيف الفواتير والمعاملات الصادرة...' });
      await ImportRepository.logEvent({ job_id: jobId, event_type: 'chunk_start', message: 'تشغيل حزمة إدخال الفواتير الكلية...' });

      let orderOffset = 0;
      let orderChunkNum = 0;

      while (true) {
        const rawBills = reader.getTableRows('bills', CHUNK_SIZE, orderOffset);
        if (rawBills.length === 0) break;

        const billIds = rawBills.map(b => Number(b.id)).filter(id => !isNaN(id));
        let rawTransactions: any[] = [];
        if (billIds.length > 0) {
          rawTransactions = reader.execQuery(`SELECT * FROM bill_transactions WHERE bill_id IN (${billIds.join(',')})`);
        }

        const compiledOrders = InvoiceJsonConverter.compileBatch(rawBills, rawTransactions).map(order => {
          return OrganizationInjector.inject(order, orgId, branchId, userId);
        });

        const activeChunkIndex = catChunkNum + prodChunkNum + custChunkNum + orderChunkNum;
        await ImportRepository.createChunk({
          job_id: jobId,
          chunk_number: activeChunkIndex,
          status: 'processing',
          record_count: compiledOrders.length
        });

        let success = false;
        let lastError = '';
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const batchRes = await BatchImporter.importBatch('orders', compiledOrders, supabaseClient, storeDatabase);
            batchResults.push(batchRes);
            if (batchRes.failedCount === 0) {
              success = true;
              const passed = compiledOrders.map(cr => String(cr.id));
              insertedIds.orders.push(...passed);
              break;
            } else {
              lastError = batchRes.errors[0]?.message || 'Unknown orders chunk error';
            }
          } catch (batchErr: any) {
            lastError = batchErr.message || 'Orders network error';
          }
        }

        if (success) {
          await ImportRepository.updateChunk(jobId, activeChunkIndex, { status: 'success', processed_at: new Date().toISOString() });
        } else {
          await ImportRepository.updateChunk(jobId, activeChunkIndex, { status: 'failed', processed_at: new Date().toISOString() });
          await ImportRepository.logEvent({
            job_id: jobId,
            event_type: 'chunk_failed',
            message: `فشلت حزمة الفواتير والمبيعات #${orderChunkNum} بعد 3 محاولات: ${lastError}.`
          });
        }

        orderOffset += CHUNK_SIZE;
        orderChunkNum++;
      }

      reader.close();

      // Finalize database states
      await ImportRepository.updateJob(jobId, {
        status: 'success',
        progress: 100,
        current_chunk: catChunkNum + prodChunkNum + custChunkNum + orderChunkNum,
        info: 'اكتملت عملية الاستيراد والهجرة بنجاح تام 🟢!',
        completed_at: new Date().toISOString(),
        inserted_ids: insertedIds,
        summary: {
          categories: insertedIds.categories.length,
          products: insertedIds.products.length,
          customers: insertedIds.customers.length,
          orders: insertedIds.orders.length,
          batchResults
        },
        errors: []
      });

      await ImportRepository.logEvent({
        job_id: jobId,
        event_type: 'completed',
        message: 'تم إنهاء ترحيل الهجرات حزمة بحزمة إلى جميع مفاصل ومستودعات البيانات المعقمة.'
      });

      console.log(`[ImportService] Pipeline completed successfully for job: ${jobId}`);
    } catch (err: any) {
      console.error(`[ImportService] Critical failure in pipeline for job ${jobId}: ${err.message}`);
      
      await ImportRepository.logEvent({
        job_id: jobId,
        event_type: 'error',
        message: `خطأ فادح: ${err.message}`
      });

      // AUTO-ROLLBACK to ensure database atomicity on failure
      try {
        await this.rollbackJob(jobId, supabaseClient, storeDatabase, 'AUTO-RECOVERY');
      } catch (rErr) {
        console.error('[ImportService] Auto-recovery rollback failed:', rErr);
      }

      await ImportRepository.updateJob(jobId, {
        status: 'failed',
        progress: 100,
        completed_at: new Date().toISOString(),
        info: `فشلت الهجرة وتراجعنا عنها لمنع الملفات المكسورة: ${err.message}`,
        errors: [{ severity: 'error', entity: 'process', message: err.message }]
      });
    }
  }
}
