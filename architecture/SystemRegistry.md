# 🗄️ سجل المعايير والترقيم الفيدرالي لـ V5

يُحظر استخدام أي اسم، جدول، دالة، أو سياسة داخل قاعدة البيانات دون كودها الترقيمي القياسي المسجل هنا.

## 📊 الجداول ونطاق البيانات (Data Model - DM)
* `DM-IDN-001`: `auth.users` (جدول الهوية والمستخدمين لـ Supabase)
* `DM-ORG-001`: `public.organizations` (جدول مستأجري المنظمات)
* `DM-ORG-002`: `public.organization_branches` (جدول فروع المنظمات)
* `DM-ORG-003`: `public.organization_members` (جدول الموظفين والأعضاء الحقيقيين)
* `DM-ORG-004`: `public.organization_maintenance_flags` (جدول علامات الصيانة)
* `DM-CST-001`: `public.customers` (جدول بيانات العملاء المسجلين)
* `DM-PRD-001`: `public.products` (جدول كتالوج السلع والمنتجات)
* `DM-INV-001`: `public.inventory_transactions` (جدول حركات المخازن الفورية)
* `DM-SAL-001`: `public.orders` (جدول فواتير ومستندات المبيعات)
* `DM-ACC-001`: `public.debts` (جدول الدفاتر المالية والديون الآجلة)
* `DM-AUD-001`: `public.audit_log` (جدول الرقابة والتدقيق التاريخي المركزي)
* `DM-RBC-001`: `public.rbac_roles` (جدول أدوار النظام الحاكمة)
* `DM-RBC-002`: `public.rbac_permissions` (جدول الصلاحيات الذرية)
* `DM-RBC-003`: `public.rbac_staff_user_roles` (جدول ربط الأدوار بالموظفين)
* `DM-AI-001` : `public.ai_conversations` (جدول جلسات المحادثات الذكية)
* `DM-AI-002` : `public.ai_messages` (جدول رسائل الدردشة الموثقة)
* `DM-AI-003` : `public.ai_knowledge_base` (جدول قواعد المعرفة المتجهية RAG)

## ⚙️ الدوال الذرية (Functions - FN)
* `FN-ORG-001`: `public.is_org_member(uuid)` (فحص عضوية ومطابقة الموظف بالمنظمة)
* `FN-ORG-002`: `public.is_org_maintenance(uuid)` (فحص تفعيل وضع الصيانة للمستأجر)
* `FN-RBC-001`: `public.authorize(text)` (محرك فحص الصلاحيات المركزي للباكيند)
* `FN-AI-001` : `public.match_knowledge(vector, float, uuid)` (البحث الدلالي المتجهي المعزول RAG)

## 🛡️ السياسات الأمنية (Policies - POL)
* `POL-ORG-001`: عزل الفروع لـ `organization_members`.
* `POL-PRD-001`: عزل رؤية كتالوج المنتجات بناءً على معرّف المنظمة.
* `POL-SAL-001`: عزل الفواتير ثنائي الأبعاد (منظمة + فرع).
* `POL-RBC-001`: تفعيل `FORCE RLS` المطلق على جداول الصلاحيات.
