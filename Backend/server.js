const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---
const studentRoutes = require('./src/routes/students');
const teacherRoutes = require('./src/routes/teachers');
const adminRoutes = require('./src/routes/admin');

app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.listen(port, () => {
  console.log(`🚀 Attendease running on http://localhost:${port}`);
});