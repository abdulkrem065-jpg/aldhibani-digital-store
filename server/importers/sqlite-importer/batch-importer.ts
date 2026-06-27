import { WriteGateway } from '../../core/write-gateway';

const mapProductToDB = (p: any) => ({
  id: p.id,
  name_ar: p.nameAR,
  name_en: p.nameEN,
  description_ar: p.descriptionAR,
  description_en: p.descriptionEN,
  category: p.category,
  brand: p.brand,
  price_yer: Number(p.priceYER || 0),
  image_url: p.imageUrl,
  is_available: Boolean(p.isAvailable),
  stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : null,
  recharge_amount: p.rechargeAmount || null,
  organization_id: p.organization_id || null,
  product_image_url: p.product_image_url || null,
  is_ai_suggested: p.is_ai_suggested !== undefined ? Boolean(p.is_ai_suggested) : null,
  ai_suggested_url: p.ai_suggested_url || null,
});

export interface BatchImportResult {
  tableName: string;
  totalProcessedCount: number;
  insertedCount: number;
  failedCount: number;
  errors: Array<{ recordId: string | number; message: string }>;
}

export class BatchImporter {
  private static CHUNK_SIZE = 100;

  /**
   * Batches insertions or upserts into Supabase Tables, with dual sync fallback into the in-memory storeDatabase.
   */
  public static async importBatch(
    tableName: string,
    records: Record<string, any>[],
    supabaseClient: any,
    storeDatabase: any
  ): Promise<BatchImportResult> {
    const result: BatchImportResult = {
      tableName,
      totalProcessedCount: records.length,
      insertedCount: 0,
      failedCount: 0,
      errors: []
    };

    if (records.length === 0) return result;

    // Split into chunks of 100
    const chunks: Record<string, any>[][] = [];
    for (let i = 0; i < records.length; i += this.CHUNK_SIZE) {
      chunks.push(records.slice(i, i + this.CHUNK_SIZE));
    }

    console.log(`[BatchImporter] Commencing import of ${records.length} items into table "${tableName}" across ${chunks.length} batches.`);

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      
      // Divert product batch imports completely to WriteGateway
      if (tableName === 'products') {
        try {
          await WriteGateway.upsertProductsBatch(supabaseClient, chunk, storeDatabase);
          result.insertedCount += chunk.length;
        } catch (err: any) {
          console.error(`[BatchImporter] Products write gateway batch failed:`, err);
          result.failedCount += chunk.length;
          chunk.forEach(rec => {
            result.errors.push({
              recordId: rec.id || rec.legacy_id || 'unidentified-id',
              message: err.message || 'Write gateway batch error'
            });
          });
        }
        continue;
      }

      let hasErrorInBatch = false;
      let batchErrorMessage = '';

      // --- 1. Cloud-Level Persistence (Supabase) ---
      if (supabaseClient) {
        try {
          // Determine targeted endpoint
          let targetTable = tableName;
          
          // Align internal API keys with db structures
          if (tableName === 'categories') targetTable = 'categories';
          else if (tableName === 'products') targetTable = 'products';
          else if (tableName === 'orders') targetTable = 'orders';
          else if (tableName === 'debts') targetTable = 'debts';

          let finalChunk = chunk;
          if (tableName === 'products') {
            finalChunk = chunk.map(mapProductToDB);
          }

          const { error } = await supabaseClient.from(targetTable).upsert(finalChunk);
          if (error) {
            hasErrorInBatch = true;
            batchErrorMessage = error.message;
            if (tableName === 'products') {
              console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
            }
          }
        } catch (err: any) {
          hasErrorInBatch = true;
          batchErrorMessage = err.message;
        }
      }

      // --- 2. Local-Level Persistence (In-Memory Fallback & High-Fidelity UI Syncer) ---
      if (!hasErrorInBatch) {
        try {
          this.syncLocalMemoryStore(tableName, chunk, storeDatabase);
          result.insertedCount += chunk.length;
        } catch (e: any) {
          hasErrorInBatch = true;
          batchErrorMessage = `Memory sync error: ${e.message}`;
        }
      }

      if (hasErrorInBatch) {
        console.error(`[BatchImporter] Failures detected in table "${tableName}" batch #${index + 1}:`, batchErrorMessage);
        result.failedCount += chunk.length;
        chunk.forEach(rec => {
          result.errors.push({
            recordId: rec.id || rec.legacy_id || 'unidentified-id',
            message: batchErrorMessage
          });
        });
      }
    }

    return result;
  }

  /**
   * Synthesizes and mirrors data imports into active runtime memory arrays immediately.
   */
  private static syncLocalMemoryStore(tableName: string, chunk: Record<string, any>[], storeDatabase: any) {
    if (!storeDatabase) return;

    if (tableName === 'categories') {
      if (!storeDatabase.categories) storeDatabase.categories = [];
      for (const rec of chunk) {
        // Convert camel/snake-case for storeDatabase alignment
        const mappedCategory = {
          id: rec.id,
          nameAR: rec.nameAR || rec.name_ar,
          nameEN: rec.nameEN || rec.name_en || rec.nameAR,
          icon: rec.icon || 'Layers',
          color: rec.color || 'from-blue-500 to-indigo-600'
        };
        const idx = storeDatabase.categories.findIndex((c: any) => c.id === mappedCategory.id);
        if (idx !== -1) {
          storeDatabase.categories[idx] = { ...storeDatabase.categories[idx], ...mappedCategory };
        } else {
          storeDatabase.categories.push(mappedCategory);
        }
      }
    } 
    
    else if (tableName === 'products') {
      if (!storeDatabase.products) storeDatabase.products = [];
      for (const rec of chunk) {
        const mappedProduct = {
          id: rec.id,
          nameAR: rec.nameAR,
          nameEN: rec.nameEN || rec.nameAR,
          descriptionAR: rec.descriptionAR || '',
          descriptionEN: rec.descriptionEN || '',
          category: rec.category || 'عام',
          priceYER: Number(rec.priceYER) || 0,
          imageUrl: rec.imageUrl || '',
          isAvailable: rec.isAvailable !== false,
          stock: Number(rec.stock) || 0,
          brand: rec.brand || 'عام',
          rechargeAmount: rec.rechargeAmount || ''
        };
        const idx = storeDatabase.products.findIndex((p: any) => p.id === mappedProduct.id);
        if (idx !== -1) {
          storeDatabase.products[idx] = { ...storeDatabase.products[idx], ...mappedProduct };
        } else {
          storeDatabase.products.unshift(mappedProduct);
        }
      }
    } 
    
    else if (tableName === 'orders') {
      if (!storeDatabase.orders) storeDatabase.orders = [];
      for (const rec of chunk) {
        // Translate JSONB items array to frontend CartItem structure
        const cartItems = (rec.items_json || []).map((itm: any) => {
          const productLookup = storeDatabase.products?.find((p: any) => p.id === itm.product_id) || {
            id: itm.product_id,
            nameAR: 'صنف مستورد',
            nameEN: 'Imported Product',
            priceYER: itm.price,
            category: 'عام',
            imageUrl: '',
            isAvailable: true
          };
          return {
            product: productLookup,
            quantity: itm.qty || 1
          };
        });

        const mappedOrder = {
          id: rec.id,
          order_number: rec.order_number,
          items: cartItems,
          totalYER: Number(rec.total_yer) || 0,
          currency: 'YER' as const,
          status: rec.status || 'COMPLETED',
          createdAt: rec.created_at || new Date().toISOString(),
          notes: rec.notes || ''
        };
        const idx = storeDatabase.orders.findIndex((o: any) => o.id === mappedOrder.id);
        if (idx !== -1) {
          storeDatabase.orders[idx] = { ...storeDatabase.orders[idx], ...mappedOrder };
        } else {
          storeDatabase.orders.unshift(mappedOrder);
        }
      }
    } 
    
    else if (tableName === 'debts') {
      if (!storeDatabase.debts) storeDatabase.debts = [];
      for (const rec of chunk) {
        const mappedDebt = {
          id: rec.id,
          customerName: rec.customerName || rec.name,
          customerPhone: rec.customerPhone || rec.phone || '',
          totalDebtYER: Number(rec.totalDebtYER) || Number(rec.debit) - Number(rec.credit) || 0,
          notes: rec.notes || rec.description || '',
          updatedAt: rec.updatedAt || rec.created_at || new Date().toISOString()
        };
        const idx = storeDatabase.debts.findIndex((d: any) => d.id === mappedDebt.id);
        if (idx !== -1) {
          storeDatabase.debts[idx] = { ...storeDatabase.debts[idx], ...mappedDebt };
        } else {
          storeDatabase.debts.push(mappedDebt);
        }
      }
    }
  }
}
