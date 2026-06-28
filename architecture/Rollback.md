# 🔄 دليل خطط التراجع وحماية البيانات (V5 Rollback & Recovery Guide)

يهدف هذا الدليل إلى تأمين مسار تراجع آمن ومجرب لكل مرحلة من مراحل خارطة طريق الـ V5 (Roadmap). ويُحظر برمجياً وعقائدياً البدء في تنفيذ أي تعديلات هيكلية أو برمجية في قاعدة البيانات الحية دون إعداد واختبار سيناريو التراجع الخاص بها مسبقاً.

## 🛡️ الإرشادات العامة قبل التنفيذ (Pre-execution Safety)
1. **النسخ الاحتياطي الفوري:** يجب أخذ نسخة احتياطية كاملة (Full Database Dump) للـ Schema والبيانات قبل إطلاق أي Migration.
2. **عزل الصيانة:** للمراحل الكبرى، يجب تفعيل علامة الصيانة للمؤسسة المعنية عبر `DM-ORG-004` لمنع كتابة بيانات جديدة أثناء الترقية.
3. **التراجع الذري:** يجب كتابة ملف التراجع (`rollback.sql`) بصيغة ذرية تعيد الحالة تماماً كما كانت دون التسبب في فقدان أو تشويه البيانات القائمة.

---

## 📋 مصفوفة خطط التراجع لكل مرحلة (Rollback Matrix)

### 🔹 V5-PHASE-0: Architecture Freeze
* **طريقة التراجع:** لا تطلب قاعدة البيانات أي تراجع لعدم وجود تعديلات هيكلية حية. التراجع هنا يقتصر على أرشفة أو تعديل وثائق المعايير في مجلد `/architecture`.

### 🔹 V5-PHASE-1: Identity Domain (Migration of UUIDs)
* **كود الأمر المعني:** `CMD-V5P1-002` (Deterministic UUID Migration)
* **المخاطر:** فقدان روابط المفاتيح الخارجية (Foreign Key Mismatches) عند تحويل الأعضاء والوظائف إلى `UUID`.
* **سيناريو وسكريبت التراجع الفوري (Rollback SQL Script):**
  في حال حدوث خطأ أثناء تحويل الأعمدة السبعة المرتبطة بجدول الموظفين، يتم تنفيذ السكريبت التالي فوراً للتراجع الشامل وإعادتها لنوع TEXT الأصلي:
  ```sql
  -- تراجع شامل وإعادة الحقول السبعة إلى نوع TEXT الأصلي
  ALTER TABLE public.staff_users ALTER COLUMN id TYPE TEXT USING id::text;
  ALTER TABLE public.orders ALTER COLUMN cashier_id TYPE TEXT USING cashier_id::text;
  ALTER TABLE public.organization_members ALTER COLUMN staff_user_id TYPE TEXT USING staff_user_id::text;
  ALTER TABLE public.ai_conversations ALTER COLUMN staff_user_id TYPE TEXT USING staff_user_id::text;
  ALTER TABLE public.ai_usage_events ALTER COLUMN staff_user_id TYPE TEXT USING staff_user_id::text;
  ALTER TABLE public.audit_log ALTER COLUMN actor_id TYPE TEXT USING actor_id::text;
  ALTER TABLE public.rbac_staff_role_assignments ALTER COLUMN staff_user_id TYPE TEXT USING staff_user_id::text;
  ALTER TABLE public.rbac_staff_user_roles ALTER COLUMN staff_user_id TYPE TEXT USING staff_user_id::text;
  COMMENT ON SCHEMA public IS 'Rollback CMD-V5P1-002 executed: All identity columns reverted to TEXT.';
  ```
  1. الاحتفاظ بالأعمدة القديمة المؤقتة (مثل `old_staff_user_text`) لضمان عدم فقدان مرجعية السجلات.
  2. إعادة ربط الجداول بالمفاتيح النصية السابقة عبر سكريبت استعادة العلاقات في حال فشل مطابقة الـ UUIDs.
  3. استعادة النسخة الاحتياطية للعلاقات.

### 🔹 V5-PHASE-2: Tenant Isolation & Core Clean-up
* **المخاطر:** قفل الحسابات بالكامل عن طريق الخطأ بموجب سياسة الـ Fail-Closed.
* **سيناريو التراجع:**
  1. الاحتفاظ بنسخة احتياطية للسياسات السابقة (`old_policies_backup.sql`).
  2. في حال حدوث عطل في العزل، يتم تعطيل السياسات المعطلة مؤقتاً بالـ `DROP POLICY` وإعادة تفعيل السياسات القديمة الاحتياطية لتأمين استمرار الخدمة مؤقتاً ريثما يتم التحقق.

### 🔹 V5-PHASE-3: RBAC Hardening (Lockdown)
* **المخاطر:** قفل صلاحيات الباكيند ومنع الـ service_role من التعديل لخلل في السياسات.
* **سيناريو التراجع:**
  1. تشغيل أمر استعادة صلاحيات الكتابة الفورية لـ `authenticated` على جداول الصلاحيات (`GRANT INSERT, UPDATE ON TABLE public.rbac_roles TO authenticated;`).
  2. التراجع عن تفعيل RLS القسري (`ALTER TABLE public.rbac_roles DISABLE ROW LEVEL SECURITY;`).

### 🔹 V5-PHASE-4: Customer Architecture & Portal
* **المخاطر:** كشف فواتير التاجر للعملاء عن طريق الخطأ عبر الـ Read-only Portal أو العكس (تعطيل تصفح السلة للزوار).
* **سيناريو التراجع:**
  - استعادة سياسات `SELECT` السابقة وإرجاع عتبة تصفية العملاء إلى التحقق البسيط القائم على الإيميل فقط.

### 🔹 V5-PHASE-5: AI Architecture & Memory Policy
* **المخاطر:** حذف دردشات وسياقات عمل نشطة بسبب مغالطة في شرط الـ 30 يوماً في الـ pg_cron.
* **سيناريو التراجع:**
  - استعادة السجلات المحذوفة مؤقتاً من جداول الحفظ الموازية وإيقاف وظيفة pg_cron مؤقتاً لتعديل سياق التصفية والتقادم.

### 🔹 V5-PHASE-6: Business Rules Engine
* **المخاطر:** كراش لطلبات البيع والـ POS بالكامل نتيجة لقيود المخازن والتسعير السلبي المتشددة.
* **سيناريو التراجع:**
  - تعطيل الـ Validation Triggers المسببة للاختناق برمجياً (`ALTER TABLE public.inventory_transactions DISABLE TRIGGER ALL;`) ريثما يتم إصلاح منطق الفحص.

### 🔹 V5-PHASE-7: Workflow Machine
* **المخاطر:** جمود دورات حياة المستندات المالية والطلبات نتيجة حظر الحذف والتحركات العشوائية.
* **سيناريو التراجع:**
  - تفعيل حالة طوارئ تجاوز الـ State Machine للمشرفين لتمكين الفتح اليدوي للصفقات المعلقة أو المعطلة.

### 🔹 V5-PHASE-8: Centralized Audit Triggering
* **المخاطر:** تدهور أداء قاعدة البيانات وزيادة زمن الاستجابة بسبب ثقل عمليات الـ Write في الـ Audit Log.
* **سيناريو التراجع:**
  - إيقاف تفعيل الـ audit triggers مؤقتاً بضربة واحدة (`DISABLE TRIGGER`) على الجداول لإرجاع الأداء لوضعه الطبيعي ودراسة التعديل بصورة منفصلة.

### 🔹 V5-PHASE-9: Performance & Caching
* **المخاطر:** زيادة تضخم الفهارس (Indexes Blockage) وإبطاء عمليات التحديث نتيجة لفهرسة غير صحيحة.
* **سيناريو التراجع:**
  - إسقاط الفهارس التجريبية فوراً (`DROP INDEX CONCURRENTLY if exists index_name;`).

### 🔹 V5-PHASE-10: Ultimate Compliance Scanner
* **المخاطر:** إطلاق إنذارات أمنية كاذبة ومستمرة تؤدي لتوقف أو تعطيل العمليات تلقائياً.
* **سيناريو التراجع:**
  - تعطيل وظيفة الفحص والمسح التلقائي وخفض مستوى الحساسية (Sensitivity Threshold) لحين ضبط القواعد.
