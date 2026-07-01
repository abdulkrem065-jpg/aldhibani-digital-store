export interface ReasoningSnapshot {
  confidenceScore: number; // 0 - 100
  riskScore: number; // 0 - 100
  simulationDetails: string;
  consequences: string[];
  passedReasoning: boolean;
  blockReason?: string;
}

export class ReasoningCore {
  private static confidenceThreshold = 85;

  /**
   * Evaluates consequences and outcomes before committing database or logic mutations.
   * Assigns cognitive confidence and risk scores, blocking if below threshold (85).
   */
  public static evaluateOperation(
    agentName: string,
    operationType: string,
    payload: any,
    decisionTrace: string
  ): ReasoningSnapshot {
    let confidenceScore = 95; // Default safe baseline
    let riskScore = 10;
    const consequences: string[] = [];
    let simulationDetails = 'Simulation output status: SECURE';
    let passedReasoning = true;
    let blockReason = '';

    const sqlStr = (payload.sql || '').toUpperCase();

    // Rule 1: Evaluate raw SQL queries for dangerous actions (DROP, TRUNCATE, ALTER USER)
    if (sqlStr.includes('DROP') || sqlStr.includes('TRUNCATE') || sqlStr.includes('ALTER USER')) {
      confidenceScore = 40; // Extremely low confidence for destructive commands
      riskScore = 95;
      consequences.push('خطر مفرط: تدمير أو تعطيل محتمل لجداول قاعدة البيانات والاتساق الهيكلي.');
    }

    // Rule 2: Evaluate absence of WHERE clause in writes/deletions (risk check)
    if ((operationType === 'write' || operationType === 'delete') && !payload.id && !sqlStr.includes('WHERE')) {
      confidenceScore = 65;
      riskScore = 80;
      consequences.push('تأثير شامل: تعديل أو حذف السجلات بشكل جماعي دون فلترة صريحة.');
    }

    // Rule 3: Check RLS declaration in table creations
    if (sqlStr.includes('CREATE TABLE') && !sqlStr.includes('ROW LEVEL SECURITY') && !sqlStr.includes('RLS')) {
      confidenceScore = 75;
      riskScore = 70;
      consequences.push('ثغرة أمنية: إنشاء جدول جديد على Supabase دون تفعيل جدار حماية الصفوف RLS.');
    }

    // Rule 4: Check if unauthorized roles are trying to alter specification modules
    if (agentName !== 'Qaroni_Architect' && operationType === 'specification_update') {
      confidenceScore = 50;
      riskScore = 85;
      consequences.push('خرق الصلاحيات: محاولة تعديل Specifications من وكيل غير مصرح له كمهندس النظام.');
    }

    // Evaluate confidence threshold (85)
    if (confidenceScore < this.confidenceThreshold) {
      passedReasoning = false;
      blockReason = `❌ تم الحظر بواسطة محرك التفكير والتقييم المعرفي (Confidence ${confidenceScore}% < ${this.confidenceThreshold}%). المخاطر المكتشفة: \n- ${consequences.join('\n- ')}`;
    }

    simulationDetails = `تمت محاكاة العملية بنجاح. معدل الثقة المعرفية: ${confidenceScore}%. مستوى الخطورة الإجمالي: ${riskScore}%.`;

    return {
      confidenceScore,
      riskScore,
      simulationDetails,
      consequences,
      passedReasoning,
      blockReason
    };
  }
}
