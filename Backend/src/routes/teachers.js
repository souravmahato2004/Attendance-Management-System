const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// --- Helper Function ---
// Fetches all assigned subjects for a given teacher ID
// This query joins 5 tables to get full subject details
const getTeacherSubjects = async (teacherId) => {
  const query = `
    SELECT
        s.subject_id,
        s.subject_name,
        c.course_id,
        c.semester,
        p.program_name,
        d.department_name
    FROM
        teacher_subjects ts
    JOIN
        subjects s ON ts.subject_id = s.subject_id
    JOIN
        courses c ON s.course_id = c.course_id
    JOIN
        programs p ON c.program_id = p.program_id
    JOIN
        departments d ON c.department_id = d.department_id
    WHERE
        ts.teacher_id = $1
    ORDER BY
        s.subject_name;
  `;
  const { rows } = await db.query(query, [teacherId]);
  return rows;
};

// --- Teacher Login Route ---
// This route logs in the teacher AND attaches their subject list
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Find the teacher by email
    const teacherResult = await db.query('SELECT * FROM teachers WHERE email = $1', [email]);

    if (teacherResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const teacher = teacherResult.rows[0];

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Fetch the teacher's assigned subjects
    const subjects = await getTeacherSubjects(teacher.teacher_id);

    // 4. Login successful! Exclude password
    const { password: _, ...teacherData } = teacher;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        ...teacherData,
        subjects: subjects, // <-- Attach the subjects here
        role: 'teacher'     // Add role for frontend
      }
    });

  } catch (err) {
    console.error('Teacher Login Error:', err);
    res.status(500).json({ message: 'An internal error occurred.' });
  }
});

// --- NEW ROUTE ---
// GET all subjects for a specific teacher
router.get('/:id/subjects', async (req, res) => {
  const { id } = req.params; // This is the teacher_id

  try {
    // 1. Use the helper function to get subjects
    const subjects = await getTeacherSubjects(id);

    if (!subjects) {
      // This isn't an error, the teacher just has no subjects
      return res.status(200).json([]);
    }

    // 2. Return the list of subjects
    res.status(200).json(subjects);

  } catch (err) {
    console.error('Error fetching teacher subjects:', err);
    res.status(500).json({ message: 'Failed to fetch subjects.' });
  }
});

// --- UPDATED ROUTE ---
// GET Dashboard Stats for a Teacher
router.get('/dashboard-stats', async (req, res) => {
  const { teacherId, today } = req.query;

  if (!teacherId || !today) {
    return res.status(400).json({ message: 'Teacher ID and today\'s date are required.' });
  }

  const client = await db.connect();
  try {
    // 1. Get all subject IDs for this teacher
    const subjectResult = await client.query(
      'SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1',
      [teacherId]
    );
    const subjectIds = subjectResult.rows.map(row => row.subject_id);

    if (subjectIds.length === 0) {
      // If teacher has no subjects, return all zeros
      return res.status(200).json({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        recentAttendance: []
      });
    }

    // 2. Find all unique courses (program/dept/sem) this teacher teaches
    const courseResult = await client.query(
      `SELECT DISTINCT c.program_id, c.department_id, c.semester
       FROM subjects s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.subject_id = ANY($1::int[])`,
      [subjectIds]
    );
    const courses = courseResult.rows;

    // 3. Find all unique students in those courses
    let totalStudents = 0;
    
    // --- THIS IS THE FIX ---
    // Only run this query if the teacher is actually assigned to courses.
    if (courses.length > 0) {
      const courseConditions = courses.map(
        (c, i) => `(s.program_id = $${i*3 + 1} AND s.department_id = $${i*3 + 2} AND s.semester = $${i*3 + 3})`
      ).join(' OR ');
      
      const courseValues = courses.flatMap(c => [c.program_id, c.department_id, c.semester]);
      
      const studentResult = await client.query(
        `SELECT COUNT(DISTINCT s.student_id) as total
         FROM students s
         WHERE ${courseConditions}`, // This is now safe
        courseValues
      );
      totalStudents = parseInt(studentResult.rows[0].total, 10);
    }
    // --- END OF FIX ---

    // 4. Get today's attendance stats
    const todayStatsResult = await client.query(
      `SELECT status, COUNT(record_id) as count
       FROM attendance_records
       WHERE teacher_id = $1
         AND subject_id = ANY($2::int[])
         AND attendance_date = $3::date
       GROUP BY status`,
      [teacherId, subjectIds, today]
    );

    let stats = {
      totalStudents: totalStudents,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0
    };

    todayStatsResult.rows.forEach(row => {
      if (row.status === 'present') stats.presentToday = parseInt(row.count, 10);
      if (row.status === 'absent') stats.absentToday = parseInt(row.count, 10);
      if (row.status === 'late') stats.lateToday = parseInt(row.count, 10);
    });

    // 5. Get recent attendance trends (last 5 days)
    const recentResult = await client.query(
      `SELECT 
         TO_CHAR(attendance_date, 'YYYY-MM-DD') as date, -- <-- 1. FIX HERE
         COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
         COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
         COUNT(CASE WHEN status = 'late' THEN 1 END) as late
       FROM attendance_records
       WHERE teacher_id = $1
         AND subject_id = ANY($2::int[])
         AND attendance_date > $3::date - INTERVAL '5 days'
         AND attendance_date <= $3::date
       GROUP BY attendance_date
       ORDER BY attendance_date DESC`,
      [teacherId, subjectIds, today]
    );

    // Format the recent attendance data
    const recentAttendance = recentResult.rows.map(row => ({
      date: row.date, // <-- 2. FIX HERE
      present: parseInt(row.present, 10),
      absent: parseInt(row.absent, 10),
      late: parseInt(row.late, 10)
    }));

    res.status(200).json({ ...stats, recentAttendance });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  } finally {
    client.release();
  }
});

// --- UPDATED ROUTE ---
// GET students for a specific subject (now includes program, dept, and sem)
router.get('/students-by-subject', async (req, res) => {
  const { subjectId } = req.query;

  if (!subjectId) {
    return res.status(400).json({ message: 'Subject ID is required.' });
  }

  try {
    // 1. Find the course (program/dept/sem) for the subject
    const courseResult = await db.query(
      `SELECT c.program_id, c.department_id, c.semester 
       FROM subjects s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.subject_id = $1`,
      [subjectId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found for this subject.' });
    }
    const { program_id, department_id, semester } = courseResult.rows[0];

    // 2. Find all students in that program/dept/sem and join for names
    // --- QUERY UPDATED HERE ---
    const studentsResult = await db.query(
      `SELECT 
         s.student_id, 
         s.roll_number, 
         s.name, 
         s.email, 
         s.semester,
         p.program_name,
         d.department_name
       FROM students s
       JOIN programs p ON s.program_id = p.program_id
       JOIN departments d ON s.department_id = d.department_id
       WHERE 
         s.program_id = $1 AND 
         s.department_id = $2 AND 
         s.semester = $3
       ORDER BY 
         s.roll_number`,
      [program_id, department_id, semester]
    );

    res.status(200).json(studentsResult.rows);

  } catch (err) {
    console.error('Error fetching students by subject:', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
});

// --- NEW ROUTE ---
// GET attendance for a subject on a specific date
router.get('/attendance', async (req, res) => {
  const { subjectId, date } = req.query;

  if (!subjectId || !date) {
    return res.status(400).json({ message: 'Subject ID and date are required.' });
  }

  try {
    const attendanceResult = await db.query(
      `SELECT student_id, status 
       FROM attendance_records 
       WHERE subject_id = $1 AND attendance_date = $2`,
      [subjectId, date]
    );

    if (attendanceResult.rows.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for this date.' });
    }

    res.status(200).json(attendanceResult.rows); // Returns [{ student_id, status }, ...]

  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
});


// --- NEW ROUTE ---
// POST (save/update) attendance for a subject on a date
router.post('/attendance', async (req, res) => {
  const { subjectId, date, teacherId, attendance } = req.body;
  // attendance is an array: [{ student_id, status }, ...]

  if (!subjectId || !date || !teacherId || !Array.isArray(attendance) || attendance.length === 0) {
    return res.status(400).json({ message: 'Missing required data.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Use a loop to perform an "UPSERT" for each student
    // This will UPDATE the record if it exists, or INSERT it if it's new.
    for (const record of attendance) {
      const { student_id, status } = record;
      
      const query = `
        INSERT INTO attendance_records (student_id, subject_id, teacher_id, attendance_date, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (student_id, subject_id, attendance_date)
        DO UPDATE SET status = EXCLUDED.status, teacher_id = EXCLUDED.teacher_id;
      `;
      
      await client.query(query, [student_id, subjectId, teacherId, date, status]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Attendance saved successfully.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving attendance:', err);
    res.status(500).json({ message: 'Failed to save attendance.' });
  } finally {
    client.release();
  }
});

// --- NEW ROUTE ---
// GET Attendance Report for a Subject within a date range
router.get('/attendance-report', async (req, res) => {
  const { subjectId, startDate, endDate } = req.query;

  if (!subjectId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Subject ID, start date, and end date are required.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Find the course (program/dept/sem) for the subject
    const courseResult = await client.query(
      `SELECT c.program_id, c.department_id, c.semester 
       FROM subjects s
       JOIN courses c ON s.course_id = c.course_id
       WHERE s.subject_id = $1`,
      [subjectId]
    );

    if (courseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Course not found for this subject.' });
    }
    const { program_id, department_id, semester } = courseResult.rows[0];

    // 2. Get all students for that course and LEFT JOIN their attendance data
    //    This query finds all students and then calculates their attendance stats.
    const reportQuery = `
      SELECT
        s.student_id,
        s.roll_number,
        s.name,
        -- Count total records within the date range
        COUNT(ar.record_id) AS total_classes,
        -- Count only 'present' records
        COUNT(ar.record_id) FILTER (WHERE ar.status = 'present') AS total_present,
        -- Count only 'absent' records
        COUNT(ar.record_id) FILTER (WHERE ar.status = 'absent') AS total_absent,
        -- Count only 'late' records
        COUNT(ar.record_id) FILTER (WHERE ar.status = 'late') AS total_late
      FROM 
        students s
      LEFT JOIN 
        attendance_records ar 
        ON s.student_id = ar.student_id
        AND ar.subject_id = $1                -- Only for the selected subject
        AND ar.attendance_date BETWEEN $2 AND $3 -- Only in the date range
      WHERE
        s.program_id = $4
        AND s.department_id = $5
        AND s.semester = $6
      GROUP BY
        s.student_id, s.roll_number, s.name
      ORDER BY
        s.roll_number;
    `;
    
    const reportResult = await client.query(reportQuery, [
      subjectId, startDate, endDate, program_id, department_id, semester
    ]);

    await client.query('COMMIT');
    res.status(200).json(reportResult.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error fetching attendance report:', err);
    res.status(500).json({ message: 'Failed to fetch attendance report.' });
  } finally {
    client.release();
  }
});

module.exports = router;