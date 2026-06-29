# 🏢 مخطط مجال المنظمات والفروع (Organization Database Blueprint)

## 1. Purpose (الهدف الفني)
تمثيل الهيكل التنظيمي والشركات وفروعها الجغرافية ومستأجري النظام الفيدراليين. يعتبر العمود الفقري وبوابة العزل الكبرى لكافة البيانات والعمليات، حيث يخدم بمثابة المرجع الأعلى لفرض مفاتيح العزل وقيم الأمان وسياسات التحقق من المستأجر.

---

## 2. Tables (الجداول التابعة للمجال)
* `organizations` (المنظمات / الشركات المستأجرة)
* `branches` (الفروع ومواقع العمل والتشغيل)
* `store_config` (إعدادات النظام وثيمات المحلات التجارية)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `organizations`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key الأعلى للمستأجر |
| `legal_name` | VARCHAR(200) | No | None | الاسم التجاري والقانوني للشركة |
| `is_active` | BOOLEAN | No | TRUE | حالة النشاط المالي والتجاري للشركة |
| `license_status` | VARCHAR(50) | No | 'trial' | حالة الترخيص (trial, active, suspended) |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | وقت التأسيس والنظام في قاعدة البيانات |
| `updated_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | وقت تعديل السجل التنظيمي |

### جدول `branches`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة الأم |
| `branch_name` | VARCHAR(150) | No | None | اسم الفرع المعرف به جغرافياً |
| `is_active` | BOOLEAN | No | TRUE | حالة الفرع التشغيلية الحالية |
| `location_meta` | JSONB | Yes | NULL | الإحداثيات الجغرافية أو العنوان البريدي |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ افتتاح الفرع رقمياً |

### جدول `store_config`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة صاحبة الإعدادات |
| `logo_url` | VARCHAR(500) | Yes | NULL | رابط الشعار الخاص بالشركة |
| `currency` | VARCHAR(10) | No | 'SAR' | العملة الافتراضية للمعاملات المالية |
| `tax_number` | VARCHAR(50) | Yes | NULL | الرقم الضريبي الموحد للشركة |
| `ui_theme_meta` | JSONB | Yes | NULL | إعدادات الثيم والواجهات وتفضيلات الألوان |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `organizations.id`
  * `branches.id`
  * `store_config.id`
* **Foreign Keys:**
  * `branches.organization_id` يشير إلى `organizations.id` (مع حذف مرجعي متتالي CASCADE).
  * `store_config.organization_id` يشير إلى `organizations.id` (مع حذف مرجعي متتالي CASCADE).
* **Candidate/Unique Keys:**
  * `organizations.legal_name` (يجب أن يكون فريداً لمنع التكرار).
  * `store_config.organization_id` (فريد 1:1 لضمان ملف إعداد واحد لكل شركة).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة (واحد إلى متعدد) من `organizations` إلى `branches`:** المنظمة الأم الواحدة تدير وتملك فروعاً متعددة.
* **علاقة (واحد إلى واحد) من `organizations` إلى `store_config`:** كل مستأجر يملك سجلاً واحداً لتثبيت الإعدادات.

```text
[ organizations ] ◄─── 1:1 ───► [ store_config ]
       1
       │
       ▼ 1..*
[ branches ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مفروض على المعرفات والأسماء وحالات الترخيص والعملات لتجنب السجلات الناقصة.
* **CHECK:**
  * التحقق من سلامة حالة الترخيص (`license_status` ينتمي إلى: active, trial, suspended).
  * التحقق من صحة كود العملة (`currency` يتكون من 3 أحرف قياسية على الأقل).

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس فريد على `organizations.legal_name`.
  * فهرس تجميعي على `branches.organization_id` لتسريع عمليات استدعاء الفروع وتصفيتها للمنظمة الأم.
  * فهرس فريد على `store_config.organization_id`.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول المنظمات.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `active_branches_count`: دالة برمجية تقوم بحساب وجمع عدد الفروع النشطة الفعالة تحت رعاية المنظمة المعنية لتوفير تقارير إحصائية سريعة.

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `update_org_timestamp`:
  * **الهدف:** تحديث الحقل الزمني `updated_at` في جدول المنظمات فور حدوث أي تعديل في الكيان.
  * **متى يعمل:** قبل تحديث السطر (`BEFORE UPDATE`).

---

## 11. Functions Required (الدوال المطلوبة)
* `suspend_all_branches_on_org_suspension`:
  * **الهدف:** شل حركة الفروع تلقائياً بإيقاف تفعيلها فور قيام النظام بتجميد رخصة المنظمة الأم.
  * **Input:** `org_id` (UUID).
  * **Output:** BOOLEAN (تأكيد اكتمال عملية التجميد للفروع).

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل حسب المستأجر (Organization Dimension):**
  * جدول `organizations` محمي ومرتبط برمز الهوية لضمان أن موظفي المنظمة يقرؤون بيانات منظمتهم فقط.
  * جدول `branches` و `store_config` يتبع بشكل صارم وفوري لعزل المنظمة الأم عن طريق السياسات الفيدرالية وقيم الـ JWT للمستخدم المسجل.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول `organizations` و `branches` وتحديثات `store_config` لرقابة تدقيقية فورية وصارمة نظراً لحساسيتها الكبرى وتأثيرها على استقرار وبنية النظام ككل.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي تفضيلات الإعدادات وعملة المنظمة واسمها ونبرتها والعملات المفضلة لضبط نبرة وصياغة الإجابات للعملاء والموظفين.
* **ما يمنع إرساله:** يمنع إرسال الأرقام الضريبية السرية، أو فواتير التحصيل البينية للشركة أو أي بيانات ترخيص حساسة.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `organization.created` (عند تسجيل شركة مستأجرة جديدة في النظام لتأسيس دفاترها ومخازنها الافتراضية).
  * `organization.suspended` (عند تجميد المنظمة لتعطيل الوصول والاتصالات بكافة النظم الفرعية).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* جداول المنظمات والفروع تعتبر جداول نادرة الكتابة وعالية القراءة (Read-Heavy). يوصى بقوة بكاشينغ (`Caching`) لإعدادات المتجر `store_config` والفروع لتقليل الضغط على قاعدة البيانات في كل زيارة.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* إضافة دعم هيكل تجميع الشركات الفرعية (Holdings/Conglomerates) حيث تدير منظمة رئيسية كبرى منظمات فرعية متعددة، عبر إدخال حقل اختياري `parent_organization_id` للربط الذاتي للمنظمات دون التأثير على البنية الحالية للفرع والـ RLS.
