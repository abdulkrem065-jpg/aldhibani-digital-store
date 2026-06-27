import { supabase } from '../supabase';

export async function executeTransaction<T>(operations: (client: any) => Promise<T>): Promise<T> {
    const { data, error } = await supabase.rpc('begin_transaction');
    if (error) throw new Error(`فشل بدء المعاملة: ${error.message}`);
    try {
        const result = await operations(supabase);
        await supabase.rpc('commit_transaction');
        return result;
    } catch (err) {
        await supabase.rpc('rollback_transaction');
        throw err;
    }
}
