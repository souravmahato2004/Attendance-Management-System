const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

router.get('/programs', async (req, res) => {
  try {
    const result = await db.query('SELECT program_name FROM programs ORDER BY program_id');
    const programNames = result.rows.map(row => row.program_name);
    res.status(200).json(programNames);
  } catch (err) {
    console.error('Error fetching programs:', err);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
});

// GET all departments
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT department_name FROM departments ORDER BY department_id');
    const departmentNames = result.rows.map(row => row.department_name);
    res.status(200).json(departmentNames);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// GET all unique semesters
router.get('/semesters', async (req, res) => {
    try {
      const result = await db.query('SELECT DISTINCT semester FROM courses ORDER BY semester');
      // Format the numbers into the string format your frontend expects
      const semesterNames = result.rows.map(row => `Semester ${row.semester}`);
      res.status(200).json(semesterNames);
    } catch (err) {
      console.error('Error fetching semesters:', err);
      res.status(500).json({ message: 'Failed to fetch semesters' });
    }
  });

// Student Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Find the student by email
    const studentResult = await db.query(
      `SELECT s.*, p.program_name, d.department_name 
       FROM students s
       LEFT JOIN programs p ON s.program_id = p.program_id
       LEFT JOIN departments d ON s.department_id = d.department_id
       WHERE s.email = $1`,
      [email]
    );

    if (studentResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const student = studentResult.rows[0];

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // 3. Login successful!
    // We'll add JWT logic here in the next step.
    // For now, let's just send back the student info (without the password).
    const { password: _, ...studentData } = student; // Exclude password from response

    res.status(200).json({ 
      success: true, 
      message: 'Logged in successfully!',
      student: {
        ...studentData,
        role: 'student'
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'An internal error occurred.' });
  }
});

// Student Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, rollNumber, program, department, semester } = req.body;

  if (!name || !email || !password || !rollNumber || !program || !department || !semester) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Convert "Semester 1" to integer 1 for database
  const semesterNumber = parseInt(semester.split(' ')[1]);
  if (isNaN(semesterNumber)) {
    return res.status(400).json({ message: 'Invalid semester format.' });
  }

  try {
    const programResult = await db.query('SELECT program_id FROM programs WHERE program_name = $1', [program]);
    const departmentResult = await db.query('SELECT department_id FROM departments WHERE department_name = $1', [department]);

    if (programResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid program selected.' });
    }
    if (departmentResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid department selected.' });
    }

    const programId = programResult.rows[0].program_id;
    const departmentId = departmentResult.rows[0].department_id;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newStudentResult = await db.query(
      `INSERT INTO students (name, email, password, roll_number, program_id, department_id, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING student_id`,
      [name, email, hashedPassword, rollNumber, programId, departmentId, semesterNumber]
    );

    console.log('New student created with ID:', newStudentResult.rows[0].student_id);
    res.status(201).json({ success: true, message: 'Account created successfully!' });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email or roll number already exists.' });
    }
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'An error occurred during signup. Please try again.' });
  }
});

// GET subjects for a specific program, department, and semester
router.get('/subjects', async (req, res) => {
  const { program, department, semester } = req.query;

  if (!program || !department || !semester) {
    return res.status(400).json({ message: 'Parameters "program", "department", and "semester" are required.' });
  }

  const semesterNumber = parseInt(semester);
  if (isNaN(semesterNumber)) {
    return res.status(400).json({ message: 'The "semester" parameter must be a number.' });
  }

  try {
    const query = `
      SELECT s.subject_name
      FROM public.subjects s
      JOIN public.courses c ON s.course_id = c.course_id
      JOIN public.programs p ON c.program_id = p.program_id
      JOIN public.departments d ON c.department_id = d.department_id
      WHERE p.program_name = $1
        AND d.department_name = $2
        AND c.semester = $3;
    `;
    const subjectsResult = await db.query(query, [program, department, semesterNumber]);

    const subjectNames = subjectsResult.rows.map(row => row.subject_name);
    res.status(200).json(subjectNames);

  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: 'An error occurred while fetching subjects.' });
  }
});

module.exports = router;