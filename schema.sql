
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
create table if not exists jobs(
        job_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        queue_name varchar(255),
        job_type varchar(255),
        payload JSONB,
        job_status varchar(255),
        job_priority int,
        job_created_at timestamp DEFAULT current_timestamp,
        job_scheduled_for timestamp,
        attempts int,
        max_retries int,
        last_error varchar(255)
);

create index if not exists index1 on jobs(queue_name, job_status,job_priority, job_scheduled_for);

create index if not exists index2 on jobs(job_created_at);