# Qaroni AI Operating System — State Flow Validation
## تقرير التحقق من مسار وتدفق الحالة وتوحيد معرّف التشغيل (RunID) عبر الأنظمة

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (Article V: Technical Sanctity & Structural Safety) 
  → **Article 5.2** (Documentation & Reporting Sovereignty) 
  → **ADR-002** (Autonomous Execution & Governance Framework) 
  → **Architecture** (Section 3: Self-Documenting System Architecture) 
  → **Specification** (Reports Module Integration Spec) 
  → **Decision** (Compile Phase 2 Comprehensive Operating System Audit Reports) 
  → **Implementation** (Create /qaroni-engine/reports/StateFlowValidation.md) 
  → **Validation** (Linter Inspection & Structural Integrity Verification) 
  → **Deployment** (Live Dashboard File System Commit) 
  → **Audit** (Technical Audit Protocol Log #2026-07-01-SFV)

---

## 1. Unified Execution Context Model (نموذج سياق التنفيذ الموحد)

To guarantee consistent behavior and complete audit traceability, every operation inside the Qaroni AI Operating System is pinned to a singular, immutable **Unified Execution Context**. 

This context is initialized at the gateway level and carried unchanged through all downstream subsystems.

```typescript
export interface UnifiedExecutionContext {
  runId: string;                 // Immutable UUIDv4 tracking key
  agentName: string;             // Active calling agent (e.g. Qaroni_Executor)
  operationType: string;         // 'migration' | 'policy_update' | 'write' | 'read'
  payload: any;                  // Actual payload (SQL script, source diff, etc.)
  constitutionArticle: string;   // Mandated governing Article reference
  adrReference: string;          // Architectural Decision Record ID
  specificationModule: string;   // Specification document reference
  systemContext: string;         // AUTONOMOUS_GOVERNED_COGNITIVE_ENGINE
  riskScore: number;             // Assigned risk metric (0-100)
  rollbackPointer: string;       // Stable state rollback snapshot reference
}
```

---

## 2. RunID Lifespan & Progression (دورة حياة ومسار معرّف التشغيل الموحد)

The audit confirms that a single transaction ID (`run_id`) flows sequentially through all modules:

```
[Gateway Interception] ────► Initializes UUID (run_id) & sets state to "pending"
        │
        ▼
[BrainKernel & Reasoning] ──► Receives payload & run_id; evaluates consequences & score
        │
        ▼
[Sandbox & Validation] ────► RunID used to prefix temporary testing tables & branch names
        │
        ▼
[Human OTP Gate] ──────────► RunID rendered on Dashboard UI for visual verification
        │
        ▼
[Write & Execution] ───────► Pushed to production; run_id written into permanent table primary keys
        │
        ▼
[Post-Validation] ─────────► Verifies live health against the same active run_id context
        │
        ▼
[Immutable Audit Logger] ──► Audit log committed under the run_id primary index in AuditProtocol.md
```

---

## 3. Context Validation Verification (تأكيد صحة سياق الحالة المشترك)

Our code audits verify that:
1. **Zero Context Loss:** When `ControlGateway.ts` delegates tasks, the `runId` is passed down explicitly as an argument, never relying on fragile, asynchronous thread-local storage or global state flags.
2. **Deterministic State Transition:** No state transition can be written to the database or logged in the audit file without supplying the corresponding validated `runId`.
3. **Dashboard Sync:** The admin dashboard UI (`Dashboard.tsx`) binds to the state database via real-time WebSocket/REST subscriptions keyed precisely to the `runId` index.

---
**Lead Software Architect & Constitutional Guardian**  
*Qaroni AI Operating System Control Center*
