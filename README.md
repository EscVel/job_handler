# Distributed Task Queue System - Phase 1

A robust, distributed background job processing system built with Node.js and PostgreSQL. This project implements a reliable "Producer-Consumer" architecture where applications can offload time-consuming tasks to be processed asynchronously.

**Current Status:** Phase 1 (Job Submission API & Database Architecture)

## 🛠 Prerequisites

- Docker (for running the database)
- Node.js (v14+ recommended)
- PostgreSQL Client (optional, for debugging)

## 🚀 Setup & Installation

### 1. Database Environment (Docker)

We use a Docker container to host the PostgreSQL server.

**Start the Container:**

```bash
docker run -d \
  --name task_queue_db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Security & Database Initialization

We create a dedicated database and a restricted user.

**Why a restricted user?**

Security Principle of Least Privilege. If your application is compromised, an attacker using the `worker_app` user cannot access other databases on the server, drop the database itself, or change system-level configurations. They are confined to this specific sandbox.

Run these SQL commands (inside your Docker container or via a GUI tool):

```sql
CREATE DATABASE task_queue_system;
CREATE USER worker_app WITH ENCRYPTED PASSWORD 'worker_pass_123';
GRANT ALL PRIVILEGES ON DATABASE task_queue_system TO worker_app;
```

### 3. Schema Migration

Create the table structure using the `schema.sql` file.

**Apply Schema:**

```bash
# Pipes the schema file into the docker container's postgres tool
cat schema.sql | docker exec -i task_queue_db psql -U worker_app -d task_queue_system
```

**Verify Creation:**

```bash
# Check if the table exists and show columns
docker exec -it task_queue_db psql -U worker_app -d task_queue_system -c "\d jobs"
```

**Verify Data:**

```bash
# View all rows in the jobs table
docker exec -it task_queue_db psql -U worker_app -d task_queue_system -c "SELECT * FROM jobs;"
```

## 📂 Project Structure

- `schema.sql`: The database source of truth
- `db.js`: Database connection logic
- `index.js`: The API Entry point

## 🧠 Design Decisions & FAQ

### 1. The Database Pool (db.js)

**Q: Why do we export a query field instead of just the pool?**

```javascript
// db.js
module.exports = {
  query: (text, params) => pool.query(text, params),
};
```

**A: This is a Wrapper Pattern.**

- **Logging:** Right now it just passes the query through. But later, if you want to log every query's duration to find slow spots, you only have to change code in this one file, not in 100 different API routes.
- **Mocking:** It makes testing easier. You can replace this one function with a fake one during unit tests.

### 2. SQL Injection Prevention

**Q: Why do we use $1, $2 instead of putting variables directly in the string?**

**A: This is Parameterization.**

If you did this:
```sql
INSERT INTO jobs ... VALUES ('" + user_input + "')
```

And a user sent this as their name:
```
'); DROP TABLE jobs; --
```

The database would execute:
1. Insert the empty name
2. Delete your entire table

By using `$1`, PostgreSQL treats the input strictly as data, not executable code. The database sees the weird characters and just saves them as text, rendering the attack harmless.

### 3. Database Schema

**Current Table Definition:**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS jobs (
    job_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    queue_name varchar(255),
    job_type varchar(255),
    payload JSONB,
    job_status varchar(255) DEFAULT 'pending',
    job_priority int DEFAULT 0,
    job_created_at timestamp DEFAULT current_timestamp,
    job_scheduled_for timestamp,
    attempts int DEFAULT 0,
    max_retries int DEFAULT 3,
    last_error varchar(255)
);

-- Critical Index for Worker Polling Speed
CREATE INDEX IF NOT EXISTS idx_jobs_polling 
ON jobs(queue_name, job_status, job_priority, job_scheduled_for);
```

## 📡 API Usage

### Start the Server

```bash
node index.js
# Output: Job Queue API running on http://localhost:3000
```

### Create a Job (Producer)

Use curl or PowerShell to send a job to the queue.

**PowerShell:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/jobs `
    -Method Post `
    -ContentType 'application/json' `
    -Body '{ 
        "queue_name": "email", 
        "job_type": "send_welcome_email", 
        "job_priority": 10, 
        "payload": { "user_id": 123, "email": "test@example.com" } 
    }'
```

**Curl (Mac/Linux):**

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "queue_name": "email",
    "job_type": "send_welcome_email", 
    "job_priority": 10,
    "payload": { "user_id": 123, "email": "test@example.com" }
  }'
```

## 🔧 Troubleshooting

### "Relation 'jobs' does not exist"

You missed the schema migration step. Run the `cat schema.sql ...` command again.

### "Connection refused"

Is your Docker container running? Run `docker ps` to check.

### Renaming Columns

If you need to fix a column name (e.g., `job_payload` -> `payload`), use this command:

```bash
echo 'ALTER TABLE jobs RENAME COLUMN job_payload TO payload;' | docker exec -i task_queue_db psql -U worker_app -d task_queue_system
```