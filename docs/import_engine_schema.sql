-- SQL migration file for Cloud Native Import Engine v2
-- This script contains the exact table structures for import job tracking and resilient queues in Supabase.

-- 1. Create import_jobs table
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, success, failed, rolled_back
    progress NUMERIC NOT NULL DEFAULT 0,
    current_chunk INT NOT NULL DEFAULT 0,
    info TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    summary JSONB,
    errors JSONB DEFAULT '[]'::jsonb,
    inserted_ids JSONB DEFAULT '{"categories":[],"products":[],"customers":[],"orders":[]}'::jsonb
);

-- Enable RLS for import_jobs
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticating users or system service roles
CREATE POLICY "Allow authenticated full control on import_jobs" 
ON public.import_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon service access on import_jobs" 
ON public.import_jobs FOR ALL TO anon USING (true) WITH CHECK (true);


-- 2. Create import_job_events table
CREATE TABLE IF NOT EXISTS public.import_job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- job_started, chunk_processed, error, completed
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.import_job_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public events access" 
ON public.import_job_events FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- 3. Create import_rollbacks table
CREATE TABLE IF NOT EXISTS public.import_rollbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- pending, rolling_back, success, failed
    rolled_back_by TEXT NOT NULL,
    rolled_back_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    error_message TEXT
);

ALTER TABLE public.import_rollbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public rollbacks access" 
ON public.import_rollbacks FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- 4. Create import_chunks table
CREATE TABLE IF NOT EXISTS public.import_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    chunk_number INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- pending, processing, success, failed
    record_count INT DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

ALTER TABLE public.import_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public chunks access" 
ON public.import_chunks FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
