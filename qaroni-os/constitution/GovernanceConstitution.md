# دستور وقواعد الحوكمة وإدارة القرارات (Governance Constitution)
## الميثاق الأعلى لتوجيه العمليات الهندسية، اتخاذ القرارات، ومتابعة سلسلة تتبع القرار

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (QOC Article IV: Knowledge & Change Governance)
  → **Article IV.1** (Decision Trace Mandatory Path)
  → **ADR-003** (Constitutional Architecture Specification)
  → **Governance** (Establishing /qaroni-os/ Directory Hierarchy)
  → **Implementation** (Create /qaroni-os/constitution/GovernanceConstitution.md)
  → **Audit** (Technical Audit Protocol Log #2026-07-01-GOV-CONST)

---

## المادة الأولى: سلسلة تتبع القرار الإلزامية (Article I: The Mandatory Decision Trace Chain)

1.1. **التعريف بسلسلة التتبع (Decision Trace Definition):**  
تمثل سلسلة تتبع القرار (Decision Trace) العمود الفقري لإثبات الشرعية البرمجية والتصميمية داخل نظام قاروني. لا يحق لأي جزء تشغيلي أو وكيل ذكاء اصطناعي كتابة سطر برمجيات أو تعديل قاعدة بيانات دون تسجيل تسلسلي واضح ومكتوب ومطابق للمسار الحاكم التالي:

```
            Operating Constitution (الدستور التشغيلي الحاكم)
                          │
                          ▼
             Governance Layer (طبقة الحوكمة والتحقق)
                          │
                          ▼
            ADR (Architectural Decision Record - سجل القرارات)
                          │
                          ▼
              Architecture Layer (مخطط وتصميم الطبقات)
                          │
                          ▼
               Specification Module (وثائق المواصفات)
                          │
                          ▼
               Decision (القرار الهندسي اللحظي)
                          │
                          ▼
                 Execution (التنفيذ الفعلي الحقيقي)
```

1.2. **حظر التنفيذ منزوع الهوية (Anonymity Hard Block):**  
تقوم البوابات الأمنية الحاكمة بوقف وحظر أي تعديل فوري في حال خلوه من سلسلة تتبع القرار المعتمدة، ويُصنف الإجراء كخرق دستوري ويتم إغلاق الجلسة وتسجيل الحادثة في سجل التهديدات.

---

## المادة الثانية: مطابقة واستقرار المعرفة البرمجية (Article II: Knowledge & Specification Consistency)

2.1. **فحص المطابقة الدورية (Knowledge Consistency Validation):**  
يقوم النظام بتشغيل فحوصات دورية ومستمرة للتأكد من مطابقة جميع ملفات الشرح، وسجلات ADR، ووثائق المواصفات البرمجية مع التركيب الفعلي للأكواد في مستودع GitHub وبنية الجداول في Supabase.

2.2. **إدارة سجلات القرارات المعمارية (Architectural Decision Records - ADR):**  
تُخزن جميع سجلات القرارات المعمارية داخل المجلد الحاكم المخصص `/qaroni-os/adr/` بتسمية تسلسلية صارمة تبدأ بـ `ADR-001` وتصاعدياً. يجب كتابة كل قرار بصيغة واضحة تذكر السياق، المشكلة، البدائل، والحل المعتمد ومطابقتها للدستور.

2.3. **منع التعديلات التلقائية للمعرفة (No Automatic Knowledge Modification):**  
يُحظر على أي وكيل ذكاء اصطناعي تعديل سجلات ADR أو وثائق الشرح بشكل تلقائي لمعالجة عدم اتساق البرمجيات. في حال وجود تعارض برمي، يجب إعداد تقرير تعارض معرفي (Knowledge Conflict Report) وتقديمه للمالك البشري للبت النهائي فيه.

---

## المادة الثالثة: حوكمة التغيير وإدارة الملفات التاريخية (Article III: Change Management & Historical Logging)

3.1. **حفظ وتخليد القرارات التاريخية (Immutable Audit History):**  
تُحفظ كافة القرارات التاريخية وسجل التغييرات المعمارية والبرمجية في ملف بروتوكول التدقيق الدائم `/qaroni-engine/protocols/AuditProtocol.md`. تمنع سياسات الحماية مسح أو تعديل أو استبدال محتوى هذا الملف نهائياً.

3.2. **مراجعة وتحديث الدستور وقوانين الحوكمة (Constitutional Revision Rules):**  
لا يمكن تنقيح أو تعديل أي مادة من مواد دستور الحوكمة أو الدساتير الفرعية إلا بمرسوم دستوري جديد مصادق وموقع رقمياً من المالك البشري بنسبة تأكيد 100%.

---
**Constitutional Architect & System Guardian**  
*Qaroni AI Operating System Control Center*
