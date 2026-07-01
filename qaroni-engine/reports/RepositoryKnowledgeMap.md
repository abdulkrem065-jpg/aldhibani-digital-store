# Qaroni AI Operating System — Repository Knowledge Map
## خريطة المكونات والمسارات المعرفية لمستودع محرك التشغيل الكامل

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (Article V: Technical Sanctity & Structural Safety) 
  → **Article 5.2** (Documentation & Reporting Sovereignty) 
  → **ADR-002** (Autonomous Execution & Governance Framework) 
  → **Architecture** (Section 3: Self-Documenting System Architecture) 
  → **Specification** (Reports Module Integration Spec) 
  → **Decision** (Compile Phase 2 Comprehensive Operating System Audit Reports) 
  → **Implementation** (Create /qaroni-engine/reports/RepositoryKnowledgeMap.md) 
  → **Validation** (Linter Inspection & Structural Integrity Verification) 
  → **Deployment** (Live Dashboard File System Commit) 
  → **Audit** (Technical Audit Protocol Log #2026-07-01-RKM)

---

## 1. Directory Structural Mapping (خرائط مجلدات مستودع نظام التشغيل)

The physical structure of the **Qaroni AI Operating System** is organized under `/qaroni-engine` and the main full-stack server workspace. The structure and owner roles are detailed below:

```
workspace/
├── qaroni-engine/                  # Core AI Operating System Domain
│   ├── agents/                     # AI Agent definitions and constraints
│   │   └── AgentsManifest.md       # [Owner: Qaroni_Architect] Defines agent capabilities
│   ├── architecture/               # Design specifications
│   │   ├── Components.md           # [Owner: Qaroni_Architect] Modules specification
│   │   ├── EngineArchitecture.md   # [Owner: Qaroni_Architect] System layers design
│   │   └── ExecutionFlow.md        # [Owner: Qaroni_Architect] Sequential steps definition
│   ├── audit/                      # Immutable technical audit files
│   ├── brain/                      # Cognitive reasoning kernel
│   │   └── ReasoningCore.ts        # [Owner: Qaroni_Analyzer] Consequence & risk analysis
│   ├── config/                     # Environment configuration JSONs
│   │   └── environments.json       # [Owner: Qaroni_Executor] 4 Environments setup
│   ├── constitution/               # Constitutional legal limits
│   │   └── EngineConstitution.md   # [Owner: Human Owner] Immutable system guidelines
│   ├── database/                   # Schema blueprints
│   ├── deployment/                 # Deployment automation
│   ├── docs/                       # Manuals and documentation
│   ├── events/                     # Event catalog and metadata
│   │   └── EventCatalog.md         # [Owner: Qaroni_Auditor] Active engine event catalog
│   ├── evidence/                   # Structural verification logs
│   │   ├── FilesManifest.md        # [Owner: Qaroni_Auditor] Manifest list of active files
│   │   └── Tree.txt                # [Owner: Qaroni_Auditor] Full directory tree layout
│   ├── gateway/                    # Request interception layer
│   │   └── ControlGateway.ts       # [Owner: Qaroni_Executor] Core transaction mediator
│   ├── github/                     # VCS integration
│   ├── migration/                  # Raw schema delta SQL scripts
│   ├── rbac/                       # Access control rules
│   │   └── EngineRBAC.md           # [Owner: Qaroni_Architect] Agent security clearances
│   ├── reports/                    # System audit and compliance reports
│   │   └── ReportsSpec.md          # [Owner: Qaroni_Auditor] Technical specifications of reports
│   ├── state/                      # Durable state persistence
│   │   └── qaroni_engine_state     # [Owner: State Machine] State schema blueprint
│   ├── tests/                      # Unit and integration test suites
│   └── validation/                 # Static analysis and verification policies
│       └── Knowledge_Validation_Rules.md # [Owner: Qaroni_Validator] Integrity rules
├── server/                         # Backend full-stack logic
│   └── supabase.ts                 # [Owner: Qaroni_Executor] Supabase client interface
├── src/                            # Frontend dashboard UI React files
│   └── admin/                      # Admin administration console
│       └── Dashboard.tsx           # [Owner: Qaroni_Auditor] Full control dashboard UI
└── server.ts                       # [Owner: Qaroni_Executor] Main system server listener
```

---

## 2. Core Execution Path Map (مسارات التنفيذ البرمجي الكبرى)

### Path A: Structural Change & Migration Execution Path (مسار تعديل هياكل قواعد البيانات)
1. **Trigger:** AI Agent requests database schema change.
2. **Mediation:** `ControlGateway.ts` intercepts payload and assigns `run_id`.
3. **Reasoning:** `ReasoningCore.ts` evaluates risk score and confidence.
4. **Validation:** Static validation check against `Knowledge_Validation_Rules.md`.
5. **Isolation:** Supabase Branch sandbox created via isolated REST routes.
6. **Self-Validation:** Mock data query execution (INSERT -> SELECT -> DELETE).
7. **Approval:** Frontend prompts human operator for OTP verification on `Dashboard.tsx`.
8. **Commit:** `Write Gateway` pushes migration to database and commits SQL to GitHub.
9. **Finalization:** Permanent logging in `AuditProtocol.md`.

### Path B: Read Only Inspection Path (مسار قراءة واستعلام البيانات)
1. **Trigger:** Client requests table layout read-only inspection.
2. **Mediation:** `ControlGateway.ts` intercepts and verifies calling agent role is `Qaroni_Reader` or `Qaroni_Auditor`.
3. **Execution:** Accesses the database read APIs safely.
4. **Logging:** Records read request in the transient state machine without gating.

---

## 3. Dependency Path Mapping (خريطة مسارات الاعتمادية المتقاطعة)

* **ReasoningCore.ts** is independent (depends only on core TypeScript types).
* **ControlGateway.ts** depends on:
  * `ReasoningCore.ts` (Risk assessment)
  * `supabase.ts` (Cloud access Client)
  * `/qaroni-engine/state/qaroni_engine_state` (Durable states definition)
* **Dashboard.tsx** depends on `ControlGateway.ts` (API proxies) to render system logs and state machines.

---
**Lead Software Architect & Constitutional Guardian**  
*Qaroni AI Operating System Control Center*
