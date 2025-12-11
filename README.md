what the jobt table looks like:




create a worker app which act as user with user previledges (why?)

roadmap
make schema in database which is hosted on postgres in docker container

using this command
cat schema.sql | docker exec -i task_queue_db psql -U worker_app -d task_queue_system

see what was made:
docker exec -it task_queue_db psql -U worker_app -d task_queue_system -c "\d jobs"

check the table
docker exec -it task_queue_db psql -U worker_app -d task_queue_system -c "SELECT * FROM jobs;"




make a database pool only in postgres, what is that query field?

make index.js for api entry point
 why do we use $ to prevent sql injection

use curl to test the post endpoint
Invoke-RestMethod -Uri http://localhost:3000/jobs `
    -Method Post `
    -ContentType 'application/json' `
    -Body '{ "queue_name": "email", "job_type": "send_welcome_email", "job_priority": 10, "payload": { "user_id": 123, "email": "test@example.com" } }'