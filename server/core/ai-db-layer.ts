import { supabase } from '../supabase';

export async function logAudit(action: string, details: any, status: 'success' | 'error' = 'success') {
    return await supabase.from('ai_audit_logs').insert({
        action,
        details,
        status,
        created_at: new Date().toISOString()
    });
}

export async function logUsage(agentName: string, tokens: number) {
    return await supabase.from('ai_usage').insert({
        agent_name: agentName,
        tokens_used: tokens,
        timestamp: new Date().toISOString()
    });
}

export async function createConversation(userId: string, title: string) {
    const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title: title, status: 'active' })
        .select()
        .single();
        
    if (error) {
        await logAudit('create_conversation', { userId, title, error: error.message }, 'error');
    }
    return { data, error };
}

export async function addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string) {
    const { data: msgData, error: msgError } = await supabase
        .from('ai_messages')
        .insert({ conversation_id: conversationId, role, content })
        .select()
        .single();
        
    if (msgError) {
        await logAudit('add_message', { conversationId, role, error: msgError.message }, 'error');
    } else {
        await supabase
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);
    }
    return { data: msgData, error: msgError };
}

export async function logToolUsage(conversationId: string, toolName: string, input: any, output: any) {
    return await supabase.from('ai_tools').insert({
        conversation_id: conversationId,
        tool_name: toolName,
        input_data: input,
        output_data: output
    });
}
