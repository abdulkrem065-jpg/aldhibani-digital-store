# Architectural Decision Records (ADR)

This directory contains the Architectural Decision Records (ADR) for the project, tracking significant architectural decisions, their context, and consequences.

## Directory Structure

- `/architecture` - Root directory for architectural guidelines, schemas, and compliance scanners.
  - `/ADR` - Architecture Decision Records.

## Active Architectural Standards

- [Architecture V5 Master Constitution (الدستور الأعلى للنظام)](../CONSTITUTION.md)
- [ADR 0001: V5 Execution Roadmap and Governance Doctrine](0001-v5-execution-roadmap.md)
- [ADR 0002: Managing the RBAC system outside RLS in the Backend Layer](ADR-002-RBAC-Outside-Database.md)
- [System Registry (سجل المعايير والترقيم)](../SystemRegistry.md)
- [Execution Log (سجل تنفيذ معايير الـ V5)](../ExecutionLog.md)
- [Rollback & Recovery Guide (دليل خطط التراجع وحماية البيانات)](../Rollback.md)

1. **V4+ Hardened Architecture Compliance**:
   - Strictly enforced layered architecture (Layer 1: Tenant Isolation to Layer 6: AI Governance).
   - System Control Tables (SCTs) protection (e.g., `organization_maintenance_flags`, `store_config`, `ai_governance_settings`).
   - Write operations on SCTs are completely isolated from client-side direct writes (forbidden via standard PostgREST) and must route through trusted backend Edge Functions/RPCs executing with `service_role` or `bypassrls`.
