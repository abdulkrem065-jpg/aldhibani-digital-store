# دستور وقوانين فض التعارضات والنزاعات (Conflict Resolution Constitution)
## الميثاق الهندسي الأعلى لفض التباينات، ترجيح الوثائق، وتأمين مسار اتخاذ القرار في الأزمات البرمجية

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (QOC Article III: Authority Hierarchy)
  → **Article III.3** (Conflict Resolution Rules & Precedence)
  → **ADR-003** (Constitutional Architecture Specification)
  → **Governance** (Establishing /qaroni-os/ Directory Hierarchy)
  → **Implementation** (Create /qaroni-os/constitution/ConflictResolutionConstitution.md)
  → **Audit** (Technical Audit Protocol Log #2026-07-01-CR-CONST)

---

## المادة الأولى: هرمية ترجيح الوثائق وفض التناقض المعماري (Article I: Absolute Precedence of Documents)

1.1. **التعريف بجدول الترجيح والأولوية (Precedence Rule Definition):**  
عند حدوث أي تناقض أو تعارض أو اختلاف بين وثيقتين أو أكثر داخل نظام قاروني، يتم فض التعارض تلقائياً ورسمياً بالرجوع للهرمية الصارمة التالية والتي تعلو فيها الوثيقة الأعلى في الهرم على الوثيقة الأدنى بشكل مطلق وبدون استثناء:

```
                  Operating Constitution (الدستور هو القانون الأسمى)
                                    │
                                    ▼
                     Governance Layer (قواعد الحوكمة والتحقق)
                                    │
                                    ▼
                  ADR (Architectural Decision Records - سجل القرارات)
                                    │
                                    ▼
                       Architecture (مخططات وهيكلية الطبقات)
                                    │
                                    ▼
                         Specifications (وثائق المواصفات)
                                    │
                                    ▼
                    BrainKernel & Execution (المنطق البرمجي والذكاء)
```

1.2. **تفصيل فض النزاعات والتناقضات الكبرى (Specific Resolving Scenarios):**  
* **النزاع بين الدستور وأي وثيقة أخرى (Constitution Conflict):** في حال وجود أي تباين بين الذكاء الاصطناعي أو الأكواد أو سجلات ADR مع الدستور التشغيلي الحاكم، **يرجح الدستور فوراً**، وتُحظر العملية آلياً وبشكل تام (Hard Block).
* **النزاع بين سجلات ADR والمواصفات (ADR vs. Specification):** يرجح **سجل القرارات المعمارية (ADR)** وتُعدل المواصفات لتتطابق معه.
* **النزاع بين وثائق المواصفات والذكاء الاصطناعي (Specification vs. AI):** ترجح **وثائق المواصفات المكتوبة صراحة**، ويتم تقييد وإعادة توجيه الوكلاء للالتزام التام بحدود المواصفة.
* **النزاع بين الذكاء الاصطناعي والدستور (AI vs. Constitution):** يمنع الذكاء الاصطناعي من الإجراء فوراً، ويتم قفل الجلسة وتمرير طلب التعطيل للمالك البشري.

---

## المادة الثانية: إدارة وتدبير الاختلافات المعرفية (Article II: Technical Knowledge Conflict Mitigation)

2.1. **تجميد التنفيذ وحظر التغيير غير المستقر (Conflict Lockout Gate):**  
عند اكتشاف تعارض معرفي بين ملفات الشرح، الكتالوجات، سجلات ADR، أو قواعد البيانات الحقيقية، يقوم النظام فوراً بفرض وضع الحماية المؤقت وتجميد أي ترقيات هيكلية لمنع تفاقم الخلل (Knowledge Conflict Freeze).

2.2. **إصدار تقرير التباين المعرفي (Mandatory Conflict Reporting):**  
يجب على وكيل التدقيق (Auditor) صياغة تقرير عاجل ومفصل يُعرف بـ (Knowledge Conflict Report) يحدد مكان التعارض الدقيق، مسببات المشكلة، والحلول الفنية المقترحة المتوافقة مع الدستور لتسليمه للمالك البشري.

2.3. **السيادة المطلقة للفصل البشري (Human Supreme Veto):**  
يمتلك المالك البشري وحده الحق المطلق والنهائي في فض التباينات المعرفية وفك تجميد النظام. يعتبر قرار المالك البشري الصادر عبر لوحة التحكم بمثابة مرسوم تنفيذي واجب النفاذ ويلغي أي تعارض برمي أو دستوري سابق.

---
**Constitutional Architect & System Guardian**  
*Qaroni AI Operating System Control Center*
