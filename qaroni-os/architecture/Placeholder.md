# مجلد البنية المعمارية وتخطيط الطبقات (Architecture Directory)
## مستودع التوثيق المعماري، خرائط المكونات، ومسارات تدفق البيانات لنظام قاروني

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (QOC Article IV: Knowledge & Change Governance)
  → **Article IV.1** (Decision Trace Mandatory Path)
  → **ADR-003** (Constitutional Architecture Specification)
  → **Implementation** (Create /qaroni-os/architecture/Placeholder.md)
  → **Audit** (Technical Audit Protocol Log #2026-07-01-ARCH-DIR)

---

## 1. الغرض من المجلد (Directory Purpose)
يُستخدم هذا المجلد لحفظ وتوثيق **الخرائط المعمارية ومكونات النظام الرأسية والأفقية**. يوضح هذا القسم العلاقات البرمجية بين الطبقات، مسارات اتصال الوكلاء، تماسك الواجهات مع الخوادم، والتصميم الميكانيكي لحلقات الإصلاح والتراجع التلقائي.

---

## 2. المبادئ المعمارية الحاكمة (Governing Architecture Principles)
1. **أحادية اتجاه الاعتمادية (Unidirectional Flow):** تتدفق الاستدعاءات حصرياً من الأعلى إلى الأسفل.
2. **عزل النوى وعمليات اتخاذ القرار (Kernel Isolation):** تظل نواة التشغيل الذاتي الحاكم بمعزل عن واجهات العرض وعمليات الإدخال المباشرة لغير المخولين.
3. **تخليد التوثيق والتسلسل الزمني (Immutable System State Mapping):** يتم تتبع تطور المعمارية تاريخياً وعدم تعديل المخططات بأثر رجعي دون تفويض بشري OTP.

---

## 3. قائمة الوثائق والخرائط المعمارية النشطة (Active Architecture Artifacts)
* **Qaroni_Architecture_v3_Draft:** مسودة المخطط العام لنظام التشغيل الذاتي المحكوم بالمرحلة الثالثة.
* **ControlGateway_DataFlow:** خريطة مسار وتدفق البيانات والوساطة من العميل إلى قاعدة البيانات.
* **BrainKernel_Reasoning_Simulations:** تفصيل عمليات محاكاة وتقييم النتائج والثقة الإدراكية لدى النواة.

---
**Constitutional Architect & System Guardian**  
*Qaroni AI Operating System Control Center*
