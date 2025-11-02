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
      user: {
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

// --- UPDATED ROUTE ---
// GET subjects for a specific program, department, and semester
// Now returns an array of objects (with IDs), not just strings.
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
      SELECT s.subject_id, s.subject_name
      FROM public.subjects s
      JOIN public.courses c ON s.course_id = c.course_id
      JOIN public.programs p ON c.program_id = p.program_id
      JOIN public.departments d ON c.department_id = d.department_id
      WHERE p.program_name = $1
        AND d.department_name = $2
        AND c.semester = $3
      ORDER BY s.subject_name;
    `;
    const subjectsResult = await db.query(query, [program, department, semesterNumber]);

    // Send the full array of objects
    res.status(200).json(subjectsResult.rows);

  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: 'An error occurred while fetching subjects.' });
  }
});

// --- NEW ROUTE ---
// GET dashboard stats for a student for a specific subject
router.get('/dashboard-stats', async (req, res) => {
  const { studentId, subjectId } = req.query;

  if (!studentId || !subjectId) {
    return res.status(400).json({ message: 'studentId and subjectId are required.' });
  }

  try {
    const statsQuery = `
      SELECT
        COUNT(record_id) AS total_classes,
        COUNT(record_id) FILTER (WHERE status = 'present') AS present_days,
        COUNT(record_id) FILTER (WHERE status = 'absent') AS absent_days,
        COUNT(record_id) FILTER (WHERE status = 'late') AS late_days
      FROM
        attendance_records
      WHERE
        student_id = $1 AND subject_id = $2
    `;
    
    const statsResult = await db.query(statsQuery, [studentId, subjectId]);
    
    // Use a default stats object in case no records are found
    const stats = statsResult.rows[0] || { total_classes: 0, present_days: 0, absent_days: 0, late_days: 0 };
    
    const totalDays = parseInt(stats.total_classes, 10);
    const presentDays = parseInt(stats.present_days, 10);
    const absentDays = parseInt(stats.absent_days, 10);
    const lateDays = parseInt(stats.late_days, 10);
    
    const attendedDays = presentDays + lateDays;
    const attendancePercentage = (totalDays > 0) ? Math.round((attendedDays / totalDays) * 100) : 0;

    res.status(200).json({
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendancePercentage,
      // Mocking these for now as they require complex queries
      currentStreak: 5,
      monthlyStats: {
        September: { present: 18, absent: 3, late: 1 },
        August: { present: 20, absent: 2, late: 0 }
      }
    });

  } catch (err) {
    console.error('Error fetching student dashboard stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
});

// --- NEW ROUTE ---
// GET Monthly Attendance for a Student
router.get('/monthly-attendance', async (req, res) => {
  const { studentId, subjectId, year, month } = req.query;

  if (!studentId || !subjectId || !year || !month) {
    return res.status(400).json({ message: 'studentId, subjectId, year, and month are required.' });
  }

  // month is 0-indexed (0=Jan, 11=Dec), but Postgres is 1-indexed.
  const monthNumber = parseInt(month, 10) + 1;
  const yearNumber = parseInt(year, 10);

  try {
    const query = `
      SELECT
        attendance_date,
        status,
        -- Extract the day number from the date
        EXTRACT(DAY FROM attendance_date) as day_number,
        -- Get the 3-letter day name (e.g., 'Mon')
        TO_CHAR(attendance_date, 'Dy') as day_name
      FROM
        attendance_records
      WHERE
        student_id = $1
        AND subject_id = $2
        AND EXTRACT(YEAR FROM attendance_date) = $3
        AND EXTRACT(MONTH FROM attendance_date) = $4
      ORDER BY
        attendance_date;
    `;
    
    const { rows } = await db.query(query, [studentId, subjectId, yearNumber, monthNumber]);

    // Format the data for the frontend
    const formattedData = rows.map(row => ({
      date: new Date(row.attendance_date).toISOString().split('T')[0], // 'YYYY-MM-DD'
      day: row.day_name,
      dayNumber: parseInt(row.day_number, 10),
      status: row.status,
      subject: '' // Subject is already known, but keeping for compatibility
    }));

    res.status(200).json(formattedData);

  } catch (err) {
    console.error('Error fetching monthly attendance:', err);
    res.status(500).json({ message: 'Failed to fetch monthly attendance.' });
  }
});

module.exports = router;