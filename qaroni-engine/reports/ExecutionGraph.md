# Qaroni AI Operating System — Execution Graph
## مخطط ومسار التدفق التنفيذي المتسلسل لعمليات نظام التشغيل

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (Article V: Technical Sanctity & Structural Safety) 
  → **Article 5.2** (Documentation & Reporting Sovereignty) 
  → **ADR-002** (Autonomous Execution & Governance Framework) 
  → **Architecture** (Section 3: Self-Documenting System Architecture) 
  → **Specification** (Reports Module Integration Spec) 
  → **Decision** (Compile Phase 2 Comprehensive Operating System Audit Reports) 
  → **Implementation** (Create /qaroni-engine/reports/ExecutionGraph.md) 
  → **Validation** (Linter Inspection & Structural Integrity Verification) 
  → **Deployment** (Live Dashboard File System Commit) 
  → **Audit** (Technical Audit Protocol Log #2026-07-01-EG)

---

## 1. Visual Execution Graph (مخطط سريان العمليات المرئي)

```
       [USER / CLIENT / AGENT REQUEST]
                      │
                      ▼
             1. ControlGateway
                      │
                      ▼
              2. BrainKernel
                      │
                      ▼
              3. ReasoningCore (Confidence & Consequences Evaluation)
                      │
         ┌────────────┴────────────┐
         ▼ (Confidence < 85%)      ▼ (Confidence >= 85%)
   [HARD BLOCK]             4. Risk Assessment (Low/Med/High/Critical)
                                   │
                                   ▼
                            5. Validation (Knowledge Validation check)
                                   │
                                   ▼
                            6. Sandbox Environment (Supabase Isolated Branch)
                                   │
                                   ▼
                            7. Self-Validation (Syntax & Integrity test run)
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼ (Test Failed)                                     ▼ (Test Succeeded)
   8. Feedback Loop                                          │
         │                                                   │
         ├──► [Attempts < 3] Retry / Repair                  │
         │                                                   │
         └──► [Attempts >= 3] 9. Rollback Engine             │
                                    │                        │
                                    ▼                        ▼
                            [TERMINATE: FAIL]       10. Human Approval Gate
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   ▼ (OTP Denied/Timeout)                              ▼ (OTP Approved)
                            11. Rollback Engine                                 12. Secure Write Gateway
                                   │                                                   │
                                   ▼                                                   ▼
                            [TERMINATE: FAIL]                                  13. Live Production Execution
                                                                                       │
                                                                                       ▼
                                                                               14. Post-Validation Smoke Run
                                                                                       │
                                                               ┌───────────────────────┴───────────────────────┐
                                                               ▼ (Smoke Test Fail)                             ▼ (Smoke Test Success)
                                                        15. Rollback Engine                               16. Environment Cleanup
                                                               │                                               │
                                                               ▼                                               ▼
                                                        [TERMINATE: FAIL]                              17. Immutable Audit Logger
                                                                                                               │
                                                                                                               ▼
                                                                                                      [STATUS: COMPLETED]
```

---

## 2. Phase-by-Phase Execution Protocol (تفصيل خطوات بروتوكول التشغيل)

1. **User Request Interception (بوابة الاعتراض والالتقاط):**
   The `ControlGateway.ts` intercepts any query, mutation, or schema migration proposed by a client or an AI agent. It provisions a unique `run_id` (UUIDv4) and registers a pending state inside `qaroni_engine_state`.

2. **BrainKernel Verification (نواة التحقق العقلي):**
   Applies general semantic checks and validates against `EngineConstitution.md` to guarantee the requested operation matches the systemic design.

3. **ReasoningCore Consequence Assessment (محرك تقييم النتائج والمحاكاة):**
   Calculates cognitive confidence (0-100) and risk score (0-100). Evaluates SQL query strings for dangerous commands (e.g. `DROP`, `TRUNCATE`, `ALTER`). Blocks immediately if confidence score is below 85.

4. **Risk Classification (تصنيف المخاطر):**
   Labels the task as `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`. High and Critical classifications enforce OTP gates and prevent any direct execution without a human digital signature.

5. **Knowledge Validation (التحقق المعرفي من تماسك الهيكل):**
   Enforces schema syntax, FK constraints, and presence of indexes. Verifies that all newly proposed tables have Row Level Security (RLS) enabled.

6. **Sandbox Isolation (عزل فروع قواعد البيانات):**
   Spins up an isolated physical branch of the database (via Supabase CLI/API/Isolated Branch Schema) to simulate the changes without corrupting the production database.

7. **Self-Validation Dry Run (الاختبار الذاتي الميداني):**
   Runs a series of mock test executions (INSERT -> SELECT -> DELETE) on the isolated sandbox to verify constraints, triggers, and query performance under simulated conditions.

8. **Feedback & Repair (حلقة معالجة وتصحيح الأخطاء):**
   In case of test failure, the system automatically writes a "Fix Report", corrects the syntax, and re-executes up to 3 times.

9. **Rollback (محرك التراجع والإنقاذ):**
   In case of permanent failure, the system completely reverses any intermediate state, drops temporary database entities, and restores git branches to prevent configuration drift.

10. **Human Approval Gate (بوابة التوقيع الرقمي والتفويض):**
    Halts execution and prompts the system administrator for an OTP. Resumes only when the correct token is verified.

11. **Secure Write Gateway (بوابة الكتابة المعتمدة والآمنة):**
    Applies the changes to the production Supabase schema and commits the validated source code to the GitHub master branch.

12. **Post-Validation Smoke Run (فحص الاستقرار البعدي):**
    Executes deep stability test runs on live production to confirm that RLS and tenant-isolation boundaries remain unbroken.

13. **Cleanup (التنظيف الشامل وإخلاق الموارد):**
    Safely tears down all sandbox instances, deletes temporary branches, and purges session caches.

14. **Technical Audit Logging (مسجل النزاهة الدائمة):**
    Appends the permanent decision log, containing the complete Decision Trace, to `/qaroni-engine/protocols/AuditProtocol.md`.

---
**Lead Software Architect & Constitutional Guardian**  
*Qaroni AI Operating System Control Center*
