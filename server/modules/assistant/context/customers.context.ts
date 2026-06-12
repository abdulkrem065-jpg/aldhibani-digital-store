import { DebtRecord } from '../../../../src/types';

export async function getCustomersContext(storeDatabase: any, supabase: any, orgId?: string): Promise<string> {
  try {
    let debts: DebtRecord[] = [];

    // Prioritize querying Supabase if connected
    if (supabase) {
      const query = supabase.from('debts').select('*');
      if (orgId) {
        query.eq('org_id', orgId);
      }
      const { data, error } = await query;
      if (!error && data) {
        debts = data;
      } else {
        debts = storeDatabase.debts || [];
      }
    } else {
      debts = storeDatabase.debts || [];
    }

    const totalCustomersWithDebts = debts.length;
    const totalDebtConsolidatedYER = debts.reduce((sum, d) => sum + (d.totalDebtYER || 0), 0);
    
    // Sort customers by highest debt amount
    const highestDebtors = [...debts]
      .sort((a, b) => b.totalDebtYER - a.totalDebtYER)
      .slice(0, 10);

    const contextJSON = {
      summary: {
        total_customers_with_debt: totalCustomersWithDebts,
        total_debt_consolidated_yer: totalDebtConsolidatedYER,
        average_debt_per_customer_yer: totalCustomersWithDebts > 0 ? Math.round(totalDebtConsolidatedYER / totalCustomersWithDebts) : 0
      },
      top_debtors: highestDebtors.map(d => ({
        customer_name: d.customerName,
        customer_phone: d.customerPhone,
        total_debt_yer: d.totalDebtYER,
        last_updated: d.updatedAt,
        notes: d.notes || ''
      }))
    };

    return JSON.stringify(contextJSON, null, 2);
  } catch (error: any) {
    console.error('Error compiling customers context:', error);
    return JSON.stringify({ error: 'Failed to compile customers context: ' + error.message });
  }
}
