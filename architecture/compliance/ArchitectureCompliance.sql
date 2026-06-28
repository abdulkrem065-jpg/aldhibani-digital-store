-- ==============================================================================
-- 🛡️ مفسر ومحرك فحص الامتثال للدستور الأعلى (Architecture Compliance Engine V5)
-- ==============================================================================
-- الغرض: فحص وتقييم امتثال قاعدة البيانات الحية لبنود الدستور V5 بالدليل المادي.
-- النوع: استعلامات قراءة وتفتيش فقط (READ-ONLY DIAGNOSTIC QUERIES).
-- يمنع استخدام: ALTER, CREATE, DROP, DELETE, UPDATE, INSERT.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. جدول الفحص الإجمالي العام (Global Compliance Executive Summary)
-- ------------------------------------------------------------------------------
WITH 
table_inventory AS (
    -- جرد الجداول الحية في المخطط العام لنعرف حجم التنفيذ
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
),
rls_status AS (
    -- قياس مدى تغطية حماية صفوف قاعدة البيانات RLS
    SELECT 
        tablename,
        rowsecurity AS has_rls
    FROM pg_tables
    WHERE schemaname = 'public'
),
identity_check AS (
    -- فحص النطاق الأول: الهوية
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'staff_users') 
                 AND EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'organization_members')
            THEN 
                -- التحقق من استخدام UUID
                CASE 
                    WHEN (
                        SELECT data_type 
                        FROM information_schema.columns 
                        WHERE table_name = 'staff_users' AND column_name = 'id'
                    ) = 'uuid' 
                    THEN 'PASS'
                    ELSE 'WARNING: ID is stored as TEXT, deterministic UUID migration pending.'
                END
            ELSE 'NOT IMPLEMENTED'
        END AS status,
        'Identity: staff_users & organization_members tables check'::text AS description
),
isolation_check AS (
    -- فحص النطاق الثاني: عزل المستأجرين
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND column_name IN ('organization_id', 'org_id')
            ) THEN 
                CASE 
                    -- التأكد من تغطية العزل للجداول الحساسة كالفواتير والمنتجات
                    WHEN EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name IN ('organization_id', 'org_id')
                    ) AND EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' AND table_name = 'products' AND column_name IN ('organization_id', 'org_id')
                    ) THEN 'PASS'
                    ELSE 'WARNING: Tenant ID missing in some core operational tables.'
                END
            ELSE 'NOT IMPLEMENTED'
        END AS status,
        'Tenant Isolation: presence of organization/tenant boundaries'::text AS description
),
rls_compliance_rate AS (
    -- فحص النطاق الثالث: RLS
    SELECT 
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM rls_status) THEN 'NOT IMPLEMENTED'
            WHEN EXISTS (SELECT 1 FROM rls_status WHERE has_rls = false AND tablename NOT IN ('schema_migrations', 'pg_stat_statements')) THEN 'FAIL: Unprotected tables exist in public schema!'
            ELSE 'PASS'
        END AS status,
        'Row Level Security: All public tables must have RLS active'::text AS description
),
rbac_check AS (
    -- فحص النطاق الرابع: نظام الصلاحيات
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'rbac_roles')
                 AND EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'rbac_permissions')
            THEN 'PASS'
            ELSE 'NOT IMPLEMENTED'
        END AS status,
        'RBAC: Presence of roles, permissions, and assignment tables'::text AS description
),
ai_domain_check AS (
    -- فحص النطاق الخامس: نطاق الذكاء الاصطناعي وحفظ الذاكرة
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'ai_conversations')
                 AND EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'ai_messages')
            THEN 
                CASE 
                    WHEN EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'ai_knowledge_base') THEN 'PASS'
                    ELSE 'WARNING: Vector memory table (ai_knowledge_base) missing.'
                END
            ELSE 'NOT IMPLEMENTED'
        END AS status,
        'AI Domain: AI conversational state and memory tables check'::text AS description
),
audit_check AS (
    -- فحص النطاق السادس: التدقيق والرقابة الفيدرالية
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM table_inventory WHERE table_name = 'audit_log') THEN 
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM pg_trigger 
                        WHERE tgname NOT LIKE 'pg_sync%' AND tgisinternal = false
                    ) THEN 'PASS'
                    ELSE 'WARNING: audit_log table exists but no triggers detected.'
                END
            ELSE 'NOT IMPLEMENTED'
        END AS status,
        'Audit Logging: Presence of audit_log and active audit triggers'::text AS description
)

-- تجميع مخرجات فحص الدستور الإجمالية
SELECT '1. IDENTITY DOMAIN' AS Domain, status AS Status, description AS Evidence FROM identity_check
UNION ALL
SELECT '2. TENANT ISOLATION' AS Domain, status AS Status, description AS Evidence FROM isolation_check
UNION ALL
SELECT '3. ROW LEVEL SECURITY (RLS)' AS Domain, status AS Status, description AS Evidence FROM rls_compliance_rate
UNION ALL
SELECT '4. RBAC DOMAIN' AS Domain, status AS Status, description AS Evidence FROM rbac_check
UNION ALL
SELECT '5. AI DOMAIN & VECTOR STORAGE' AS Domain, status AS Status, description AS Evidence FROM ai_domain_check
UNION ALL
SELECT '6. CENTRALIZED AUDIT LOG' AS Domain, status AS Status, description AS Evidence FROM audit_check;


-- ------------------------------------------------------------------------------
-- 2. كشاف تفاصيل الجداول وحماية الـ RLS (Detailed Table & RLS Protection Audit)
-- ------------------------------------------------------------------------------
SELECT 
    t.table_name AS "Table Name",
    CASE 
        WHEN p.rowsecurity = true THEN '🔒 PASS (RLS Active)'
        ELSE '🔓 FAIL (RLS INACTIVE - SECURITY THREAT!)'
    END AS "RLS Status",
    (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = t.table_name
    ) AS "Column Count",
    COALESCE(
        (SELECT 'Yes' FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name AND column_name = 'organization_id' LIMIT 1),
        (SELECT 'Yes (as org_id)' FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name AND column_name = 'org_id' LIMIT 1),
        'No'
    ) AS "Isolated by Tenant",
    COALESCE(
        (SELECT 'Yes' FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name AND column_name = 'branch_id' LIMIT 1),
        'No'
    ) AS "Branch Filter Support"
FROM information_schema.tables t
LEFT JOIN pg_tables p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN ('schema_migrations', 'pg_stat_statements')
ORDER BY "RLS Status" DESC, t.table_name ASC;


-- ------------------------------------------------------------------------------
-- 3. جرد سياسات الـ RLS المثبتة (Enforced Row Level Security Policies)
-- ------------------------------------------------------------------------------
SELECT 
    schemaname AS "Schema",
    tablename AS "Table Name",
    policyname AS "Policy Name",
    roles AS "Target Roles",
    cmd AS "Command type (ALL/SELECT/INSERT/...)",
    qual AS "Filter Condition (USING)",
    with_check AS "Validation Rule (WITH CHECK)"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename ASC, policyname ASC;


-- ------------------------------------------------------------------------------
-- 4. فحص جودة وحوكمة الصلاحيات (RBAC Integrity Audit)
-- ------------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rbac_roles') AS "Has RBAC Roles Table",
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rbac_permissions') AS "Has RBAC Permissions Table",
    COALESCE((SELECT COUNT(*) FROM rbac_roles), 0) AS "Total Defined Roles",
    COALESCE((SELECT COUNT(*) FROM rbac_permissions), 0) AS "Total Atomic Permissions",
    COALESCE((SELECT COUNT(*) FROM rbac_staff_user_roles), 0) AS "Active Staff Assignments";


-- ------------------------------------------------------------------------------
-- 5. فحص التدقيق والـ Triggers النشطة (Active Database Triggers & Functions)
-- ------------------------------------------------------------------------------
SELECT 
    event_object_table AS "Table Name",
    trigger_name AS "Trigger Name",
    action_timing AS "Timing",
    event_manipulation AS "Event Type (INSERT/UPDATE/DELETE)",
    action_statement AS "Executed Function / Action"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table ASC, trigger_name ASC;


-- ------------------------------------------------------------------------------
-- 6. هندسة الأداء والفهارس (Performance, Caching & Indexing Scan)
-- ------------------------------------------------------------------------------
SELECT 
    tablename AS "Table Name",
    indexname AS "Index Name",
    indexdef AS "Index Definition"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'pg_stat_statements')
ORDER BY tablename ASC, indexname ASC;


-- ------------------------------------------------------------------------------
-- 7. فحص قيود الحالات ودورة الحياة (Workflow & State Machines Constraints)
-- ------------------------------------------------------------------------------
SELECT 
    tc.table_name AS "Table Name",
    tc.constraint_name AS "Constraint Name",
    tc.constraint_type AS "Constraint Type",
    cc.check_clause AS "Validation / State Check Clause"
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name ASC;
