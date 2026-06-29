# 📋 السجل الرئيسي لبيانات المهاجرات (Master Manifest Record - V5)

يمثل هذا المستند السجل الفيدرالي المركزي والمعتمد لجميع خطط وبوابات مهاجرات قاعدة البيانات (Central Migration Registry). يخضع هذا السجل لرقابة معمارية صارمة ويحدث دورياً لتوثيق حالات البناء والامتثال وعلاقتها بالوثائق التأسيسية للمنصة.

---

## 📊 الحالة العامة للمهاجرات والتسلسل التاريخي (Migration Status Overview)

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  M-001: Foundation     │ ──►  │  M-002: Core Domains   │ ──►  │  M-003: Business Dom.  │
│  [Status: Approved]    │      │  [Status: Approved]    │      │  [Status: Approved]    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
            │
            ▼
┌────────────────────────┐      ┌────────────────────────┐
│  M-004: AI Governance  │ ──►  │  M-005: Hardening      │
│  [Status: Approved]    │      │  [Status: Approved]    │
└────────────────────────┘      └────────────────────────┘
```

---

## 📑 جدول السجل المركزي للمهاجرات (Master Migration Registry)

| معرف البيان (Manifest ID) | اسم البيان (Name) | نطاق التغطية والمجالات (Scope & Domains) | مرحلة البناء (Phase) | الحالة الحالية (Status) | مراجع الامتثال المرتبطة (References) |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **M-MANIFEST-001** | التأسيس والأمن الهيكلي (Foundation Core) | الامتدادات، الهوية، المنظمات، الفروع والأعضاء الأساسيين | **PHASE 1** | <span style="color:green; font-weight:bold;">Approved</span> | Constitution Art. 1, 2<br>ADR-001, ADR-002<br>Blueprint Ch. 1, 2<br>Contract-01, Contract-02 |
| **M-MANIFEST-002** | المرجعيات والكتالوجات التجارية (Core Domains) | العملاء، المنتجات، التصنيفات، الوحدات، والموردين | **PHASE 2** | <span style="color:green; font-weight:bold;">Approved</span> | Constitution Art. 3, 4<br>ADR-004, ADR-005<br>Blueprint Ch. 3, 4<br>Contract-03, Contract-04 |
| **M-MANIFEST-003** | العمليات والمسارات التشغيلية (Business Domains) | المخازن، المبيعات، الحسابات، الصناديق، الديون، القيود، ومسارات العمل | **PHASE 3** | <span style="color:green; font-weight:bold;">Approved</span> | Constitution Art. 5, 6, 7, 11<br>ADR-006, ADR-007, ADR-011<br>Blueprint Ch. 5, 6, 7, 11<br>Contract-05, Contract-06, Contract-07, Contract-11 |
| **M-MANIFEST-004** | الذكاء الاصطناعي والحوكمة المتجهة (AI Governance) | ذواكر البحث السيمانتك، رسائل وسياقات الوكلاء، وقواعد المعرفة المعزولة | **PHASE 4** | <span style="color:green; font-weight:bold;">Approved</span> | Constitution Art. 9<br>ADR-009<br>Blueprint Ch. 9<br>Contract-09 |
| **M-MANIFEST-005** | التحصين الأمني والمراقبة الموحدة (Hardening & Auditing) | سياسات RLS، الأدوار RBAC، دوال RPC، سجل التدقيق والأثر، والمشغلات الحاكمة | **PHASE 4** | <span style="color:green; font-weight:bold;">Approved</span> | Constitution Art. 8, 10, 12<br>ADR-008, ADR-010, ADR-012<br>Blueprint Ch. 8, 10, 12<br>Contract-08, Contract-10, Contract-12 |

---

## ⚙️ محددات وحالات تسيير المهاجرات (Lifecycle Status Dictionary)

تخضع حقول الحالة في السجل لتعريفات معمارية صارمة لا يجوز الخروج عنها:

1. **مسودة (Draft):**
   * خطة البيان قيد الكتابة والمراجعة المعمارية الفنية الأولى. يمنع تشغيلها أو ترجمتها لـ SQL.
2. **معتمد للتشغيل (Approved):**
   * نالت الخطة موافقة المعماري الأعلى ورئيس الهندسة. جاهزة للترجمة الآلية لملفات المهاجرة الرسمية في بيئة التطوير.
3. **منفذ هيكلياً (Implemented):**
   * تم صياغة وتشغيل الـ SQL المقابل في بيئة الاستعداد والتحضير (Staging). لم تجتز كامل الاختبارات بعد.
4. **موثق ومفحوص (Verified):**
   * اجتازت البنية الناتجة كافة الفحوصات الأمنية والمالية والكمية بنسبة 100% بنتيجة أخضر كامل للـ Compliance.
5. **متراجع عنه (Rolled Back):**
   * تم إلغاء التفعيل للبيان وإطلاق بروتوكول التراجع بنجاح نتيجة فشل في أحد شروط العبور أو اكتشاف خلل طارئ.

---

## 🔒 حوكمة وسلطة تعديل السجل الرئيسي (Sovereignty & Sign-off)

* يمنع تعديل هذا السجل أو ترقية حالة أي مهاجرة من حالة لأخرى دون مراجعة إلكترونية موثقة لمحرك الامتثال الفني (Compliance Engine).
* يتطلب تحويل حالة أي بيان من `Approved` إلى `Verified` توقيع وموافقة الثلاثي القيادي (رئيس الهندسة للتحقق التقني، رئيس أمن المعلومات للتحقق من العزل، والمدير المالي لسلامة الدفاتر المحاسبية) وفق وثيقة معايير القبول والاعتماد الموثقة.
