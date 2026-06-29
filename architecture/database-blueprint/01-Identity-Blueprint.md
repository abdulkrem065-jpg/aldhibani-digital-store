# 👤 مخطط مجال الهوية الرقمية (Identity Database Blueprint)

## 1. Purpose (الهدف الفني)
تنظيم وتأمين حسابات المستخدمين والموظفين والفاعلين الإداريين وتشبيكها بهيكل عزل المنظمات والفروع. يضمن البلوبرنت عدم تشتت الحسابات واستخدام المفاتيح الأجنبية والربط التلقائي بـ `auth.users` السحابي لمنع العشوائية.

---

## 2. Tables (الجداول التابعة للمجال)
* `staff_users` (ملفات الموظفين الموحدة)
* `organization_members` (روابط العضويات والفروع للموظفين)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `staff_users`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key (مربوط بـ auth.users) |
| `full_name` | VARCHAR(150) | No | None | الاسم الكامل باللغة الفصحى أو الرسمية |
| `email` | VARCHAR(150) | No | None | البريد الإلكتروني الموحد |
| `phone_number` | VARCHAR(30) | Yes | NULL | رقم الهاتف للاتصال السريع |
| `is_active` | BOOLEAN | No | TRUE | مؤشر نشاط الحساب التشغيلي |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | وقت إنشاء الحساب |
| `updated_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | وقت تحديث الحساب |

### جدول `organization_members`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key لمنظمة العضوية |
| `branch_id` | UUID | Yes | NULL | Foreign Key لفرع العمل الأساسي |
| `staff_id` | UUID | No | None | Foreign Key لحساب الموظف في staff_users |
| `is_active` | BOOLEAN | No | TRUE | مؤشر فعالية الموظف في هذه المنظمة |
| `joined_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | وقت التعيين بالفرع أو المنظمة |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `staff_users.id`
  * `organization_members.id`
* **Foreign Keys:**
  * `organization_members.staff_id` يشير إلى `staff_users.id` (مع حذف مرجعي مقيد RESTRICT).
  * `organization_members.organization_id` يشير إلى `organizations.id` (مع حذف مرجعي متتالي CASCADE).
  * `organization_members.branch_id` يشير إلى `branches.id` (مع حذف مرجعي مقيد RESTRICT).
* **Candidate/Unique Keys:**
  * `staff_users.email` (فريد على مستوى النظام بالكامل).
  * `organization_members` (مزيج `organization_id` + `staff_id` + `branch_id` فريد لمنع تكرار نفس عضوية الموظف في نفس الفرع).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة (واحد إلى متعدد) من `staff_users` إلى `organization_members`:** الموظف البشري الواحد يمتلك عضوية عمل أو أكثر في منظمات وفروع مختلفة للتنقل بينها.

```text
[ staff_users ] 
       1
       │
       ▼ 1..*
[ organization_members ] ─── 1..* ──► [ organizations ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مفروض على جميع الأعمدة الحيوية والأساسية مثل `full_name`, `email`, `organization_id`, `staff_id`.
* **CHECK:** 
  * التحقق من تماسك البريد الإلكتروني (بصيغة بريد نظامي وصحيح).
* **UNIQUE:** فريد على البريد الإلكتروني للموظفين.

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس فريد على `staff_users.email` لتسريع التحقق والبحث أثناء الولوج.
  * فهرس مدمج على `organization_members(organization_id, branch_id, staff_id)` لتسريع مطابقة الصلاحيات وعزل البيانات اللحظي.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول الهوية.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `is_fully_assigned`: حقل منطقي يتم استخراجه برمجياً عبر التحقق مما إذا كان الموظف يمتلك فرعاً تشغيلياً نشطاً واحداً على الأقل.

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `sync_updated_at_staff_users`:
  * **الهدف:** تحديث الحقل المالي والزمني `updated_at` فور تعديل أي خلية في ملف الموظف.
  * **متى يعمل:** قبل تحديث السطر (`BEFORE UPDATE`) تلقائياً.

---

## 11. Functions Required (الدوال المطلوبة)
* `get_active_staff_branches`:
  * **الهدف:** جرد جميع الفروع التي يمتلك فيها الموظف عضوية نشطة وموثقة.
  * **Input:** `staff_id` (UUID).
  * **Output:** جدول يحتوي على معرفات الفروع والمنظمات التابعة.

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل حسب المستأجر (Organization Dimension):**
  * جدول `staff_users` محمي بحيث يستطيع الموظف قراءة بياناته الفردية فقط.
  * جدول `organization_members` معزول تماماً؛ يستعلم الموظف عن العضويات التي ينتمي إليها، والمسؤول يستعلم فقط عن أعضاء منظمته بموجب الـ Token والـ JWT الفيدرالي.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول `staff_users` وجدول `organization_members` للرقابة الصارمة بنظام الـ Trigger التلقائي. يتم تدوين التغيير وحفظ الهوية التاريخية فور التحديث أو تجميد الموظفين.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** الاسم الكامل والوظيفة والفرع النشط للموظف أثناء المحادثات الإدارية لتوفير إجابات ذات طابع إنساني.
* **ما يمنع إرساله:** يمنع كلياً إرسال المعرفات الأمنية الصارمة للموظفين، أو الـ JWT، أو كلمات المرور أو أي بيانات تخص توثيق الدخول السحابي الموحد.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `identity.staff_user.created` (عند إنشاء حساب موظف جديد لتنبيه الـ RBAC).
  * `identity.membership.suspended` (عند إلغاء تفعيل عضوية موظف لقطع جلسات العمل الفعالة فورياً).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* يتم الاحتفاظ بحجم البيانات لـ `organization_members` صغيراً وخفيفاً لضمان سرعة البحث والمطابقة في كل عملية استعلام برمجية تطلبها بقية الجداول والسياسات.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* إمكانية ربط حساب الموظف الموحد بأنظمة الهوية البيومترية وحسابات الدخول الموحد التابعة للمؤسسات الكبرى (SSO) عبر حقول توسعية مخصصة في جدول `staff_users` دون كسر العضويات الفروع القائمة.
