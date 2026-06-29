# 🔔 مخطط مجال التنبيهات والإشعارات (Notification Database Blueprint)

## 1. Purpose (الهدف الفني)
تنظيم وحماية وتوثيق عمليات توليد وإرسال الإشعارات الصادرة للمستلمين والموظفين، وضبط تفضيلات الاستلام وقنوات الإرسال المدمجة وعزل محتوى التنبيهات لضمان عدم تسريب المعلومات التشغيلية للمستأجرين الآخرين.

---

## 2. Tables (الجداول التابعة للمجال)
* `notifications` (التنبيهات والرسائل المولدة الصادرة)
* `notification_templates` (الهياكل الثابتة وقوالب الإشعارات بلغات متعددة)
* `user_notification_prefs` (تفضيلات استلام وقنوات التنبيهات للمستخدمين)

---

## 3. Columns (الأعمدة وهياكلها)

### جدول `notifications`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة |
| `branch_id` | UUID | Yes | NULL | Foreign Key للفرع المعني بالتنبيه إن وجد |
| `recipient_id` | UUID | No | None | Foreign Key للموظف البشري المستلم (Recipient) |
| `template_id` | UUID | Yes | NULL | Foreign Key للقالب المعتمد المشتق منه الإشعار |
| `notification_title` | VARCHAR(200) | No | None | العنوان المقروء للتنبيه |
| `notification_body` | TEXT | No | None | المحتوى النصي المكتوب للإشعار |
| `delivery_channel` | VARCHAR(50) | No | 'in_app' | قناة الإرسال (in_app, email, sms) |
| `delivery_status` | VARCHAR(50) | No | 'pending' | حالة التنبيه (pending, sent, read, failed) |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ ووقت توليد الإشعار الصادر |

### جدول `notification_templates`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة (أو NULL للعامة) |
| `template_key` | VARCHAR(100) | No | None | الرمز الفني للقالب (مثل: low_stock_alert, debt_due) |
| `title_template` | VARCHAR(250) | No | None | قالب العنوان النصي القابل للمطابقة والتعويض |
| `body_template` | TEXT | No | None | قالب المتن النصي القابل للمطابقة والتعويض |
| `created_at` | TIMESTAMPTZ | No | CURRENT_TIMESTAMP | تاريخ تثبيت القالب بالنظام |

### جدول `user_notification_prefs`
| Column | Type | Nullable | Default | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | gen_random_uuid() | Primary Key |
| `organization_id` | UUID | No | None | Foreign Key للمنظمة المستأجرة لضمان عزل الإعدادات |
| `staff_id` | UUID | No | None | Foreign Key للموظف البشري المعني |
| `pref_channel` | VARCHAR(50) | No | 'in_app' | القناة المفضلة للاستلام (in_app, email, sms, none) |
| `is_muted` | BOOLEAN | No | FALSE | مؤشر كتم الإشعارات بالكامل للموظف |

---

## 4. Keys (المفاتيح والمؤشرات)
* **Primary Keys:**
  * `notifications.id`
  * `notification_templates.id`
  * `user_notification_prefs.id`
* **Foreign Keys:**
  * `notifications.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `notifications.branch_id` يشير إلى `branches.id` (مع RESTRICT).
  * `notifications.recipient_id` يشير إلى `staff_users.id` (مع CASCADE).
  * `notifications.template_id` يشير إلى `notification_templates.id` (مع SET NULL).
  * `notification_templates.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `user_notification_prefs.organization_id` يشير إلى `organizations.id` (مع CASCADE).
  * `user_notification_prefs.staff_id` يشير إلى `staff_users.id` (مع CASCADE).
* **Candidate/Unique Keys:**
  * `notification_templates` (مزيج `organization_id` + `template_key` فريد لمنع تكرار القوالب للشركة).
  * `user_notification_prefs` (مزيج `staff_id` + `pref_channel` فريد لتحديد تفضيلات القنوات الفرعية للموظف).

---

## 5. Relationships (العلاقات ورسمها النصي)
* **سجل التنبيهات:** يرتبط بالمسؤول المستلم، القالب المعتمد، والفرع والمنظمة لضمان دقة وعزل الاتصال والمطابقة الفيدرالية.

```text
[ notification_templates ] ─── 1:N ───┐
[ staff_users (المستلم) ] ◄─── 1:N ───┼─── [ notifications ]
[ organizations ] ◄─────────── 1:N ───┘

[ staff_users ] ◄─── 1:1 ───► [ user_notification_prefs ]
```

---

## 6. Constraints (القيود الهندسية)
* **NOT NULL:** مطبق على معرفات الجداول، المستلمين، القنوات، الحالات، القوالب، والعناوين المكتوبة للتنبيهات.
* **CHECK:**
  * قنوات الإرسال المعتمدة تنتمي لحزمة آمنة (`delivery_channel` ينتمي إلى: in_app, email, sms).
  * حالة التنبيه والاتصال تتبع الخيارات المحددة (`delivery_status` ينتمي إلى: pending, sent, read, failed).

---

## 7. Index Strategy (استراتيجية الفهارس)
* **BTree Index:**
  * فهرس مدمج على `notifications(organization_id, recipient_id, delivery_status)` لتسريع جلب وتحديث عداد الإشعارات غير المقروءة بلوحة المستخدم.
  * فهرس فريد على `notification_templates(organization_id, template_key)`.
  * فهرس مدمج على `user_notification_prefs(staff_id)`.

---

## 8. Generated Columns (الأعمدة المولدة تلقائياً)
* لا توجد أعمدة مولدة حالياً في جداول التنبيهات.

---

## 9. Computed Fields (الحقول المحسوبة برمجياً)
* `unread_notifications_count`: دالة برمجية تستعلم وتجمع عدد الإشعارات غير المقروءة بحساب الموظف الحالي بالمنظمة لتنبيهه بلوحة التحكم الحية (`delivery_status` = 'sent' أو 'pending').

---

## 10. Triggers Required (المؤشرات والمشغلات المطلوبة)
* `sync_user_pref_on_staff_activation`:
  * **الهدف:** تفعيل وتهيئة جدول التفضيلات الافتراضية `user_notification_prefs` للموظف الجديد فور تنشيط حسابه وعضويته بالشركة.
  * **متى يعمل:** بعد إضافة العضوية مباشرة (`AFTER INSERT` على `organization_members`).

---

## 11. Functions Required (الدوال المطلوبة)
* `dispatch_template_notification`:
  * **الهدف:** دالة استدعاء آلية تقوم بقراءة القالب المحدد وتعبئة وحقن المتغيرات التشغيلية لتوليد النص النهائي للإشعار وإدراجه بجدول التنبيهات آلياً بالشركة.
  * **Input:** `org_id` (UUID), `rec_id` (UUID), `key` (VARCHAR), `context_meta` (JSONB).
  * **Output:** UUID (معرف الإشعار المولد).

---

## 12. RLS Strategy (استراتيجية عزل الضمان وبوابة الأمان)
* **العزل الفيدرالي للتنبيهات (Tenant Dimension):**
  * تخضع جداول الإشعارات والتفضيلات لعزل المنظمة والأمان الفيدرالي المطلق.
  * يستطيع الموظف قراءة واستعلام تنبيهاته الشخصية الخاصة به فقط، ويُمنع كلياً من الاطلاع على تنبيهات زملائه في الفروع والمنظمة لضمان حماية الخصوصية.

---

## 13. Audit Requirements (متطلبات الرقابة والتدقيق التاريخي)
* يُخضع جدول التفضيلات وقوالب الإشعارات للرقابة وتدقيق الحركات لمنع تغيير نصوص القوالب الضريبية والمالية وإرسال تنبيهات مجهولة المصدر للمستهلكين.

---

## 14. AI Integration (التكامل مع الذكاء الاصطناعي وحماية البيانات)
* **ما يرسل:** يرسل للذكاء الاصطناعي تاريخ التنبيهات ومعدلات التفاعل لتلخيص التنبيهات اليومية وصياغة نصوص ذكية للإشعارات لرفع جودة خدمة الاتصال بالفروع.
* **ما يمنع إرساله:** يمنع إرسال أي نصوص إشعارات تحتوي على كلمات مرور مؤقتة (OTPs) أو تفاصيل أمنية حساسة لضمان الحماية المطلقة للبيانات.

---

## 15. Events (الأحداث المصدرة والمستقبلة)
* **الأحداث المصدرة:**
  * `notification.dispatched` (تنشيط قنوات الإرسال وتوجيه الرسالة للمستلم المعين).
  * `notification.delivery.failed` (تسجيل خطأ الإرسال بالمحاولة مجدداً عبر القنوات البديلة المحددة).

---

## 16. Performance Considerations (اعتبارات الأداء والتحسين الفيدرالي)
* يتم فلترة الإشعارات بكثافة عالية في لوحات الكاشير حية؛ لذلك ينصح بقوة بتأمين فهارس تجميعية على `recipient_id` وتصفية وقراءة البيانات غير المقروءة خفيفة لتقليل الضغط على السيرفر.

---

## 17. Future Expansion (خطط التوسيع المستقبلية والترقية الآمنة)
* إمكانية دعم قنوات إرسال حديثة مثل تنبيهات الويب الفورية (Web Push Notifications) وتنبيهات الواتساب الرسمية مستقبلاً، عبر الاحتفاظ بمرونة حقل وقنوات الإرسال `delivery_channel` دون تدمير البنية الحالية للـ RLS وعزل التنبيهات.
