# 📦 مخطط مجال المخزون والمستودعات (Inventory Database Blueprint)

## 1. Purpose (الهدف الفني)
إدارة وضبط وتتبع الكميات المادية الحقيقية للسلع الموزعة على فروع ومخازن المنظمة، وضبط حركات النقل البيني والتسويات، وحظر البيع بدون كميات متوفرة لمنع حدوث فروقات مخزنية عشوائية.

---

## 2. Tables (الجداول التابعة للمجال)
* `branch_inventory` (الكميات الحية للمنتجات بالفروع)
* `stock_transfers` (أوامر وحركات النقل البيني للمخازن)
* `stock_adjustments` (حركات جرد وتسويات المخزون وتصحيحها)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `branch_inventory`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | No | None | Foreign Key للفرع المتواجد به المخزون |
| `product_id` | UUID | No | None | Foreign Key للمنتج المعني |
| `quantity` | NUMERIC(12, 3) | No | 0.000 | الكمية المتاحة والمادية الحالية في الفرع |
| `reorder_level` | NUMERIC(12, 3) | No | 5.000 | حد الأمان المخزني لإطلاق التنبيهات (نقطة إعادة الطلب) |
| `last_stocked_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ آخر عملية توريد أو شحن معتمدة |

### جدول `stock_transfers`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `source_branch_id` | UUID | No | None | Foreign Key لفرع المصدر |
| `destination_branch_id` | UUID | No | None | Foreign Key لفرع الوجهة والمستودع المستلم |
| `transfer_status` | VARCHAR(50) | No | 'pending' | حالة النقل (pending, shipped, received, cancelled) |
| `items_meta` | JSONB | No | None | تفاصيل السلع والكميات المنقولة في الأمر |
| `created_by` | UUID | No | None | الموظف البشري الذي أنشأ أمر النقل |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ إنشاء السند |

### جدول `stock_adjustments`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | No | None | Foreign Key للفرع المجرد والمعدل مخزنه |
| `product_id` | UUID | No | None | Foreign Key للمنتج المعني |
| `adjustment_type` | VARCHAR(50) | No | None | نوع التسوية (theft, damage, manual_count, gift) |
| `quantity_delta` | NUMERIC(12, 3) | No | None | التغير في الكمية (موجب للزيادة، سالب للنقص والتلف) |
| `reason` | TEXT | Yes | NULL | وصف ومبرر التسوية الإداري |
| `adjusted_by` | UUID | No | None | الموظف البشري المسؤول والموقع على الجرد |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ توثيق التسوية وتطبيقها |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `branch_inventory.id`
  * `stock_transfers.id`
  * `stock_adjustments.id`
* **Foreign Keys:**
  * `branch_inventory.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `branch_inventory.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `branch_inventory.product_id` يشير إلى `products.id` (مع RESTRICT).
  * `stock_transfers.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `stock_transfers.source_branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `stock_transfers.destination_branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `stock_adjustments.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `stock_adjustments.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `stock_adjustments.product_id` يشير إلى `products.id` (مع RESTRICT).
* **Candidate/Unique Keys:**
  * `branch_inventory` (مزيج `branch_id` + `product_id` فريد لضمان سطر جرد كمي واحد للمنتج في نفس الفرع).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة ارتباطية لـ `branch_inventory`:** يربط بين المنتج والفرع والكمية الحية المتوفرة.
* **علاقة لـ `stock_transfers`:** يربط فرع المصدر بفرع الوجهة التشغيلي لتوثيق سندات النقل.
* **علاقة لـ `stock_adjustments`:** يربط السلعة والفرع بالموظف المسؤول لتوثيق الجرد والتسويات.

```text
[ branches (المصدر) ] ◄──┐
                         ├─── [ stock_transfers ]
[ branches (الوجهة) ] ◄──┘

[ products ] ───► [ branch_inventory ] ◄─── [ branches ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مطبق على الكميات والمعرفات وحالات النقل والكميات المعدلة بالتسويات.
* **CHECK:**
  * الكميات الحية في `branch_inventory.quantity` يجب أن تكون أكبر من أو تساوي 0.000 (يُحظر عطلاً البيع بالسالب تحت الصفر بموجب الدستور).
  * حالة النقل تنتمي إلى حزمة محددة (`transfer_status` ينتمي إلى: pending, shipped, received, cancelled).
  * نوع التسوية يطابق الخيارات المعتمدة لتسهيل التقارير وتحديد المسؤولية.

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس مدمج وفريد على `branch_inventory(branch_id, product_id)` لتسريع عمليات الفحص والخصم اللحظي للكميات أثناء المبيعات.
  * فهرس تجميعي على `stock_transfers.source_branch_id` و `stock_transfers.transfer_status`.
  * فهرس تجميعي على `stock_adjustments.product_id`.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول المخزون.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `is_low_stock`: حقل منطقي يتم احتسابه برمجياً بمقارنة الكمية الحالية بحد الأمان ومستويات إعادة الطلب المحددة للسلعة (`quantity` <= `reorder_level`).

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `apply_adjustment_to_inventory`:
  * **الهدف:** تعديل وتصحيح رصيد الكميات في `branch_inventory` فوراً وبلحظة إضافة سطر تسوية معتمد في `stock_adjustments`.
  * **متى يعمل:** بعد إضافة السجل مباشرة (`AFTER INSERT`).

---

## 11. Functions Required (الدوال المطلوبة)
* `transfer_branch_stock`:
  * **الهدف:** معالجة آمنة لخصم الكميات من فرع المصدر وإضافتها لفرع الوجهة دفعة واحدة كمعاملة موحدة (Atomic Transaction) لمنع ضياع الكميات البينية.
  * **Input:** `transfer_id` (UUID).
  * **Output:** BOOLEAN (تأكيد نجاح عملية النقل).

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل حسب المستأجر والفرع (Tenant & Branch Dimension):**
  * تخضع جميع سجلات جداول المخزون لسياسات عزل المنظمة.
  * يقتصر وصول موظفي الفروع على كميات وجرد فرعهم النشط والمسجلين به فقط، ويملك المسؤول الأعلى صلاحية تصفح وجرد كافة المخازن.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول `branch_inventory` وجدول `stock_adjustments` للرقابة التاريخية والأمنية المشددة والقصوى، ويدون كل تغير في سجل التدقيق لكون المخزون يمثل نقوداً مادية ومجالاً خصباً للأخطاء والفروقات.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي مستويات الكميات الحالية ومقاييس إعادة الطلب وتواريخ التسويات لمساعدته في تقدير حجم التلف والجرد، والتنبؤ بموعد نفاد السلع وتنسيق سلال تزويد مخزني مسبقة للفرع.
* **ما يمنع إرساله:** يمنع تزويد الذكاء الاصطناعي ببيانات الموظفين الشخصية المكتشفة للتلفيات إلا بعد المراجعة البشرية.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `inventory.stock.low` (عند تراجع رصيد سلعة عن حد الأمان لتوليد التنبيهات اللازمة للمشتروات).
  * `inventory.transfer.completed` (تأكيد اكتمال الشحنة البينية وتحديث الفروع).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* يتم فلترة المخزون بكثافة لدى نقاط البيع؛ لذلك يوصى بالحفاظ على فهرس `branch_inventory_unique` نظيفاً لتقليص زمن الاستجابة ومنع تعطل طوابير الكاشير.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* إضافة دعم لإدارة وتتبع المخازن على مستوى الرفوف والقرى المخصصة داخل المستودع (Bins/Aisles Tracking) مستقبلاً، عبر التخطيط لإضافة جدول تفصيلي `inventory_locations` يرتبط بكميات الفرع دون تدمير البنية الحالية للـ RLS والمخازن.
