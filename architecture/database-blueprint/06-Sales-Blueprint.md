# 💰 مخطط مجال المبيعات وفواتير الكاشير (Sales Database Blueprint)

## 1. Purpose (الهدف الفني)
إدارة وتنظيم وحماية عمليات المبيعات وفواتير نقاط البيع (POS) وسلال الشراء المعلقة، وضبط تماسك قيم الضرائب والخصومات الممنوحة وحظر تعديل الفواتير المدفوعة لمنع الاحتيال وضمان استقرار التقارير المالية والضريبية.

---

## 2. Tables (الجداول التابعة للمجال)
* `orders` (فواتير المبيعات الصادرة)
* `order_items` (تفاصيل وبنود السلع المبيعة)
* `pending_carts` (سلال المشتريات المعلقة للكاشير)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `orders`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | No | None | Foreign Key للفرع المنفذ للعملية |
| `customer_id` | UUID | Yes | NULL | Foreign Key للعميل (اختياري للبيع النقدي) |
| `cashier_id` | UUID | No | None | Foreign Key للموظف (الكاشير) البشري |
| `order_number` | VARCHAR(100) | No | None | رقم تسلسلي فريد ومقروء للفاتورة بالفرع |
| `sub_total` | NUMERIC(15, 2) | No | 0.00 | إجمالي الفاتورة قبل الضرائب والخصم |
| `discount_amount` | NUMERIC(15, 2) | No | 0.00 | قيمة الخصم المالي الإجمالي المطبق |
| `tax_amount` | NUMERIC(15, 2) | No | 0.00 | قيمة ضريبة القيمة المضافة المحتسبة |
| `grand_total` | NUMERIC(15, 2) | No | 0.00 | الصافي النهائي المطلوب دفعه والمسجل مالياً |
| `payment_method` | VARCHAR(50) | No | 'cash' | طريقة الدفع (cash, card, split, credit_account) |
| `order_status` | VARCHAR(50) | No | 'draft' | حالة الفاتورة (draft, completed, returned, cancelled) |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | وقت ترحيل الفاتورة وإتمامها |

### جدول `order_items`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `order_id` | UUID | No | None | Foreign Key للفاتورة الأم |
| `product_id` | UUID | No | None | Foreign Key للمنتج المبيع |
| `quantity` | NUMERIC(12, 3) | No | 1.000 | الكمية المبيعة من المنتج |
| `unit_price` | NUMERIC(15, 2) | No | 0.00 | سعر بيع الحبة الواحدة والمسجل بالفاتورة |
| `item_discount` | NUMERIC(15, 2) | No | 0.00 | الخصم المطبق على هذا البند خصيصاً |
| `item_tax` | NUMERIC(15, 2) | No | 0.00 | الضريبة المحتسبة على هذا البند |
| `item_total` | NUMERIC(15, 2) | No | 0.00 | الصافي النهائي للبند (شاملاً الخصم والضريبة) |

### جدول `pending_carts`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | No | None | Foreign Key للفرع النشط به السلة |
| `cashier_id` | UUID | No | None | Foreign Key للكاشير المالك للسلة الحية |
| `cart_meta` | JSONB | No | None | محتويات وسلع السلة المعلقة مؤقتاً |
| `updated_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ آخر تعديل على السلة |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `orders.id`
  * `order_items.id`
  * `pending_carts.id`
* **Foreign Keys:**
  * `orders.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `orders.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `orders.customer_id` يشير إلى `customers.id` (مع RESTRICT).
  * `orders.cashier_id` يشير إلى `staff_users.id` (مع RESTRICT).
  * `order_items.order_id` يشير إلى `orders.id` (مع CASCADE).
  * `order_items.product_id` يشير إلى `products.id` (مع RESTRICT).
  * `pending_carts.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `pending_carts.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `pending_carts.cashier_id` يشير إلى `staff_users.id` (مع CASCADE).
* **Candidate/Unique Keys:**
  * `orders` (مزيج `organization_id` + `order_number` فريد لضمان عدم تكرار أرقام الفواتير الرسمية لنفس الشركة المستأجرة).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة (واحد إلى متعدد) من `orders` إلى `order_items`:** الفاتورة الواحدة تضم وتستعرض بنوداً متعددة للسلع المشتراة.
* **روابط الفاتورة المعتمدة:** ترتبط الفاتورة بالعميل، الفرع، الكاشير، والمنظمة الأم.

```text
  [ orders ] ─── 1..* ──► [ order_items ]
      │
      ├───► [ branches ]
      ├───► [ staff_users (الكاشير) ]
      └───► [ customers ] (اختياري)
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مفروض على جميع الأعمدة الحساسة كالمبالغ والإجماليات وأرقام الفواتير وطرق الدفع وحالاتها.
* **CHECK:**
  * المبالغ المالية لابد أن تكون موجبة غير سالبة (`sub_total`, `grand_total`, `unit_price` >= 0.00).
  * التحقق من طرق الدفع المعتمدة (`payment_method` ينتمي إلى: cash, card, split, credit_account).
  * التحقق من حالة الفاتورة وحوكمتها الانتقالية (`order_status` ينتمي إلى: draft, completed, returned, cancelled).

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس مدمج وفريد على `orders(organization_id, order_number)` لسرعة استعلام وتدقيق الفاتورة.
  * فهرس تجميعي على `orders(branch_id, order_status, created_at)` لتسريع استدعاء تقارير المبيعات اليومية للفروع.
  * فهرس تجميعي على `order_items.product_id`.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول المبيعات.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `tax_percentage_effective`: دالة برمجية تستعلم الفوارق وتحسب النسبة الفعلية والنهائية للضرائب المطبقة على إجمالي الفاتورة لمطابقة التقارير المحاسبية.

---

## 10. Triggers Required (المؤشارات والمشغلات المطلوبة)
* `deduct_stock_on_order_completion`:
  * **الهدف:** خصم وتخفيض الكميات المادية فوراً من جداول المخزون `branch_inventory` للفرع المنفذ فور تحول حالة الفاتورة إلى مكتملة ("completed").
  * **متى يعمل:** بعد تحديث الفاتورة مباشرة (`AFTER UPDATE` عندما تنتقل الحالة إلى completed).

---

## 11. Functions Required (الدوال المطلوبة)
* `generate_sequential_order_number`:
  * **الهدف:** توليد رقم فاتورة تسلسلي فريد ومقروء للكاشير والفرع (مثال: INV-2026-00001) يعتمد على تتابع وتصفير الأرقام السنوي للمستأجر.
  * **Input:** `org_id` (UUID), `branch_id` (UUID).
  * **Output:** VARCHAR.

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل حسب المستأجر والفرع (Tenant & Branch Dimension):**
  * تخضع جداول المبيعات بالكامل لعزل المنظمة والأمان الفيدرالي لضمان الفصل التام.
  * يستطيع الكاشير الوصول وفقط لقراءة مبيعات وروردية فرعه الحالي، بينما يمتلك مدراء المنظمة والمشرفون نظرة عامة شاملة لكامل تقارير المبيعات في الفروع والمنظمة بأكملها.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول `orders` وجدول `order_items` للرقابة الصارمة غير القابلة للتلاعب بنظام Append-Only الصارم بمجرد اكتمال الدفع، لحماية الدورة المالية والامتثال الضريبي للشركة.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي تفاصيل الفواتير المكتملة وأوقات المبيعات والسلع المشتراة والخصومات المطبقة لإجراء دراسات التنبؤ بالأرباح والمبيعات وتنسيق عروض الكاشير الذكية.
* **ما يمنع إرساله:** يمنع تزويد الذكاء الاصطناعي بالبيانات الشخصية الحساسة للعملاء أو بطاقات ائتمانهم.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `sales.order.completed` (إخطار أنظمة المخزون لخصم الكميات وتنبيه المحاسبة لتوليد قيود اليومية آلياً).
  * `sales.order.returned` (إخطار لإعادة تقييم السلع مخزنياً وتسجيل المرتجع المحاسبي المقابل).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* يتم فلترة الفواتير بشكل كثيف بالفرع والتاريخ واليوم؛ لذلك ينصح بفرز وفهرسة حقول `created_at` وتأمين الفهارس المدمجة لتسريع التحليلات في الواجهات.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* دعم البيع متعدد العملات مستقبلاً عبر إضافة حقول مخصصة `exchange_rate` و `foreign_currency` لحفظ سعر الصرف وتفاصيله بالفاتورة دون التأثير على البنية والعمليات الضريبية الحالية.
