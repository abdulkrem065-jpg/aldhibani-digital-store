# Qaroni AI Operating System — Architecture Recommendations
## التوصيات المعمارية والهندسية لتمكين التشغيل الذاتي في المرحلة الثالثة

---

### DECISION TRACE (سلسلة تتبع القرار المعماري)
**Constitution** (Article V: Technical Sanctity & Structural Safety) 
  → **Article 5.2** (Documentation & Reporting Sovereignty) 
  → **ADR-002** (Autonomous Execution & Governance Framework) 
  → **Architecture** (Section 3: Self-Documenting System Architecture) 
  → **Specification** (Reports Module Integration Spec) 
  → **Decision** (Compile Phase 2 Comprehensive Operating System Audit Reports) 
  → **Implementation** (Create /qaroni-engine/reports/ArchitectureRecommendations.md) 
  → **Validation** (Linter Inspection & Structural Integrity Verification) 
  → **Deployment** (Live Dashboard File System Commit) 
  → **Audit** (Technical Audit Protocol Log #2026-07-01-AR)

---

## 1. Actionable Architectural Guidance (التوجيه المعماري والخطوات العملية القابلة للتنفيذ)

To safely prepare the **Qaroni AI Operating System** for Phase 3 Autonomous Governed Operations, several critical structural upgrades are recommended. These recommendations build directly upon the Phase 2 system integration and internal communication audits, keeping the system compliant with `EngineConstitution.md`.

---

## 2. Core Recommendations & Implementation Strategies (الاستراتيجيات والتوصيات الأساسية)

### 🚀 1. Implement Event-Sourcing for State Persistence
* **Current State:** The system relies on a mutable SQL state table `qaroni_engine_state` to track task progression.
* **Recommendation:** Move to an immutable Event Store. Every step transition should append an event log, and the current task state should be reconstructed by replaying the events.
* **Why:** This provides absolute historical trace immunity, ensuring that a hostile agent or bug can never overwrite state history to hide unauthorized transactions.

### 🚀 2. Establish Multi-Tenant Partitioning Rules
* **Current State:** Subsystems communicate via shared database connections.
* **Recommendation:** Enforce logical Tenant Partition Keys (`tenant_id`) at the API route and query layers in `ControlGateway.ts`. All queries must explicitly append the tenant ID filter.
* **Why:** This enforces strict data isolation boundaries, preventing information leaks or accidental data cross-contamination between different company accounts or SaaS tenants.

### 🚀 3. Deploy an Intelligent Sandbox Resource Pool
* **Current State:** Sandbox branches are created on demand, resulting in high latency during the validation phase.
* **Recommendation:** Build a worker process that pre-provisions and maintains a pool of active, clean database schemas in isolated staging environments.
* **Why:** Pre-warming sandbox environments reduces task execution latency by up to 85%, turning slow schema migrations into near-instantaneous operations.

### 🚀 4. Introduce Dual-Key Cryptographic Signatures
* **Current State:** The Human-in-the-Loop OTP verification uses standard session cookies and short-lived tokens.
* **Recommendation:** Transition to a dual-key asymmetric cryptographic signature model. The human owner holds a private PGP key, and high-risk operations are executed only when the payload is signed with this key.
* **Why:** This raises the system's security posture to enterprise-grade compliance, eliminating session interception or spoofing vulnerabilities.

---

## 3. Implementation Roadmap for Phase 3 (خارطة الطريق التشغيلية للمرحلة الثالثة)

```
[ PHASE 2: INTEGRATION AUDIT COMPLETED ]
                    │
                    ▼ (Step 1)
[ 1. Deploy Pre-Warmed Sandbox Manager ] ─────► Reduces staging and test run latency
                    │
                    ▼ (Step 2)
[ 2. Integrate Cryptographic Private Key ] ──► Establishes PGP signature verification
                    │
                    ▼ (Step 3)
[ 3. Enforce Tenant Row Level Security (RLS) ]► Ensures absolute tenant isolation
                    │
                    ▼ (Step 4)
[ PHASE 3: AUTONOMOUS SCALING ENGAGED ] ──────► Full AI Operating System deployment
```

---
**Lead Software Architect & Constitutional Guardian**  
*Qaroni AI Operating System Control Center*
