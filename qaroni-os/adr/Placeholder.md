# سجل القرارات المعمارية (Architectural Decision Records - ADR)
## مستودع حوكمة وتوثيق القرارات التصميمية المعمارية لنظام قاروني التشغيلي

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (QOC Article IV: Knowledge & Change Governance)
  → **Article IV.1** (Decision Trace Mandatory Path)
  → **ADR-003** (Constitutional Architecture Specification)
  → **Implementation** (Create /qaroni-os/adr/Placeholder.md)
  → **Audit** (Technical Audit Protocol Log #2026-07-01-ADR-DIR)

---

## 1. الغرض من المجلد (Directory Purpose)
يُستخدم هذا المجلد كمستودع رسمي غير قابل للمسح أو التشويه لحفظ وتوثيق كافة **قرارات التصميم المعماري (Architectural Decision Records - ADR)**. تخضع جميع القرارات البرمجية والتعديلية لقواعد التوثيق الفوري وإرفاق معرّفات العمليات الفريدة (RunID) لتوفير أقصى قدر من الشفافية والنزاهة والتتبع الميداني.

---

## 2. قواعد تسمية وتنسيق الملفات (File Naming & Formatting Rules)
1. **الرقم التسلسلي الصارم:** تبدأ التسمية بـ `ADR-` متبوعة بثلاثة أرقام تصاعدية، على سبيل المثال: `ADR-001-Database-Architecture.md`.
2. **صيغة المحتوى القياسي:** يجب أن يحتوي كل ملف ADR على الأقسام التالية بالتفصيل:
   * **سلسلة التتبع الدستورية (Decision Trace):** لربط القرار بالمادة الدستورية الموافقة.
   * **الحالة (Status):** (مقبول `Accepted` | معلق `Proposed` | ملغى `Superseded`).
   * **السياق والمشكلة الفنية (Context & Problem Statement).**
   * **البدائل المدروسة والمقارنة الفنية (Alternatives considered).**
   * **الحل المعتمد والمبررات الهندسية (Chosen Solution & Justification).**
   * **التأثير البنيوي والبرمجي المتوقع (Structural & Architectural Consequences).**

---

## 3. سجل الكشاف النشط (Active ADR Indexes)
* **ADR-001:** تأسيس بنية الطبقات أحادية الاتجاه لـ Qaroni Engine. *(مؤرشف ومطبق)*
* **ADR-002:** تفعيل بوابات العزل البيئي الرباعي للحظر التلقائي. *(مؤرشف ومطبق)*
* **ADR-003:** تأسيس البنية العليا للدستور التشغيلي الحاكم (QOC) في المرحلة الثالثة. *(نشط ومطبق)*

---
**Constitutional Architect & System Guardian**  
*Qaroni AI Operating System Control Center*
