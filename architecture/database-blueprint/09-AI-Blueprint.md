# 🧠 مخطط مجال الذكاء الاصطناعي والحوكمة (AI Database Blueprint)

## 1. Purpose (الهدف الفني)
تنظيم وحماية وتأمين الجلسات الحوارية وسياقات الذكاء الاصطناعي للشركات، وإدارة قواعد المعارف وحفظ التضمينات المتجهية (Embeddings) المعزولة، وضبط عزل الذواكر لضمان عدم تسرب أسرار وبيانات الشركات في النماذج الفيدرالية المشتركة.

---

## 2. Tables (الجداول التابعة للمجال)
* `ai_conversations` (الجلسات والمحادثات الحية للوكيل الذكي)
* `ai_messages` (الرسائل الحوارية والردود وسجل السياق)
* `ai_knowledge_base` (المستندات وكتيبات التدريب المرفوعة للوكيل)
* `ai_memory` (الذواكر المتجهية والتضمينات اللغوية السيمانتك)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `ai_conversations`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `staff_id` | UUID | No | None | Foreign Key للموظف البشري منشئ الجلسة |
| `session_title` | VARCHAR(250) | No | 'محادثة جديدة' | العنوان المقروء للجلسة الحوارية |
| `is_archived` | BOOLEAN | No | FALSE | مؤشر أرشفة الجلسة لتخفيف العرض |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ فتح الجلسة |

### جدول `ai_messages`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `conversation_id` | UUID | No | None | Foreign Key للجلسة الأم |
| `sender_type` | VARCHAR(50) | No | None | نوع المرسل (user, assistant, system) |
| `content` | TEXT | No | None | محتوى الرسالة النصي |
| `prompt_tokens` | INTEGER | Yes | NULL | عدد توكنات المدخلات المحسوبة للتكلفة |
| `completion_tokens` | INTEGER | Yes | NULL | عدد توكنات المخرجات والرد المحسوبة |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ تدوين الرسالة |

### جدول `ai_knowledge_base`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `document_name` | VARCHAR(250) | No | None | اسم الملف أو المستند المرفوع لتدريب الوكيل |
| `document_text` | TEXT | No | None | محتوى المستند النصي المستخلص |
| `is_processed` | BOOLEAN | No | FALSE | مؤشر اكتمال التضمين المتجهي للمستند |
| `created_by` | UUID | No | None | الموظف المسؤول عن الرفع والتزويد |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ الرفع والتجهيز |

### جدول `ai_memory`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة لضمان عزل البحث السيمانتك |
| `knowledge_id` | UUID | Yes | NULL | Foreign Key لمستند المصدر في قاعدة المعرفة |
| `text_chunk` | TEXT | No | None | القطعة النصية المقتطعة لتسهيل التضمين |
| `embedding_vector` | VECTOR(1536) | No | None | التضمين المتجهي اللغوي (مثال: أبعاد OpenAI/Gemini) |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ تدوين المتجهات |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `ai_conversations.id`
  * `ai_messages.id`
  * `ai_knowledge_base.id`
  * `ai_memory.id`
* **Foreign Keys:**
  * `ai_conversations.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `ai_conversations.staff_id` يشير إلى `staff_users.id` (مع CASCADE).
  * `ai_messages.conversation_id` يشير إلى `ai_conversations.id` (مع CASCADE).
  * `ai_knowledge_base.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `ai_knowledge_base.created_by` يشير إلى `staff_users.id` (مع RESTRICT).
  * `ai_memory.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `ai_memory.knowledge_id` يشير إلى `ai_knowledge_base.id` (مع CASCADE).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **علاقة (واحد إلى متعدد) من `ai_conversations` إلى `ai_messages`:** الجلسة الحوارية تضم سلسلة من الرسائل المتبادلة.
* **علاقة من `ai_knowledge_base` إلى `ai_memory`:** المستند الواحد يتم تقسيمه وتضمينه لمتجهات متباينة بالذاكرة.

```text
[ ai_conversations ] ─── 1..* ──► [ ai_messages ]

[ ai_knowledge_base ] ─── 1..* ──► [ ai_memory ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مطبق على معرفات الجداول، النصوص، التضمينات، وأنواع المرسل.
* **CHECK:**
  * نوع المرسل يتبع الخيارات الحتمية (`sender_type` ينتمي إلى: user, assistant, system).
  * التضمين المتجهي `embedding_vector` يتوافق مع أبعاد النموذج المعتمد بالنظام (مثال: 1536 بعداً).

---

## 7. Index Strategy (استراتيجية الفهارس)
* **HNSW / IVFFlat Indexes (فهارس البحث المتجهي):**
  * فهرس متجهي (Cosine/L2) على `ai_memory.embedding_vector` لتسريع البحث السيمانتك واسترجاع السياق ذي الصلة للوكيل الذكي بالملي ثانية.
* **BTree Index:**
  * فهرس مدمج على `ai_conversations(organization_id, staff_id, is_archived)` لتسريع واجهات الدردشة الشخصية للموظفين.
  * فهرس تجميعي على `ai_messages.conversation_id` لسرعة جلب تاريخ الجلسة.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول الذكاء الاصطناعي.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `total_session_tokens`: حقل رياضي مستعلم يستدعي ويجمع إجمالي التوكنات المستهلكة في جلسة المحادثة الواحدة لمتابعة التكاليف الإجمالية للوكيل الذكي بالمنظمة.

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `enforce_prompt_security_cleaning`:
  * **الهدف:** تنظيف وتحليل وتوجيه رسائل المستخدمين الجدد في جدول `ai_messages` لحماية قواعد البيانات من هجمات حقن الأوامر والعبارات المريبة برمجياً قبل الاستدعاء.
  * **متى يعمل:** قبل الإضافة والتثبيت للرسائل (`BEFORE INSERT`).

---

## 11. Functions Required (الدوال المطلوبة)
* `match_knowledge_chunks`:
  * **الهدف:** البحث السيمانتك عن القطع النصية الأكثر شبهاً وقرابة بمتجه السؤال المدخل، مع فرض قيد عزل صارم بموجب معرف المنظمة.
  * **Input:** `org_id` (UUID), `query_vector` (VECTOR), `match_threshold` (FLOAT), `match_count` (INTEGER).
  * **Output:** جدول بالقطع النصية ومعدل الشبه.

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل الفيدرالي لمتجهات المعرفة (Tenant Dimension):**
  * تخضع كافة محادثات وقواعد وذواكر الذكاء الاصطناعي لعزل المنظمة والأمان الفيدرالي المطلق.
  * يستطيع الموظف قراءة واسترجاع محادثاته الحوارية الخاصة به فقط، ويمنع كلياً استعلام محادثات زملائه في المنظمة إلا للمشرفين والمسؤولين بموجب سجل الـ RBAC.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول قواعد المعرفة `ai_knowledge_base` للرقابة وتدقيق حركات التحديث لمعرفة المستندات المضافة والمحذوفة من ذاكرة الشركة ومسؤولية من.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي قطع النصوص الأكثر شبهاً من الذاكرة والرسائل السابقة كـ "سياق" لتوليد ردود ممتازة ومعزولة لمنتسبي الشركة.
* **ما يمنع إرساله:** يمنع إرسال أي تضمينات متجهية أو ذواكر أو مستندات تخص مستأجرين آخرين لعدم تداخل المعارف وأسرار الشركات.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `ai.conversation.started` (تهيئة الجلسة الحوارية واسترجاع تفضيلات وتاريخ الموظف).
  * `ai.knowledge.processed` (عند اكتمال بناء التضمينات للقرى المتجهية وإخطار الأنظمة بجاهزية المستند للبحث).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* فهارس الـ HNSW المتجهية ثقيلة وتستهلك الذاكرة والـ RAM بكثافة؛ لذلك يوصى بقوة بوضع حدود معقولة لأبعاد وقوام الذاكرة المتجهية وتقييد استدعائها لتقليل أوقات الاستجابة وحمل السيرفر.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* التخطيط لدعم البحث متعدد الوسائط (Multimodal Embeddings: كالبحث بالصور والملفات الصوتية للتضمينات) مستقبلاً، عبر الاحتفاظ بمرونة حقل `embedding_vector` وقابليته للتعامل مع متجهات النماذج المتقدمة دون كسر عزل الـ RLS القائم.
