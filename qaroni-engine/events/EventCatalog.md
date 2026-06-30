# Qaroni AI Engine — Event Catalog Specification
## كتالوج ومواصفات الأحداث الحاكمة للعمليات والاندماج بالمحرك

تدار الحركة التشغيلية لجميع وكلاء ومكونات **Qaroni AI Engine** بصورة تفاعلية عبر تتبع ونشر الأحداث (Event-Driven Architecture) لضمان اتساق قرارات الاندماج والترحيل الفني.

---

## 1. قائمة الأحداث الـ 9 الحاكمة (The 9 Core Events)

### 📌 1. `SchemaReadCompleted` (اكتملت معاينة الهيكل)
* **المصدر (Publisher):** الوكيل `Qaroni_Reader`
* **المستلم (Subscriber):** الوكيل `Qaroni_Analyzer` والمكون `State Machine`
* **الوصف التقني:** يُنشر فور نجاح التقصي وقراءة المخططات والـ API لـ Supabase والتأكد من مطابقة كشف الجداول النشطة.

### 📌 2. `SchemaAnalysisCompleted` (اكتمل التحليل الفني للفجوات)
* **المصدر (Publisher):** الوكيل `Qaroni_Analyzer`
* **المستلم (Subscriber):** الوكيل `Qaroni_MigrationBuilder` والمكون `State Machine`
* **الوصف التقني:** يُنشر عند اكتمال حساب الفروقات الفنية وصياغة كشف الفجوات (Gap Analysis Report) ومقارنتها بالدستور الأعلى للمحرك.

### 📌 3. `MigrationCreated` (اكتملت صياغة وبناء الترحيلات والمسودات)
* **المصدر (Publisher):** الوكيل `Qaroni_MigrationBuilder`
* **المستلم (Subscriber):** الوكيل `Qaroni_Validator` والمكون `State Machine`
* **الوصف التقني:** يُنشر فور بناء كود الترحيل (Up) وكود التراجع التلقائي (Down) وملفات الـ TypeScript المصاحبة.

### 📌 4. `ValidationSucceeded` (نجح التحقق الفني والمحاكاة)
* **المصدر (Publisher):** الوكيل `Qaroni_Validator`
* **المستلم (Subscriber):** المكون `State Machine` بانتظار التفويض البشري
* **الوصف التقني:** يُنشر عند اجتياز ملفات التحديث لكافة فحوصات الـ Sandbox والـ Linter واختبارات العلاقات وعزل الـ RLS بنسبة 100%.

### 📌 5. `ValidationFailed` (فشل التحقق الفني والمحاكاة)
* **المصدر (Publisher):** الوكيل `Qaroni_Validator`
* **المستلم (Subscriber):** الوكيل `Qaroni_MigrationBuilder` (لتفعيل حلقة الإصلاح) و `State Machine`
* **الوصف التقني:** يُنشر عند فشل أي فحص أو محاكاة في الـ Sandbox للبدء في تفعيل حلقة التغذية الراجعة والإصلاح التلقائي (Feedback & Repair Loop).

### 📌 6. `ApprovalReceived` (تم استلام التفويض البشري)
* **المصدر (Publisher):** واجهة التحكم والتحقق للمالك (Control Interface)
* **المستلم (Subscriber):** الوكيل `Qaroni_Executor` والمكون `State Machine`
* **الوصف التقني:** يُنشر فور إدخال المالك للتوقيع الرقمي ورمز الـ OTP المشفر والموافقة على خطة الترحيل المقترحة.

### 📌 7. `DeploymentCompleted` (اكتمل البث والتنفيذ السحابي للإنتاج)
* **المصدر (Publisher):** الوكيل `Qaroni_Executor`
* **المستلم (Subscriber):** الوكيل `Qaroni_Auditor` والمكون `State Machine`
* **الوصف التقني:** يُنشر عند نجاح تطبيق الترحيلات على Supabase ودمج الأكواد بـ GitHub وتحديث كاش الـ API.

### 📌 8. `RollbackCompleted` (اكتمل التراجع التلقائي والإنقاذ)
* **المصدر (Publisher):** الوكيل `Qaroni_Auditor`
* **المستلم (Subscriber):** المكون `State Machine` وإخطار المالك الفوري
* **الوصف التقني:** يُنشر فور نجاح تطبيق خطة التراجع (Down Script) وإلغاء التغييرات الهيكلية وإرجاع قاعدة البيانات والأكواد السابقة لنقطة الصفر المستقرة بنجاح.

### 📌 9. `AuditCompleted` (اكتملت الرقابة والتدقيق العام)
* **المصدر (Publisher):** الوكيل `Qaroni_Auditor`
* **المستلم (Subscriber):** المكون `State Machine` وسجل التقارير النهائي
* **الوصف التقني:** يُنشر عند إغلاق دورة التدقيق وحساب مؤشر الامتثال الدستوري (Compliance Score) وكتابة التقرير النهائي في مجلد السجلات وتحديث حالة المهمة لـ `Completed`.

---

## 2. بنية البيانات النموذجية للأحداث (Standard Event Schema Spec)

تحفظ الأحداث برمجياً داخل حافلة المهام ككائنات مهيكلة غير قابلة للتعديل وتحتوي على التفاصيل الحاكمة التالية:

```json
{
  "event_id": "UUID",
  "task_id": "UUID",
  "event_type": "SchemaReadCompleted | SchemaAnalysisCompleted | ...",
  "timestamp": "ISO8601 UTC Timestamp",
  "publisher": "Qaroni_Reader | Qaroni_Analyzer | ...",
  "payload": {
    "run_id": "UUID",
    "status": "success | failed",
    "decision_trace": "Constitution (Article X) -> ADR-XXX -> Specification (Module Y) -> Action (Migration Z)",
    "details": {}
  }
}
```

---
**تم إقرار كتالوج الأحداث الـ 9 الحاكمة ليكون لغة التفاهم والتكامل الأساسية بين وكلاء المحرك.**
