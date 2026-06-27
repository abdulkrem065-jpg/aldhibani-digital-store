import crypto from 'crypto';
import { SqliteReader } from '../../../server/importers/sqlite-importer/sqlite-reader';
import { UUIDGenerator } from '../../../server/importers/sqlite-importer/uuid-generator';
import { DataTransformer } from '../../../server/importers/sqlite-importer/data-transformer';
import { OrganizationInjector } from '../../../server/importers/sqlite-importer/organization-injector';
import { InvoiceJsonConverter } from '../../../server/importers/sqlite-importer/invoice-json-converter';
import { ImportValidator } from '../../../server/importers/sqlite-importer/import-validator';
import { BatchImporter } from '../../../server/importers/sqlite-importer/batch-importer';
import { WriteGateway } from '../../../server/core/write-gateway';
import { ImportRepository, DBImportJob } from '../repositories/import.repository';

export class ImportService {
  private static instance: ImportService | null = null;
  private activeBuffer: Buffer | null = null;
  private isProcessingQueue = false;
  private CHUNK_SIZE = 100;

  private constructor() {
    // Memory-only chunk-based ETL processor with no background interval threads
  }

  public static getInstance(): ImportService {
    if (!this.instance) {
      this.instance = new ImportService();
    }
    return this.instance;
  }

  /**
   * Safe save upload file buffer in memory cache.
   */
  public async saveUpload(buffer: Buffer): Promise<any> {
    this.activeBuffer = buffer;
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

    return {
      success: true,
      fileSize: buffer.length,
      tablesCount: metadata.length,
      tables: metadata.map(t => ({ name: t.name, rows: t.rowCount }))
    };
  }

  /**
   * Preflight scanner. Accept fileUrl option to bypass filesystem.
   */
  public async analyzeBackup(fileUrl?: string): Promise<any> {
    let buffer = this.activeBuffer;
    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          this.activeBuffer = buffer;
        }
      } catch (fetchErr: any) {
        console.warn('Failed preflight URL stream:', fetchErr.message);
      }
    }

    if (!buffer) {
      throw new Error('لم يتم العثور على ملف مرفوع للتحليل. من فضلك ارفع النسخة الاحتياطية أولاً.');
    }

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
   * Real record preview. Accept fileUrl option to bypass filesystem.
   */
  public async previewRecords(limit: number = 5, fileUrl?: string): Promise<any> {
    let buffer = this.activeBuffer;
    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          this.activeBuffer = buffer;
        }
      } catch (fetchErr: any) {
        console.warn('Failed preview URL stream:', fetchErr.message);
      }
    }

    if (!buffer) {
      throw new Error('لا يوجد ملف نشط لعرض معاينته.');
    }

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
   * STRICT: Requires fileUrl, organization_id, branch_id and created_by.
   */
  public async startImport(
    fileUrl: string,
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

    if (!fileUrl) {
      throw new Error('رابط ملف قاعدة البيانات (fileUrl) مطلوب لبدء عملية النقل.');
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
      current_offset: 0,
      current_stage: 'categories',
      info: 'تمت جدولة المهمة سحابياً داخل قاعدة بيانات Supabase...',
      created_by: userId,
      summary: {
        fileUrl,
        categories: 0,
        products: 0,
        customers: 0,
        orders: 0
      },
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

    return created.id;
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
        try {
          await WriteGateway.deleteProductsBatch(supabaseClient, inserted.products, storeDatabase);
        } catch (err) {
          console.error('[Import rollback products error]', err);
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
   * Process exactly ONE chunk of current stage in the active job.
   * This is called by GET /api/import/status/:jobId or POST /api/import/sqlite/continue
   * to ensure serverless compliance with ZERO background lingering threads.
   */
  public async processNextChunk(
    jobId: string,
    supabaseClient: any,
    storeDatabase: any
  ): Promise<any> {
    const job = await ImportRepository.getJob(jobId);
    if (!job) {
      throw new Error('لم يتم العثور على مهمة استيراد تابعة لهذا المعرّف.');
    }

    // Check if job finished already
    if (job.status === 'success' || job.status === 'failed' || job.status === 'rolled_back') {
      return this.formattedJob(job);
    }

    // Parse the summary metadata state
    let summary: any = job.summary;
    if (typeof summary === 'string') {
      summary = JSON.parse(summary);
    }
    if (!summary) {
      summary = {};
    }

    const fileUrl = summary.fileUrl || job.summary?.fileUrl;
    if (!fileUrl) {
      throw new Error('رابط ملف قاعدة البيانات (fileUrl) مفقود من تقرير المهمة.');
    }

    // Optimistic Concurrency check
    const now = Date.now();
    const lastUpdate = job.updated_at ? new Date(job.updated_at).getTime() : 0;
    if (job.status === 'processing' && now - lastUpdate < 3000) {
      // Return immediately if polled too fast and already processing
      return this.formattedJob(job);
    }

    // Mark job as processing
    await ImportRepository.updateJob(jobId, {
      status: 'processing',
      current_offset: (job.current_offset !== undefined && job.current_offset !== null) ? Number(job.current_offset) : (summary.offset || 0),
      current_stage: job.current_stage || summary.stage || 'categories',
      info: 'جاري تشغيل المعالجة التدفقية المتتابعة للبيانات...'
    });

    let reader: SqliteReader | null = null;
    try {
      // 1. Fetch the file to an in-memory buffer
      let buffer: Buffer;
      if (fileUrl === 'in-memory-cached' && this.activeBuffer) {
        buffer = this.activeBuffer;
      } else {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`تعذر تحميل الملف من الرابط المرفق: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        // cache it for active session
        this.activeBuffer = buffer;
      }

      // Verify SQLite magic header first
      if (buffer.length < 16 || buffer.toString('utf-8', 0, 15) !== 'SQLite format 3') {
        throw new Error('الملف المرفوع ليس ملف قاعدة بيانات SQLite صالح أو تالف.');
      }

      // Initialize the in-memory reader
      reader = new SqliteReader(buffer);
      await reader.load();

      const orgId = job.organization_id;
      const branchId = job.branch_id;
      const userId = job.created_by;

      // Ensure totalCounts are pre-calculated
      if (!summary.totalCounts) {
        const metadata = await reader.getTablesMetadata();
        summary.totalCounts = {
          categories: metadata.find((t: any) => t.name === 'item_type')?.rowCount || 0,
          products: metadata.find((t: any) => t.name === 'items')?.rowCount || 0,
          customers: metadata.find((t: any) => t.name === 'customers')?.rowCount || 0,
          orders: metadata.find((t: any) => t.name === 'bills')?.rowCount || 0
        };
        summary.stage = 'categories';
        summary.offset = 0;
        summary.categoryNameMap = {};
        summary.counts = {
          categories: 0,
          products: 0,
          customers: 0,
          orders: 0
        };
      }

      // Parse inserted ids accumulator from the database
      let insertedIds: any = job.inserted_ids;
      if (typeof insertedIds === 'string') {
        insertedIds = JSON.parse(insertedIds);
      }
      if (!insertedIds || !insertedIds.categories) {
        insertedIds = {
          categories: [],
          products: [],
          customers: [],
          orders: []
        };
      }

      const stage = job.current_stage || summary.stage || 'categories';
      let offset = (job.current_offset !== undefined && job.current_offset !== null) ? Number(job.current_offset) : (summary.offset || 0);
      const CHUNK_SIZE = 50;

      console.log(`[ImportService-Serverless] Processing Job ${jobId}: Stage ${stage}, Offset ${offset}`);

      if (stage === 'categories') {
        const total = summary.totalCounts.categories;
        const rawCategories = reader.getTableRows('item_type', CHUNK_SIZE, offset);

        if (rawCategories.length > 0) {
          // Keep mapping for products stage
          rawCategories.forEach((c: any) => {
            summary.categoryNameMap[c.id] = c.name;
          });

          const transformed = rawCategories.map((c: any) => {
            const tr = DataTransformer.transformCategory(c);
            return OrganizationInjector.inject(tr, orgId, branchId, userId);
          });

          // Perform batch insert
          let lastError = '';
          let success = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const batchRes = await BatchImporter.importBatch('categories', transformed, supabaseClient, storeDatabase);
              if (batchRes.failedCount === 0) {
                success = true;
                insertedIds.categories.push(...transformed.map((cr: any) => String(cr.id)));
                summary.counts.categories += transformed.length;
                break;
              } else {
                lastError = batchRes.errors[0]?.message || 'Unknown categories chunk error';
              }
            } catch (err: any) {
              lastError = err.message || 'Categories network error';
            }
          }

          if (!success) {
            throw new Error(`تعذر استيراد فئة المنتجات: ${lastError}`);
          }

          offset += CHUNK_SIZE;
          summary.offset = offset;

          const percent = total > 0 ? Math.min(25, Math.round((offset / total) * 25)) : 25;
          await ImportRepository.updateJob(jobId, {
            progress: percent,
            current_chunk: (job.current_chunk || 0) + 1,
            current_offset: offset,
            current_stage: stage,
            info: `تم استيراد ${summary.counts.categories} من فئات المنتجات بنجاح (${percent}%)...`,
            summary,
            inserted_ids: insertedIds
          });
        }

        // If we consumed all (or category check completed)
        if (rawCategories.length === 0 || offset >= total) {
          summary.stage = 'products';
          summary.offset = 0;
          await ImportRepository.updateJob(jobId, {
            progress: 25,
            current_offset: 0,
            current_stage: 'products',
            info: 'اكتملت فئات المنتجات، يمر الآن إلى المنتجات...',
            summary,
            inserted_ids: insertedIds
          });
        }

      } else if (stage === 'products') {
        const total = summary.totalCounts.products;
        const rawProducts = reader.getTableRows('items', CHUNK_SIZE, offset);

        if (rawProducts.length > 0) {
          const transformed = rawProducts.map((p: any) => {
            const tr = DataTransformer.transformProduct(p, summary.categoryNameMap);
            return OrganizationInjector.inject(tr, orgId, branchId, userId);
          });

          let lastError = '';
          let success = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const batchRes = await BatchImporter.importBatch('products', transformed, supabaseClient, storeDatabase);
              if (batchRes.failedCount === 0) {
                success = true;
                insertedIds.products.push(...transformed.map((cr: any) => String(cr.id)));
                summary.counts.products += transformed.length;
                break;
              } else {
                lastError = batchRes.errors[0]?.message || 'Unknown product chunk error';
              }
            } catch (err: any) {
              lastError = err.message || 'Products network error';
            }
          }

          if (!success) {
            throw new Error(`تعذر استيراد المنتجات: ${lastError}`);
          }

          offset += CHUNK_SIZE;
          summary.offset = offset;

          const percent = total > 0 ? 25 + Math.min(25, Math.round((offset / total) * 25)) : 50;
          await ImportRepository.updateJob(jobId, {
            progress: percent,
            current_chunk: (job.current_chunk || 0) + 1,
            current_offset: offset,
            current_stage: stage,
            info: `تم استيراد ${summary.counts.products} من منتجات المستودع بنجاح (${percent}%)...`,
            summary,
            inserted_ids: insertedIds
          });
        }

        if (rawProducts.length === 0 || offset >= total) {
          summary.stage = 'customers';
          summary.offset = 0;
          await ImportRepository.updateJob(jobId, {
            progress: 50,
            current_offset: 0,
            current_stage: 'customers',
            info: 'اكتملت المنتجات بالكامل، جاري الانتقال إلى حسابات العملاء...',
            summary,
            inserted_ids: insertedIds
          });
        }

      } else if (stage === 'customers') {
        const total = summary.totalCounts.customers;
        const rawCustomers = reader.getTableRows('customers', CHUNK_SIZE, offset);

        if (rawCustomers.length > 0) {
          const transformed = rawCustomers.map((c: any) => {
            const tr = DataTransformer.transformCustomer(c);
            return OrganizationInjector.inject(tr, orgId, branchId, userId);
          });

          let lastError = '';
          let success = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const batchRes = await BatchImporter.importBatch('customers', transformed, supabaseClient, storeDatabase);
              if (batchRes.failedCount === 0) {
                success = true;
                insertedIds.customers.push(...transformed.map((cr: any) => String(cr.id)));
                summary.counts.customers += transformed.length;
                break;
              } else {
                lastError = batchRes.errors[0]?.message || 'Unknown customer chunk error';
              }
            } catch (err: any) {
              lastError = err.message || 'Customers network error';
            }
          }

          if (!success) {
            throw new Error(`تعذر استيراد حسابات العملاء: ${lastError}`);
          }

          offset += CHUNK_SIZE;
          summary.offset = offset;

          const percent = total > 0 ? 50 + Math.min(25, Math.round((offset / total) * 25)) : 75;
          await ImportRepository.updateJob(jobId, {
            progress: percent,
            current_chunk: (job.current_chunk || 0) + 1,
            current_offset: offset,
            current_stage: stage,
            info: `تم استيراد ${summary.counts.customers} من حسابات وديون العملاء بنجاح (${percent}%)...`,
            summary,
            inserted_ids: insertedIds
          });
        }

        if (rawCustomers.length === 0 || offset >= total) {
          summary.stage = 'orders';
          summary.offset = 0;
          await ImportRepository.updateJob(jobId, {
            progress: 75,
            current_offset: 0,
            current_stage: 'orders',
            info: 'اكتملت حسابات العملاء، يمر الآن إلى استيراد الفواتير والمبيعات...',
            summary,
            inserted_ids: insertedIds
          });
        }

      } else if (stage === 'orders') {
        const total = summary.totalCounts.orders;
        const rawBills = reader.getTableRows('bills', CHUNK_SIZE, offset);

        if (rawBills.length > 0) {
          const billIds = rawBills.map((b: any) => Number(b.id)).filter((id: number) => !isNaN(id));
          let rawTransactions: any[] = [];
          if (billIds.length > 0) {
            rawTransactions = reader.execQuery(`SELECT * FROM bill_transactions WHERE bill_id IN (${billIds.join(',')})`);
          }

          const transformed = InvoiceJsonConverter.compileBatch(rawBills, rawTransactions).map((order: any) => {
            return OrganizationInjector.inject(order, orgId, branchId, userId);
          });

          let lastError = '';
          let success = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const batchRes = await BatchImporter.importBatch('orders', transformed, supabaseClient, storeDatabase);
              if (batchRes.failedCount === 0) {
                success = true;
                insertedIds.orders.push(...transformed.map((cr: any) => String(cr.id)));
                summary.counts.orders += transformed.length;
                break;
              } else {
                lastError = batchRes.errors[0]?.message || 'Unknown orders chunk error';
              }
            } catch (err: any) {
              lastError = err.message || 'Orders network error';
            }
          }

          if (!success) {
            throw new Error(`تعذر استيراد فواتير المبيعات: ${lastError}`);
          }

          offset += CHUNK_SIZE;
          summary.offset = offset;

          const percent = total > 0 ? 75 + Math.min(20, Math.round((offset / total) * 20)) : 95;
          await ImportRepository.updateJob(jobId, {
            progress: percent,
            current_chunk: (job.current_chunk || 0) + 1,
            current_offset: offset,
            current_stage: stage,
            info: `تم استيراد ${summary.counts.orders} من فواتير المبيعات بنجاح (${percent}%)...`,
            summary,
            inserted_ids: insertedIds
          });
        }

        if (rawBills.length === 0 || offset >= total) {
          summary.stage = 'completed';
          summary.offset = total;

          // All stages done successfully! Create the final success payload.
          await ImportRepository.updateJob(jobId, {
            status: 'success',
            progress: 100,
            current_offset: total,
            current_stage: 'completed',
            info: 'اكتملت عملية الاستيراد والهجرة بنجاح تام 🟢!',
            completed_at: new Date().toISOString(),
            inserted_ids: insertedIds,
            summary: {
              categories: insertedIds.categories.length,
              products: insertedIds.products.length,
              customers: insertedIds.customers.length,
              orders: insertedIds.orders.length,
              fileUrl
            },
            errors: []
          });

          await ImportRepository.logEvent({
            job_id: jobId,
            event_type: 'completed',
            message: 'تم إنهاء ترحيل الهجرات حزمة بحزمة إلى جميع مفاصل ومستودعات البيانات المعقمة.'
          });
        }
      }

      reader.close();
      reader = null;

      // Fetch latest state to return
      const updatedJob = await ImportRepository.getJob(jobId);
      return this.formattedJob(updatedJob || job);

    } catch (err: any) {
      console.error(`[ImportService] Critical failure in chunk step for job ${jobId}: ${err.message}`);
      
      if (reader) {
        reader.close();
      }

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

      const failedJob = await ImportRepository.getJob(jobId);
      return this.formattedJob(failedJob || job);
    }
  }

  private formattedJob(job: any) {
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
}
