const express = require('express'); //imports the express framework that handles the hhtp requests
const db = require('./db'); // imports the pool from postgres and .env

const app = express(); //creates an exprress instance which will eb usedd to connect eberuthing
app.use(express.json()); // Important: allows Express to parse JSON bodies


app.post('/jobs', async (req, res) => {
  const { queue_name, job_type, payload, job_priority = 0 } = req.body; //Destructures request body. 
  //Extracts the required job parameters (queue_name, job_type, payload) from the JSON body of the request (req.body). 
  //It also sets a default value of 0 for priority if the client doesn't provide o

  // 1. Basic Validation
  if (!queue_name || !job_type || !payload) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. The SQL Query
  // We use $1, $2, etc. to prevent SQL Injection.
  // We set status='pending' by default.
  // RETURNING id gives us back the UUID Postgres generated.
  const queryText = `
    INSERT INTO jobs (queue_name, job_type, payload, job_priority, job_status, job_created_at)
    VALUES ($1, $2, $3, $4, 'pending', NOW())
    RETURNING job_id;
  `;

  const values = [queue_name, job_type, payload, job_priority]; //Parameters Array: Creates an ordered array of JavaScript variables
  //  that will safely replace the $1 through $4 placeholders in the SQL query, preventing injection attacks.

  try {
    // 3. Execute the query using our db module
    const result = await db.query(queryText, values); //Execute Query: Calls the function from your
    // no database module to run the SQL command. The program pauses here until a response is received from PostgreSQL.
    
    // 4. Return the new Job ID to the user
    res.status(201).json({
      message: 'Job created successfully',
      job_id: result.rows[0].job_id
    });
  } catch (error) {
    console.error('Database Insert Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
console.log(`Job Queue API running on http://localhost:${PORT}`);
});