# دستور وقواعد حوكمة البيانات (Database Constitution)
## القواعد العليا لحماية هياكل الجداول، تكامل العلاقات، وسياسات عزل البيانات

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (QOC Article II: Core & Operating Principles)
  → **Article II.3** (Four-Environment Isolation Principle)
  → **ADR-003** (Constitutional Architecture Specification)
  → **Governance** (Establishing /qaroni-os/ Directory Hierarchy)
  → **Implementation** (Create /qaroni-os/constitution/DatabaseConstitution.md)
  → **Audit** (Technical Audit Protocol Log #2026-07-01-DB-CONST)

---

## المادة الأولى: سلامة ونزاهة هياكل البيانات (Article I: Schema Integrity & Consistency Rules)

1.1. **التعريف بالهيكل (Schema Sanctity):**  
تمثل قاعدة بيانات نظام قاروني (المستضافة على Supabase) المستودع النهائي للحقيقة واستقرار النظام. لا يُسمح بتعديل أو ترقية هيكل الجداول والبيانات إلا من خلال سيناريوهات المراجعة والتعديل الآمن الموثقة بالدستور.

1.2. **إلزامية العلاقات والمفاتيح الخارجية (Mandatory Foreign Keys):**  
تخضع كل الجداول لقواعد صارمة تفرض تكامل المفاتيح الخارجية (FK Constraints) ومنع الإدخال العشوائي. يُمنع إنشاء جداول منزوعة العلاقات أو معلقة بدون كشافات (Indexes) ومفاتيح تعريفية أساسية.

1.3. **التحقق المعرفي التلقائي (Knowledge Validation):**  
قبل تفعيل أي جدول، يجب على محرك التحقق المعرفي فحص كود SQL ومطابقته لملف `Knowledge_Validation_Rules.md` للتأكد من وجود الكشافات وسرعة الاستعلام وعدم وجود أي ثغرات تكرار بنيوي.

---

## المادة الثانية: سياسات عزل البيانات والأمان (Article II: Row Level Security & Multi-Tenant Isolation)

2.1. **الحماية التلقائية للبيانات (Mandatory Row Level Security - RLS):**  
أي جدول يتم إنشاؤه داخل النظام، سواء كان جدولاً أمنياً أو تشغيلياً أو تطبيقياً، يجب أن يتضمن سياسة حماية على مستوى السطر (RLS) مفعلة بشكل صريح ونهائي. يُمنع منعاً باتاً استثناء أي جدول من سياسات RLS.

2.2. **عزل مستأجري النظام (Multi-Tenant Row Partitioning):**  
يجب عزل بيانات الشركات أو الجهات المختلفة المشتركة بالنظام (Tenants) برمجياً عبر عمود معرف مستقر (`tenant_id`). لا يُسمح بأي استعلام أو جلب بيانات يتجاوز مرشح العزل للجهة المستعلمة.

2.3. **حصر الصلاحيات (Least Privilege Access):**  
يمنع استخدام الحساب الإداري الأعلى (postgres/service_role) للاستعلامات المباشرة من واجهات المستخدمين. تنحصر صلاحيات الوصول عبر الأدوار (RBAC) وبشكل انتقائي حسب رتبة العميل وصلاحيات وكيله.

---

## المادة الثالثة: حوكمة التعديلات والترقيات البرمجية (Article III: Migration Governance)

3.1. **حظر التعديل المباشر (No Direct Schema Manipulation):**  
يُحظر إجراء تعديلات هيكلية مباشرة على جداول قاعدة الإنتاج دون المرور بـ:
1. **الترقية الآمنة في الفرع المعزول (Sandbox Migration).**
2. **محاكاة الإدخال والقراءة للتأكد من سلامة الخصائص البرمجية.**
3. **توليد بصمة نزاهة فريدة (Integrity Hash) ودمجها مع RunID النشط.**

3.2. **قواعد التعافي الفوري والترميم الذاتي (Auto-Recovery & Rollback):**  
في حال فشل عملية ترقية هيكلية أثناء تطبيقها في بيئة الإنتاج، يتم إلغاء العملية تلقائياً (Transaction Rollback)، ويهرع النظام لاستعادة النسخة الاحتياطية السليمة واستدعاء المطور البشري فوراً.

---
**Constitutional Architect & System Guardian**  
*Qaroni AI Operating System Control Center*
