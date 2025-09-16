const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---

// Example: A simple route to get all users
app.get('/api/data', async (req, res) => {
  // try {
  //   const result = await db.query('SELECT * FROM your_table_name');
  //   res.json(result.rows); // Send the rows back as JSON
  // } catch (err) {
  //   console.error(err.message);
  //   res.status(500).send('Server error');
  // }
});

app.listen(port, () => {
  console.log(`🚀 Attendease running on http://localhost:${port}`);
});