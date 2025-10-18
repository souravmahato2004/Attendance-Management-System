const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// Teacher Signup Route
router.post('/signup', async (req, res) => {
  const { teacherId, name, email, password, department } = req.body;

  if (!teacherId || !name || !email || !password || !department) {
    return res.status(400).json({ message: 'All fields, including Teacher ID, are required.' });
  }

  try {
    const departmentResult = await db.query("SELECT department_id FROM departments WHERE department_name = $1", [department]);

    if (departmentResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid department selected.' });
    }

    const departmentId = departmentResult.rows[0].department_id;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newTeacherResult = await db.query(
      `INSERT INTO teachers (teacher_id, name, email, password, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING teacher_id`,
      [teacherId, name, email, hashedPassword, departmentId]
    );

    console.log('New teacher created with ID:', newTeacherResult.rows[0].teacher_id);
    res.status(201).json({ success: true, message: 'Teacher account created successfully!' });

  } catch (err) {
    if (err.code === '23505') {
        if (err.constraint === 'teachers_pkey') {
             return res.status(409).json({ message: 'Teacher ID already exists.' });
        }
      return res.status(409).json({ message: 'Email already exists.' });
    }
    console.error('Teacher Signup Error:', err);
    res.status(500).json({ message: 'An error occurred during signup. Please try again.' });
  }
});

// Teacher Login Route (No changes needed here)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const teacherResult = await db.query(
      `SELECT t.*, d.department_name 
       FROM teachers t
       LEFT JOIN departments d ON t.department_id = d.department_id
       WHERE t.email = $1`,
      [email]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const teacher = teacherResult.rows[0];
    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    const { password: _, ...teacherData } = teacher;

    res.status(200).json({ 
      success: true, 
      message: 'Logged in successfully!',
      teacher: {
        ...teacherData,
        role: 'teacher'
      }
    });

  } catch (err) {
    console.error('Teacher Login Error:', err);
    res.status(500).json({ message: 'An internal error occurred.' });
  }
});

module.exports = router;