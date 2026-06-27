# ADR 0001: V5 Execution Roadmap and Governance Doctrine

## Status
Accepted (Draft / Planning Phase)

## Context
The project requires a comprehensive transition from its current state (characterized by a hybrid of text-based and UUID keys, redundant JWT checking, and direct-to-database client updates) to a highly hardened, enterprise-grade multi-tenant architecture. This roadmap lays out the 11 phases designed to achieve full compliance with the V4+ and V5 architectural specifications.

## The 11 Phases of V5 Roadmap

### 🏁 Phase Sequence

1. **V5-PHASE-0: Architecture Freeze (DONE ✅)**
   - Lock down terminology, establish dictionary invariants, freeze the schema baseline.

2. **V5-PHASE-1: Identity Domain**
   - Resolve the staff user identity model.
   - Migrate staff and member identifiers from legacy types (`text`) to strict `uuid` matching `auth.users` in Supabase.

3. **V5-PHASE-2: Tenant Isolation & Core Clean-up**
   - Harden isolation mechanisms.
   - Remove redundant custom `_jwt_improve` or inline JWT evaluation policies.
   - Solidify the **Fail-Closed** rule across all policies.

4. **V5-PHASE-3: RBAC Hardening (Lockdown)**
   - Enable Row Level Security (`FORCE RLS`) on all authorization tables (`rbac_roles`, `rbac_permissions`, etc.).
   - Revoke write permissions for authenticated roles on these tables.
   - Enforce that writes are strictly processed via trusted Edge Functions or `service_role` RPCs.

5. **V5-PHASE-4: Customer Architecture & Portal**
   - Implement the three-tier customer model.
   - Set up standard support for Anonymous Sessions and a strictly Read-Only Portal for external verification.

6. **V5-PHASE-5: AI Architecture & Memory Policy**
   - Establish governance over major AI interaction tables.
   - Implement storage retention policies, context pruning, and vector deduplication strategies.

7. **V5-PHASE-6: Business Rules Engine**
   - Inject domain validations into the transactional core.
   - Enforce multi-currency handling (YER/USD/SAR) and inventory controls (e.g., prevent negative stock levels) at the core database level.

8. **V5-PHASE-7: Workflow Machine**
   - Implement state-transition pipelines for orders and debts.
   - Protect accounting ledgers from deletion or illegal updates.

9. **V5-PHASE-8: Centralized Audit Triggering**
   - Deploy automated triggers on sensitive tables (`products`, `orders`, `debts`, `store_config`) to feed into the central `audit_log` securely.

10. **V5-PHASE-9: Performance & Caching**
    - Configure query optimization indexes and `HNSW` vector indices for AI search capabilities to guarantee atomic sub-10ms response times.

11. **V5-PHASE-10: Ultimate Compliance Scanner**
    - Deploy a continuous background compliance scanner that triggers system alarms if unauthorized patterns or RLS bypasses are detected.

---

## Consequences
- No changes to active application components will take place without sequential phase authorization.
- Each phase must produce a validated audit report before moving to the next.
- System integrity is guarded continuously by automated policies.
