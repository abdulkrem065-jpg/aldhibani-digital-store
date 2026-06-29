# 👥 مخطط مجال العملاء (Customer Database Blueprint)

## 1. Purpose (الهدف الفني)
حفظ وهيكلة بيانات العملاء والمستهلكين وتاريخ حركاتهم الائتمانية والولائية تحت مظلة عزل المنظمات. يهدف هذا البلوبرنت لتأمين حسابات ديون العملاء والتأكد من مطابقة حدودهم الائتمانية دون التسبب في ثغرات مالية أو ديون غير موثقة.

---

## 2. Tables (الجداول التابعة للمجال)
* `customers` (بيانات العملاء الأساسية)
* `customer_profiles` (الملفات التفصيلية والمؤشرات الائتمانية)
* `customer_loyalty` (سجلات برامج الولاء والمكافآت والنقاط)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `customers`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `customer_type` | VARCHAR(50) | No | 'retail' | نوع العميل (retail, corporate, VIP) |
| `is_active` | BOOLEAN | No | TRUE | حالة نشاط سجل العميل |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ التسجيل |
| `updated_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ التحديث |

### جدول `customer_profiles`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `customer_id` | UUID | No | None | Foreign Key للعميل (1:1) |
| `first_name` | VARCHAR(100) | No | None | الاسم الأول للعميل |
| `last_name` | VARCHAR(100) | No | None | العائلة واللقب للعميل |
| `phone_number` | VARCHAR(30) | Yes | NULL | رقم جوال التواصل للعميل |
| `credit_limit` | NUMERIC(15, 2) | No | 0.00 | السقف الأعلى المسموح للديون الآجلة |
| `current_balance` | NUMERIC(15, 2) | No | 0.00 | الرصيد الحالي للعميل (دائن أو مدين) |

### جدول `customer_loyalty`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `customer_id` | UUID | No | None | Foreign Key للعميل (1:1) |
| `points_balance` | INTEGER | No | 0 | رصيد النقاط الفعال للعميل |
| `tier_level` | VARCHAR(50) | No | 'bronze' | مستوى الولاء (bronze, silver, gold, platinum) |
| `lifetime_spent` | NUMERIC(15, 2) | No | 0.00 | إجمالي المبيعات التاريخية التراكمية للعميل |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `customers.id`
  * `customer_profiles.id`
  * `customer_loyalty.id`
* **Foreign Keys:**
  * `customers.organization_id` يشير إلى `organizations.id` (مع حذف مرجعي متتالي CASCADE).
  * `customer_profiles.customer_id` يشير إلى `customers.id` (مع حذف مرجعي متتالي CASCADE).
  * `customer_loyalty.customer_id` يشير إلى `customers.id` (مع حذف مرجعي متتالي CASCADE).
* **Candidate/Unique Keys:**
  * `customer_profiles.customer_id` (فريد لضمان ملف تعريفي واحد لكل عميل).
  * `customer_loyalty.customer_id` (فريد لضمان ملف مكافآت واحد لكل عميل).
  * `customers` (مزيج `organization_id` + `customer_profiles.phone_number` فريد لضمان عدم تكرار أرقام الهواتف لنفس المنظمة المستأجرة).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة (واحد إلى واحد) من `customers` إلى `customer_profiles`:** لكل عميل ملف تعريفي وتفصيلي واحد.
* **علاقة (واحد إلى واحد) من `customers` إلى `customer_loyalty`:** لكل عميل حساب نقاط ولاء واحد لتسجيل تفاعلاته.

```text
[ customers ] ◄─── 1:1 ───► [ customer_profiles ]
      │
      └─── 1:1 ───► [ customer_loyalty ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مفروض على جميع المعرفات، والأسماء الأولى والأخيرة، وقيم الائتمان ومستويات الولاء.
* **CHECK:**
  * الالتزام بقيم ائتمانية موجبة غير سالبة لـ `credit_limit` (الحد الأدنى المقبول هو 0.00).
  * التحقق من تدرج مستويات الولاء (`tier_level` ينتمي إلى: bronze, silver, gold, platinum).
  * التحقق من قيم النقاط التراكمية في جداول الولاء (`points_balance` لا يمكن أن يكون سالباً).

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس مدمج على `customers(organization_id, customer_type)` لتسريع التقارير والتصنيف.
  * فهرس فريد على `customer_profiles.phone_number` و `customer_profiles.customer_id`.
  * فهرس تجميعي على `customer_loyalty.points_balance` لتسريع جرد العملاء الأكثر تفاعلاً.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة تلقائياً حالياً في جداول العملاء.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `available_credit`: حقل رياضي يستعلم ويطرح الرصيد الحالي للديون من السقف الائتماني المعتمد للعميل لمعرفة الهامش المالي المتبقي له للبيع الآجل (`credit_limit` - `current_balance`).

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `sync_customer_updated_at`:
  * **الهدف:** تحديث حقل `updated_at` في جدول العملاء فور تعديل أي خلية في ملفه الشخصي أو الائتماني.
  * **متى يعمل:** قبل تحديث السطر (`BEFORE UPDATE`).

---

## 11. Functions Required (الدوال المطلوبة)
* `check_customer_credit_validity`:
  * **الهدف:** التحقق الفوري ما إذا كان العميل قادراً على تغطية فاتورة آجلة جديدة دون تخطي حده الائتماني المقبول.
  * **Input:** `cust_id` (UUID), `purchase_amount` (NUMERIC).
  * **Output:** BOOLEAN (مقبول أو غير مقبول ائتمانياً).

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل حسب المستأجر (Organization Dimension):**
  * كافة جداول العملاء معزولة وتفرض عزل المنظمة تلقائياً بموجب الـ Token والـ JWT الفيدرالي.
  * يُسمح فقط للموظفين الموثقين بقراءة الجداول، ويُمنع أي زائر أو مستخدم مجهول من استعلام هذه البيانات الحساسة للعملاء.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول `customers` وجدول `customer_profiles` (تحديداً حقول الحدود الائتمانية `credit_limit` والرصيد الحالي `current_balance`) للرقابة المشددة لحماية الذمم المالية ومنع تعديل أرصدة الديون خارج القنوات والمستندات الرسمية.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي الاسم الأول وتصنيف العميل وإجمالي حركات شرائه ومستويات نقاطه لتوليد خطط تسويق واقتراح خصومات مخصصة.
* **ما يمنع إرساله:** يُحظر تماماً تزويد الذكاء الاصطناعي بأرقام الهواتف أو معلومات الهوية والاتصال الشخصية الحساسة للعملاء لضمان الامتثال لقوانين خصوصية البيانات (GDPR).

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `customer.registered` (عند تسجيل عميل جديد بالشركة لتهيئة ملف ولائه ومكافآته).
  * `customer.credit_limit.breached` (عند محاولة بيع عميل بقيم تتجاوز حده الائتماني لقطع وتجميد الفاتورة وتحذير الإدارة).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* يتم فلترة العملاء بكثرة عن طريق الاسم ورقم الهاتف؛ يوصى باستخدام الفهارس المخصصة للبحث النصي الجزئي لضمان سرعة تلبية الاستعلامات في لوحات تحكم الكاشير المزدحمة.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* التخطيط لربط ملفات العملاء بأنظمة تقييم الجدارة الائتمانية الحكومية أو الفيدرالية الخارجية، عبر توفير حقل مخصص مغلق `external_scoring_meta` من نوع JSONB لاستيعاب أي معلومات ائتمانية متقدمة مستقبلاً دون تدمير البنية.
