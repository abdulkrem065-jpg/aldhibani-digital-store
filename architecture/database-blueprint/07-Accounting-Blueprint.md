# 🏦 مخطط مجال المحاسبة والدفتر المالي العام (Accounting Database Blueprint)

## 1. Purpose (الهدف الفني)
تنظيم وضبط الدفاتر المالية والقيود المحاسبية الثنائية المتوازنة (دائن ومدين)، وإدارة شجرة الدليل المالي العام وتأمين النقدية في صناديق الأموال والخزائن الفروع، وحظر أي تلاعب في القيود التاريخية المعتمدة لحماية المتانة المالية لشركات المستأجرين.

---

## 2. Tables (الجداول التابعة للمجال)
* `accounts` (دليل الحسابات وشجرة الحسابات)
* `ledger_entries` (قيود اليومية العامة المزدوجة والمرحلة)
* `money_boxes` (صناديق الأموال والخزائن اليومية للوردية)
* `debts` (سجلات تتبع الديون والالتزامات المالية للعملاء والموردين)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `accounts`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `account_code` | VARCHAR(50) | No | None | كود الحساب التعريفي التسلسلي بالشجرة (مثل: 1101) |
| `account_name` | VARCHAR(150) | No | None | اسم الحساب المالي (مثل: الصندوق الرئيسي) |
| `account_type` | VARCHAR(50) | No | None | نوع الحساب (asset, liability, equity, revenue, expense) |
| `parent_id` | UUID | Yes | NULL | Foreign Key للحساب الأب بالربط الذاتي لتكوين الشجرة |
| `is_active` | BOOLEAN | No | TRUE | مؤشر تنشيط الحساب المالي |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ التأسيس |

### جدول `ledger_entries`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | No | None | Foreign Key للفرع المنشأ للعملية المالية |
| `account_id` | UUID | No | None | Foreign Key للحساب المالي المتأثر |
| `entry_batch_id` | UUID | No | None | معرف مجمع لربط قيود المعاملة الواحدة لإثبات التوازن |
| `debit` | NUMERIC(15, 2) | No | 0.00 | قيمة المدين المالي |
| `credit` | NUMERIC(15, 2) | No | 0.00 | قيمة الدائن المالي |
| `description` | TEXT | Yes | NULL | وصف ومبرر القيد المحاسبي |
| `posted_by` | UUID | No | None | الموظف البشري الذي قام بترحيل وإثبات القيد |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ ووقت الترحيل الفعلي |

### جدول `money_boxes`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | No | None | Foreign Key للفرع التابع له الصندوق |
| `cashier_id` | UUID | No | None | Foreign Key للكاشير مستلم الصندوق والعهدة |
| `opening_balance` | NUMERIC(15, 2) | No | 0.00 | رصيد العهدة النقدي الافتتاحي |
| `closing_balance` | NUMERIC(15, 2) | Yes | NULL | رصيد الجرد المادي والفعلي عند الإغلاق |
| `status` | VARCHAR(50) | No | 'open' | حالة الصندوق (open, closed, auditing) |
| `opened_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ ووقت فتح الصندوق والوردية |
| `closed_at` | TIMESTAMPTZ | Yes | NULL | تاريخ ووقت الإغلاق المعتمد |

### جدول `debts`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `customer_id` | UUID | Yes | NULL | Foreign Key للعميل المدين (في حال ديون العملاء) |
| `debt_amount` | NUMERIC(15, 2) | No | 0.00 | القيمة الإجمالية الأصلية للدين المستحق |
| `paid_amount` | NUMERIC(15, 2) | No | 0.00 | إجمالي المبالغ والقبوضات المسددة من الدين |
| `debt_status` | VARCHAR(50) | No | 'unpaid' | حالة الدين (unpaid, partially_paid, paid, written_off) |
| `due_date` | DATE | Yes | NULL | تاريخ استحقاق السداد المتفق عليه |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ نشوء الالتزام المالي والدين |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `accounts.id`
  * `ledger_entries.id`
  * `money_boxes.id`
  * `debts.id`
* **Foreign Keys:**
  * `accounts.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `accounts.parent_id` يشير إلى `accounts.id` (مع RESTRICT).
  * `ledger_entries.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `ledger_entries.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `ledger_entries.account_id` يشير إلى `accounts.id` (مع RESTRICT).
  * `ledger_entries.posted_by` يشير إلى `staff_users.id` (مع RESTRICT).
  * `money_boxes.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `money_boxes.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `money_boxes.cashier_id` يشير إلى `staff_users.id` (مع RESTRICT).
  * `debts.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `debts.customer_id` يشير إلى `customers.id` (مع RESTRICT).
* **Candidate/Unique Keys:**
  * `accounts` (مزيج `organization_id` + `account_code` فريد لضمان عدم تكرار كود الحساب للمستأجر).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **شجرة الحسابات بالربط الذاتي:** يرتبط الحساب الفرعي بالأب لتنظيم التجميع المالي.
* **القيود المزدوجة المتوازنة:** ترتبط مجموعة قيود متباينة بنفس معرف الـ `entry_batch_id` لضمان التوازن الصفري.
* **سجل الوردية والصناديق:** يربط الكاشير بالفرع والعهد اليومية.

```text
[ accounts (الأب) ] ◄─── الربط الذاتي ───► [ accounts (الابن) ]
       1
       │
       ▼ 1..*
[ ledger_entries ] ◄─── entry_batch_id ───► (قيود متوازنة)

[ staff_users (الكاشير) ] ───► [ money_boxes ] ◄─── [ branches ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مطبق على الأرصدة والكودات والمعرفات وقيم المدين والدائن وحالات الصناديق والديون.
* **CHECK:**
  * مبالغ المدين والدائن موجبة غير سالبة (`debit` >= 0.00 و `credit` >= 0.00).
  * نوع الحساب يتبع الهيكل القياسي (`account_type` ينتمي إلى: asset, liability, equity, revenue, expense).
  * حالة صندوق الأموال تتبع خيارات صارمة (`status` ينتمي إلى: open, closed, auditing).
  * حالة الدين الالتزامي تتبع الخيارات المعتمدة (`debt_status` ينتمي إلى: unpaid, partially_paid, paid, written_off).

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس مدمج وفريد على `accounts(organization_id, account_code)`.
  * فهرس تجميعي على `ledger_entries(organization_id, entry_batch_id)` لتسريع استدعاء ومطابقة ميزان المراجعة والقيود المزدوجة.
  * فهرس تجميعي ومطابق على `money_boxes(branch_id, status)`.
  * فهرس تجميعي ومطابق على `debts(customer_id, debt_status)`.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول المحاسبة.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `remaining_debt_amount`: حقل مالي محتسب يستعلم ويطرح المدفوعات المسددة من أصل الدين لمعرفة القيمة المتبقية المستحقة للتحصيل (`debt_amount` - `paid_amount`).

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `enforce_ledger_entry_append_only`:
  * **الهدف:** منع وحظر أي تعليمة لتعديل أو حذف القيود المالية المعتمدة في جدول `ledger_entries` لإبقاء السجل مغلقاً تماماً وتدريبياً.
  * **متى يعمل:** قبل التعديل أو الحذف (`BEFORE UPDATE OR DELETE`).

---

## 11. Functions Required (الدوال المطلوبة)
* `assert_entry_batch_balance`:
  * **الهدف:** التحقق والضمان من أن إجمالي قيم المدين تساوي وتوازن تماماً قيم الدائن لجميع القيود الحاملة لنفس المعرف `entry_batch_id` قبل ترحيلها النهائي.
  * **Input:** `batch_id` (UUID).
  * **Output:** BOOLEAN (توازن تام أو فشل وقفل الترحيل).

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل الفيدرالي الحساس (Tenant Dimension):**
  * تخضع جميع جداول الدفتر المالي العام لعزل المنظمة والأمان الفيدرالي المطلق.
  * يُمنع كلياً وصول بوابات العملاء أو الواجهات الخارجية والزوار إلى جداول المحاسبة أو الصناديق لحفظ الأمان المالي والسيادة الداخلية للشركات.
  * يقتصر تصفح الحسابات والقيود على الإداريين المعتمدين والمحاسبين الموثقين بموجب سجل الـ RBAC.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول `accounts`, `ledger_entries` وجدول `money_boxes` للرقابة والأرشفة والتدقيق التاريخي المطلق والصارم نظراً لتعاملها مع عهد نقدية مادية حية وقيود مالية ضريبية متبادلة بالشركات.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي ميزان المراجعة وحركات الحسابات وصناديق الأموال لتوليد التحليلات المالية واكتشاف الأخطاء وتسهيل قراءة الميزانية العمومية للشركة.
* **ما يمنع إرساله:** يمنع تزويد الذكاء الاصطناعي بالأرقام السرية أو الحسابات المصرفية المشفرة للشركات.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `accounting.ledger.posted` (إخطار أنظمة الرقابة بتسجيل قيود مالية جديدة وتحديث الأرصدة).
  * `accounting.cashier.shortage` (عند جرد الخزانة وإثبات عجز مالي لإخطار إدارة الرقابة والامتثال).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* جدول القيود اليومية `ledger_entries` يعتبر ضخماً وعالي الكثافة (Write-Heavy) مع نمو المبيعات؛ ينصح بشدة بالفرز والتقسيم وتأمين فهارس تجميعية على الحسابات والتواريخ لتفادي بطء ميزان المراجعة.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* التخطيط لدمج تتبع مراكز التكلفة المتعددة للفروع والأقسام (Cost Centers) مستقبلاً، عبر إدخال حقل اختياري `cost_center_id` في جدول القيود اليومية دون إفساد الهيكل المزدوج القائم للمحاسبة.
