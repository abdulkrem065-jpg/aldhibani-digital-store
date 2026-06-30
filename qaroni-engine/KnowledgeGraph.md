# Qaroni AI Engine — Knowledge Graph & Decision Trace System
## نظام تخطيط المعرفة وتتبع مسارات القرار المعماري والدستوري

---

## 1. فلسفة المعرفة والتحكم المزدوج (Unified Knowledge Base)
يربط الـ **Knowledge Graph** دستور النظام بالقرارات التصميمية (ADRs) والمواصفات الفنية (Specifications)، لضمان تتبع أثر أي تعديل برمجي أو بنيوي بشكل خطي ودقيق.

```
       [EngineConstitution.md] (Immutable Law)
                 │
                 ▼
          [Architectural Decision Records - ADRs]
                 │
                 ▼
          [System Specifications / Modules]
                 │
                 ▼
       [KnowledgeGraph - Decision Trace]
                 │
                 ▼
       [Executed Migrations & Database State]
```

---

## 2. معيار تتبع مسار القرار الإلزامي (Decision Trace Format)
يُمنع على أي وكيل ذكي إجراء أي تعديل أو استعلام دون تدوين وتسجيل مسار القرار الكامل في الحقل المخصص له (`decision_trace`).

**الصيغة المعيارية للتتبع (Decision Trace Standard):**
`Constitution` ──► `ADR` ──► `Specification` ──► `Migration` ──► `Execution`

* **الدستور (Constitution):** بند الدستور الحاكم (مثل: *المبدأ الأول: الأمان وحرمة البيانات*).
* **القرار المعماري (ADR):** المعمارية المستند عليها (مثل: *ADR-104: Tenant Isolation*).
* **المواصفات (Specification):** الوحدة البرمجية المتأثرة (مثل: *Module Products*).
* **الترحيل (Migration):** كود الترحيل أو مسودة التحديث (مثل: *Create Table tenant_configs*).
* **التنفيذ (Execution):** البث والتشغيل النهائي على الإنتاج بعد تجاوز بوابات الأمان.

---

## 3. تصنيف ومواءمة الوحدات الـ 20 في بوابات التدفق (The 20 Reconciled Modules)
تم دمج وتنسيق الـ 20 وحدة تشغيلية للمحرك في 4 منصات حوكمة رئيسية لضمان عدم الازدواجية:

### المنصة الأولى: الحوكمة والدستور (Governance & Core Rules)
1. **Module 1: Constitution Gate** - مطابقة الطلبات مع المبادئ الدستورية الأربعة.
2. **Module 2: RBAC Matrix Guard** - مطابقة صلاحيات الوكيل مع مصفوفة الصلاحيات.
3. **Module 3: ADR Alignment Check** - التحقق من توافق العملية مع سجلات القرارات المعمارية.
4. **Module 4: Safety Override Block** - حظر العمليات وتفعيل الرد الفوري عند رصد خرق دستوري.
5. **Module 5: Human Approval Gate** - التحقق من رموز OTP وتفويضات المشرفين البشريين.

### المنصة الثانية: العزل والبيئات (Isolation & Environments)
6. **Module 6: Knowledge Validation** - تدقيق العلاقات (FK Integrity)، الكشافات (Indexes)، والاتساق.
7. **Module 7: Supabase Branch Sandboxing** - ترحيل التغييرات إلى فرع Supabase المعزول كبيئة فحص أولى.
8. **Module 8: Docker Runtime Simulation** - محاكاة بيئة الخادم وصلاحيات المنافذ (Container Port Rules).
9. **Module 9: Production Live Gateway** - تمرير التغييرات المقبولة فقط إلى بيئة الإنتاج الحية.
10. **Module 10: Central Event Bus Sync** - مزامنة إشارات البدء والتوقف بين البيئات الأربع.

### المنصة الثالثة: الترحيل والتحقق الذاتي (Migration & Self-Validation)
11. **Module 11: SQL Syntax Guard** - تدقيق لغة الاستعلامات ومنع أوامر الحذف أو التدمير العشوائية.
12. **Module 12: RLS Validation Engine** - التحقق الإجباري من تفعيل جدار حماية الصفوف (Row Level Security).
13. **Module 13: Test Insert Verification** - اختبار إدراج سجلات وهمية آمنة بعد الترحيل مباشرة لضمان التكامل.
14. **Module 14: Test Select Constraints** - استرجاع السجل المضاف والتحقق من قيود المفاتيح الأجنبية وقيمها.
15. **Module 15: Clean-up & Post-Audit Verification** - حذف السجلات الاختبارية وتنظيف الجداول وإعادة البناء الذاتي.

### المنصة الرابعة: استمرارية الحالة والتدقيق (State Continuity & Auditing)
16. **Module 16: State Machine Logger** - حفظ الخطوات الحالية ونقاط الفحص في الجدول `qaroni_engine_state`.
17. **Module 17: Automatic Recovery Engine** - استعادة حالة المحرك من آخر نقطة فحص آمنة بعد التوقف الفجائي.
18. **Module 18: Auto-Rollback Handler** - إرجاع النظام تلقائياً للحالة المستقرة السابقة عند فشل أي اختبار جودة.
19. **Module 19: Immutable Audit Trail** - كتابة تفاصيل العمليات وفشلها وحظرها في `AuditProtocol.md`.
20. **Module 20: Github - Supabase Sync Bus** - مزامنة ملفات الكود المصدرية بـ GitHub وحالة البيانات الحية بـ Supabase.

---
**تم إقرار الـ Knowledge Graph ليكون المرجع والتوثيق الحاكم لبوابة حوكمة القرارات وتتبع أثر العمليات.**
