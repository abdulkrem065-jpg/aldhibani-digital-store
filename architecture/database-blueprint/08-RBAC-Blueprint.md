# 🔐 مخطط مجال التحكم في الصلاحيات المبني على الأدوار (RBAC Database Blueprint)

## 1. Purpose (الهدف الفني)
تنظيم وحماية وتأمين سجل تعيينات الأدوار للموظفين وتفويض الصلاحيات الذرية الدقيقة، وفرض قيود الرقابة الأمنية للتأكد من مبدأ "الحد الأدنى من الصلاحيات" وحظر التلاعب بالنظم خارج بروتوكول زراعة قاعدة البيانات.

---

## 2. Tables (الجداول التابعة للمجال)
* `rbac_roles` (الأدوار والمسميات الوظيفية للشركة)
* `rbac_permissions` (الصلاحيات الذرية والمزروعة برمجياً بالسيادة)
* `rbac_role_permissions` (روابط دمج الصلاحيات بالأدوار)
* `rbac_staff_user_roles` (تعيينات الأدوار للموظفين البشر بالفرع)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `rbac_roles`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `role_name` | VARCHAR(100) | No | None | اسم الدور المالي أو التشغيلي (مثل: cashier, accountant) |
| `is_custom` | BOOLEAN | No | FALSE | مؤشر ما إذا كان الدور مخصصاً للشركة وليس نظامياً عطلاً |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ التأسيس |

### جدول `rbac_permissions`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `permission_key` | VARCHAR(150) | No | None | الرمز والاسم البرمجي الدقيق للصلاحية (مثل: sales.create, stock.adjust) |
| `description` | TEXT | Yes | NULL | وصف تفصيلي لوظيفة الصلاحية البرمجية |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ الزراعة المركزية بالنظام |

### جدول `rbac_role_permissions`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `role_id` | UUID | No | None | Foreign Key للدور التشغيلي |
| `permission_id` | UUID | No | None | Foreign Key للصلاحية الذرية المقترنة |

### جدول `rbac_staff_user_roles`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة لضمان عزل الإسناد |
| `staff_id` | UUID | No | None | Foreign Key للموظف البشري المعين |
| `role_id` | UUID | No | None | Foreign Key للدور المسند إليه |
| `assigned_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ تفويض الدور المالي |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `rbac_roles.id`
  * `rbac_permissions.id`
  * `rbac_role_permissions.id`
  * `rbac_staff_user_roles.id`
* **Foreign Keys:**
  * `rbac_roles.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `rbac_role_permissions.role_id` يشير إلى `rbac_roles.id` (مع CASCADE).
  * `rbac_role_permissions.permission_id` يشير إلى `rbac_permissions.id` (مع RESTRICT).
  * `rbac_staff_user_roles.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `rbac_staff_user_roles.staff_id` يشير إلى `staff_users.id` (مع CASCADE).
  * `rbac_staff_user_roles.role_id` يشير إلى `rbac_roles.id` (مع RESTRICT).
* **Candidate/Unique Keys:**
  * `rbac_roles` (مزيج `organization_id` + `role_name` فريد لمنع تكرار المسمى الوظيفي للمستأجر).
  * `rbac_permissions.permission_key` (فريد مطلقاً لتفادي تداخل صلاحيات البرمجة).
  * `rbac_role_permissions` (مزيج `role_id` + `permission_id` فريد لمنع تكرار الصلاحية لنفس الدور).
  * `rbac_staff_user_roles` (مزيج `staff_id` + `role_id` فريد لمنع تكرار نفس التعيين للموظف).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة (متعدد إلى متعدد) من `rbac_roles` إلى `rbac_permissions` عبر `rbac_role_permissions`:** لربط حزم الصلاحيات بالأدوار.
* **علاقة (متعدد إلى متعدد) من `staff_users` إلى `rbac_roles` عبر `rbac_staff_user_roles`:** لتعيين وتفويض الأدوار المتعددة للموظف الواحد بالفرع.

```text
[ rbac_roles ] ◄─── 1:N ───► [ rbac_role_permissions ] ◄─── N:1 ───► [ rbac_permissions ]

[ staff_users ] ◄── 1:N ───► [ rbac_staff_user_roles ] ◄── N:1 ───► [ rbac_roles ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مطبق على معرفات الجداول، الصلاحيات، المفاتيح، والتعيينات لضمان أمان النظام وصيغ العبور.
* **CHECK:**
  * خلو مفتاح الصلاحية `permission_key` من الفراغات والرموز العشوائية لسلامة مطابقة الباكيند.

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس مدمج وفريد على `rbac_roles(organization_id, role_name)`.
  * فهرس فريد مطلق على `rbac_permissions.permission_key` لتسريع عمليات الفحص الأمني للباكيند.
  * فهرس مدمج على `rbac_role_permissions(role_id, permission_id)`.
  * فهرس مدمج على `rbac_staff_user_roles(organization_id, staff_id, role_id)` لتسريع مزامنة الصلاحيات والتحقق منها مع كل طلب مستخدم.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول الصلاحيات والأدوار.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `has_permission_key`: دالة منطقية يتم احتسابها برمجياً وتطابق ما إذا كان للموظف البشري أي دور وظيفي يمتلك الصلاحية الذرية المحددة للتحقق السريع في الواجهات.

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `assert_safe_role_assignment`:
  * **الهدف:** التحقق والحظر من قيام موظف عادي بإسناد أدوار وصلاحيات تتعدى رتبته أو صلاحياته الحالية في جدول `rbac_staff_user_roles`.
  * **متى يعمل:** قبل الإضافة والتعديل (`BEFORE INSERT OR UPDATE`).

---

## 11. Functions Required (الدوال المطلوبة)
* `get_staff_permissions_list`:
  * **الهدف:** تجميع وحصر كافة المفاتيح الذرية للصلاحيات الممنوحة للموظف من كافة أدواره النشطة بالشركة لإرسالها للباكيند والواجهات.
  * **Input:** `staff_id` (UUID).
  * **Output:** جدول بمفاتيح الصلاحيات الذرية.

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل الفيدرالي لتعيينات الأدوار (Tenant Dimension):**
  * كافة الأدوار والتعيينات معزولة بالكامل بموجب معرف المنظمة الفعال.
  * يُغلق جدول الصلاحيات الذرية `rbac_permissions` للزوار والشركات ليكون "قراءة فقط" لعامة الموظفين، ويُمنع تعديله نهائياً خارج بروتوكول زراعة قاعدة البيانات المركزي لحماية حصانة النظام.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول تعيينات أدوار الموظفين `rbac_staff_user_roles` وجدول روابط الأدوار بالصلاحيات `rbac_role_permissions` للرقابة الصارمة، ويدون كل تعيين أو إلغاء في سجل التدقيق فوراً لتجنب أي محاولة لتوسيع الصلاحيات بشكل مشبوه.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي قائمة الصلاحيات المسموحة والمحجوبة للموظف السائل لتوجيه الحوارات وتخصيص الخيارات دون تداخل مع صلاحياته.
* **ما يمنع إرساله:** يمنع كلياً إتاحة وتزويد الذكاء الاصطناعي بصلاحية تعديل أو تفويض الصلاحيات أو الجداول الأمنية الخاصة بنظام الـ RBAC بشكل تلقائي.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `rbac.role.assigned` (تنشيط صلاحيات وصول واجهات الموظف الجديدة).
  * `rbac.role.revoked` (قطع فوري لجلسات العمل الفعالة للموظف وسحب الصلاحية التشغيلية).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* يتم فلترة ومطابقة الصلاحيات مع كل نقرة ونبضة استعلام للمستخدم؛ لذلك لابد من كاشينغ (`Caching`) لقائمة صلاحيات الموظف في الباكيند لتقليل الضغط الدائم على قاعدة البيانات.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* إمكانية دعم صلاحيات مشروطة ومرتبطة بجدول زمني محدد أو ساعات عمل محددة (Temporal Role/Permission Restrictions) مستقبلاً، عبر التخطيط لإضافة حقول اختيارية زمني `valid_from` و `valid_to` في جدول التعيينات دون تدمير البنية الحالية.
