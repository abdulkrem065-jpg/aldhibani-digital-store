# Qaroni AI Engine — Phase 0.5 Protocol Coverage Specification
## جدول تغطية بروتوكولات الحوكمة ودورة تشغيل المحرك والوكلاء المسؤولين عنها

---

## 1. خريطة التغطية الشاملة (Protocol & Agent Coverage Map)

يوضح الجدول التالي الترابط الكامل والمسؤوليات الدقيقة لكل مرحلة من دورة حياة المحرك، والبروتوكول الحاكم لها، والوكيل الذكي المكلف بالتنفيذ، والملف الفني المرجعي الذي يوثقها بالكامل:

| مرحلة دورة تشغيل المحرك (Engine Cycle Step) | البروتوكول المسؤول (Protocol) | الوكيل الذكي المسؤول (Responsible Agent) | الملف البرمجي والتوثيقي الحاكم (Documentation File) |
| :--- | :--- | :--- | :--- |
| **1. استكشاف وقراءة الهياكل والمخططات** | `ReadProtocol` | `Qaroni_Reader` | `qaroni-engine/protocols/ReadProtocol.md` |
| **2. التحليل الفني واحتساب الفجوات الهيكلية** | `AnalyzeProtocol` | `Qaroni_Analyzer` | `qaroni-engine/protocols/AnalyzeProtocol.md` |
| **3. صياغة الترحيلات وكتابة الأكواد والتعديلات** | `MigrationProtocol` | `Qaroni_MigrationBuilder` | `qaroni-engine/protocols/MigrationProtocol.md` |
| **4. المحاكاة والتحقق في بيئة الـ Sandbox** | `ValidationProtocol` | `Qaroni_Validator` | `qaroni-engine/protocols/ValidationProtocol.md` |
| **5. بوابة التفويض البشري وتوقيع المالك** | `EngineConstitution` & `EngineRBAC` | `State Machine Controller` (مراقبة النظام) | `qaroni-engine/constitution/EngineConstitution.md`<br>`qaroni-engine/permissions/EngineRBAC.md` |
| **6. البث الحي وتنزيل التحديثات للإنتاج** | `DeploymentProtocol` | `Qaroni_Executor` | `qaroni-engine/protocols/DeploymentProtocol.md` |
| **7. فحص الاستقرار البعدي والإنقاذ الطارئ** | `RollbackProtocol` | `Qaroni_Auditor` | `qaroni-engine/protocols/RollbackProtocol.md` |
| **8. الرقابة والتدقيق وحساب الامتثال الدستوري** | `AuditProtocol` | `Qaroni_Auditor` | `qaroni-engine/protocols/AuditProtocol.md` |

---

## 2. مصفوفة التحقق الأمني لحالات المهام (Task State Verification)

يقوم المحرك بربط كل خطوة من خطوات التغطية أعلاه بحالة محددة ومحصورة في دورة حياة المهمة لضمان عزل وتدرج العمليات بنجاح:

* **المرحلة 1 & 2** ──◄ تنتقل بالطلب لحالة: `Analyzing`
* **المرحلة 3** ──◄ تنتقل بالطلب لحالة: `Planning`
* **المرحلة 4** ──◄ تنتقل بالطلب لحالة: `Validating`
* **المرحلة 5** ──◄ تنتقل بالطلب لحالة: `WaitingApproval`
* **المرحلة 6** ──◄ تنتقل بالطلب لحالة: `Deploying` ثم `Verifying`
* **المرحلة 7** ──◄ تنتقل بالطلب لحالة: `RolledBack` (في حال الفشل) أو `Completed` (عند النجاح المطلق)

---
**تمت مراجعة مصفوفة التغطية ومطابقتها مع المتطلبات التنظيمية لبيئة قاروني.**
