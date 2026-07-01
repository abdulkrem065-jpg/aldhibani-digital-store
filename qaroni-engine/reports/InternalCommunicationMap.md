# Qaroni AI Operating System — Internal Communication Map
## خريطة مسارات الاتصال البيني والتبعية وهيكلية ملكية المكونات

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (Article V: Technical Sanctity & Structural Safety) 
  → **Article 5.2** (Documentation & Reporting Sovereignty) 
  → **ADR-002** (Autonomous Execution & Governance Framework) 
  → **Architecture** (Section 3: Self-Documenting System Architecture) 
  → **Specification** (Reports Module Integration Spec) 
  → **Decision** (Compile Phase 2 Comprehensive Operating System Audit Reports) 
  → **Implementation** (Create /qaroni-engine/reports/InternalCommunicationMap.md) 
  → **Validation** (Linter Inspection & Structural Integrity Verification) 
  → **Deployment** (Live Dashboard File System Commit) 
  → **Audit** (Technical Audit Protocol Log #2026-07-01-ICM)

---

## 1. Ownership & Responsibility Registry (سجل الملكية والمسؤوليات)

Every module in the Qaroni AI OS is strictly owned and governed by a specific architectural component:

| Module Name | File Location | Architectural Owner | Core Responsibility |
| :--- | :--- | :--- | :--- |
| **ControlGateway** | `/qaroni-engine/gateway/ControlGateway.ts` | `State Machine` | Interception, routing, transaction mediation. |
| **ReasoningCore** | `/qaroni-engine/brain/ReasoningCore.ts` | `BrainKernel` | Consequence simulation, confidence metric assignment. |
| **State Table** | `/qaroni-engine/state/qaroni_engine_state` | `State Machine` | In-memory and persistent transaction tracking. |
| **Audit Protocol** | `/qaroni-engine/protocols/AuditProtocol.md` | `Audit Logger` | Immutable execution logging and historical indexing. |
| **RBAC Policies** | `/qaroni-engine/rbac/EngineRBAC.md` | `Constitutional Guard`| Role authorization gates and scope validation. |
| **Validation Rules**| `/qaroni-engine/validation/Knowledge_Validation_Rules.md` | `Self-Validation` | Pre-execution schemas and relationship checks. |

---

## 2. Producer / Consumer Data Flows (تدفق البيانات والمنتجون والمستهلكون)

| Component | Produces | Consumes | Purpose |
| :--- | :--- | :--- | :--- |
| **Client / API Agent** | User Requests, SQL payloads | Operational feedback, execution results | Demands change execution |
| **ControlGateway** | RunID, execution contexts, states | SQL payloads, security checks | Mediates the transaction pipeline |
| **ReasoningCore** | Confidence scores, risk scores | SQL query strings, agent identity | Assesses risk before validation |
| **State Machine** | Persistent steps, checkpoint logs | Step outcomes, exception traces | Prevents state corruption on crashes |
| **Validation Engine**| Dry-run results, linter outcomes | Proposed SQL schema blueprints | Assures database schema consistency |
| **Audit Logger** | `/qaroni-engine/protocols/AuditProtocol.md` | RunID summaries, decision traces | Creates immutable records of action |

---

## 3. Dependency Path Hierarchy (هرمية التبعية المتبادلة)

The calling sequence and import dependencies are highly disciplined to prevent coupling:

```
[ControlGateway.ts]
   │
   ├──► Imports & Calls: [ReasoningCore.ts] (Evaluation of Consequence & Confidence)
   │
   ├──► Imports & Calls: [supabase Client] (Execution of Reads & Writes)
   │
   ├──► Interacts with: [/qaroni-engine/state/qaroni_engine_state] (Central State Table)
   │
   ├──► Appends to: [/qaroni-engine/protocols/AuditProtocol.md] (Audit Protocol Logger)
   │
   └──► Interacts with: [/src/admin/Dashboard.tsx] (Reactive Front-end dashboard sync)
```

No module is permitted to import or call `ControlGateway.ts` back, ensuring a strictly **unidirectional dependency path** and preventing circular dependency paths.

---
**Lead Software Architect & Constitutional Guardian**  
*Qaroni AI Operating System Control Center*
