const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// Admin Signup Route
router.post('/signup', async (req, res) => {
  const { adminId, name, email, password } = req.body;

  if (!adminId || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields (Admin ID, Name, Email, Password) are required.' });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdminResult = await db.query(
      `INSERT INTO admins (admin_id, name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING admin_id`,
      [adminId, name, email, hashedPassword]
    );

    console.log('New admin created with ID:', newAdminResult.rows[0].admin_id);
    res.status(201).json({ success: true, message: 'Admin account created successfully!' });

  } catch (err) {
    // Check for unique constraint violation (duplicate email or adminId)
    if (err.code === '23505') {
        if (err.constraint === 'admins_pkey') {
             return res.status(409).json({ message: 'Admin ID already exists.' });
        }
         if (err.constraint === 'admins_email_key') {
            return res.status(409).json({ message: 'Email already exists.' });
        }
      return res.status(409).json({ message: 'A unique field already exists.'})
    }
    console.error('Admin Signup Error:', err);
    res.status(500).json({ message: 'An error occurred during signup. Please try again.' });
  }
});

// Admin Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Find the admin by email
    const adminResult = await db.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (adminResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const admin = adminResult.rows[0];

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // 3. Login successful! Exclude password from the response
    const { password: _, ...adminData } = admin;

    res.status(200).json({ 
      success: true, 
      message: 'Logged in successfully!',
      admin: {
        ...adminData,
        role: 'admin' // Add a role for frontend logic
      }
    });

  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ message: 'An internal error occurred.' });
  }
});

// Assign Subject to Teacher Route (Insert)
// This is an admin-only action.
router.post('/assignSubjects', async (req, res) => {
  const { teacher_id, subject_id, course_id } = req.body;

  // 1. Validate that all necessary IDs are provided
  if (!teacher_id || !subject_id || !course_id) {
    return res.status(400).json({ message: 'Teacher ID, Subject ID, and Course ID are all required.' });
  }

  try {
    // 2. Insert the new assignment into the database
    const newAssignmentResult = await db.query(
      `INSERT INTO teacher_subjects (teacher_id, subject_id, course_id)
       VALUES ($1, $2, $3)
       RETURNING assignment_id`,
      [teacher_id, subject_id, course_id]
    );

    // 3. Send a success response
    res.status(201).json({
      success: true,
      message: 'Subject assigned to teacher successfully!',
      assignment_id: newAssignmentResult.rows[0].assignment_id,
    });
  } catch (err) {
    // 4. Handle potential database errors
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ message: 'This teacher is already assigned to this subject for this course.' });
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(404).json({ message: 'The provided Teacher, Subject, or Course ID does not exist.' });
    }
    console.error('Assign Subject Error:', err);
    res.status(500).json({ message: 'An error occurred while assigning the subject.' });
  }
});


// Unassign Subject Route (Delete)
// This is an admin-only action.
router.delete('/unassignSubject/:assignmentId', async (req, res) => {
    const { assignmentId } = req.params;

    try {
        // 1. Attempt to delete the assignment by its unique ID
        const deleteResult = await db.query(
            'DELETE FROM teacher_subjects WHERE assignment_id = $1',
            [assignmentId]
        );

        // 2. Check if an assignment was actually deleted
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        // 3. Send a success response
        res.status(200).json({ success: true, message: 'Subject unassigned successfully.' });
    } catch (err) {
        console.error('Delete Assignment Error:', err);
        res.status(500).json({ message: 'An error occurred while unassigning the subject.' });
    }
});

// GET all departments
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT department_id, department_name FROM departments ORDER BY department_id');
    const departments = result.rows.map(row => ({
      id: row.department_id,
      name: row.department_name
    }));
    res.status(200).json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const result = await db.query('SELECT subject_id, subject_name FROM subjects ORDER BY course_id');
    const subjects = result.rows.map(row => ({
      id: row.subject_id,
      name: row.subject_name
    }));
    res.status(200).json(subjects);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});


module.exports = router;