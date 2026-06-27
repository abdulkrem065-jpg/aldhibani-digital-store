import { getGeminiClient } from './gemini-singleton';
import { logUsage, logAudit, createConversation, addMessage, logToolUsage } from './ai-db-layer';
import { supabase } from '../supabase';

const agents: Record<string, (context: any, input: any) => Promise<any>> = {};

export function registerAgent(name: string, handler: (context: any, input: any) => Promise<any>) {
    agents[name] = handler;
}

export async function executeAgent(agentName: string, input: any, userId?: string): Promise<any> {
    if (!agents[agentName]) {
        throw new Error(`❌ خطأ معماري: الوكيل الذكي [${agentName}] غير مسجل بالنواة المركزية.`);
    }

    const context = {
        gemini: getGeminiClient(),
        userId,
        createConversation,
        addMessage,
        logToolUsage,
        logAudit,
        logUsage,
        supabase
    };

    await logAudit(`agent_start_${agentName}`, { input });

    try {
        const result = await agents[agentName](context, input);
        await logAudit(`agent_success_${agentName}`, { input, result: 'تمت العملية بنجاح' });
        return result;
    } catch (error: any) {
        await logAudit(`agent_error_${agentName}`, { input, error: error.message }, 'error');
        throw error;
    }
}
