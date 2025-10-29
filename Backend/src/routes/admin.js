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

// --- NEW ROUTE ---
// Add a new Teacher Route
// This is an admin-only action.
router.post('/add-teacher', async (req, res) => {
  const { teacherId, name, email, password, departmentId } = req.body;

  // 1. Validation
  if (!teacherId || !name || !email || !password || !departmentId) {
    return res.status(400).json({ message: 'All fields (Teacher ID, Name, Email, Password, Department ID) are required.' });
  }

  try {
    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insert into teachers table
    const newTeacherResult = await db.query(
      `INSERT INTO teachers (teacher_id, name, email, password, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING teacher_id`,
      [teacherId, name, email, hashedPassword, departmentId]
    );

    // 4. Success response
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully!',
      teacher_id: newTeacherResult.rows[0].teacher_id,
    });

  } catch (err) {
    // 5. Error handling
    if (err.code === '23505') { // unique_violation
      if (err.constraint === 'teachers_pkey') {
        return res.status(409).json({ message: 'Teacher ID already exists.' });
      }
      if (err.constraint === 'teachers_email_key') {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      return res.status(409).json({ message: 'A unique field already exists.'});
    }
    if (err.code === '23503') { // foreign_key_violation
      if (err.constraint === 'teachers_department_id_fkey') {
         return res.status(404).json({ message: 'The provided Department ID does not exist.' });
      }
      return res.status(404).json({ message: 'A foreign key constraint was violated.' });
    }
    console.error('Add Teacher Error:', err);
    res.status(500).json({ message: 'An error occurred while creating the teacher.' });
  }
});

// --- UPDATED ROUTE ---
// GET all teachers (now includes their assigned subjects)
router.get('/getTeachers', async (req, res) => {
  try {
    // 1. This query is now more advanced.
    // It joins 3 tables and uses json_agg to build a nested
    // JSON array of subjects for each teacher.
    const query = `
      SELECT
        t.teacher_id,
        t.name,
        t.email,
        t.department_id,
        d.department_name,
        -- Create a JSON array of subject objects
        -- COALESCE ensures we get an empty array '[]' instead of 'null'
        -- if a teacher has no subjects.
        COALESCE(
          json_agg(
            -- Define the structure of the objects in the array
            json_build_object(
              'assignment_id', ts.assignment_id,
              'subject_id', s.subject_id,
              'subject_name', s.subject_name
            )
          ) FILTER (WHERE s.subject_id IS NOT NULL), -- Only add if a subject exists
          '[]'::json
        ) AS subjects
      FROM
        teachers t
      LEFT JOIN
        departments d ON t.department_id = d.department_id
      LEFT JOIN
        teacher_subjects ts ON t.teacher_id = ts.teacher_id
      LEFT JOIN
        subjects s ON ts.subject_id = s.subject_id
      GROUP BY
        t.teacher_id, d.department_name -- Group by teacher to aggregate subjects
      ORDER BY
        d.department_name;
    `;
    
    const result = await db.query(query);

    // 2. Return the list of teachers, now with a 'subjects' array
    res.status(200).json(result.rows);

  } catch (err) {
    // 3. Handle any errors
    console.error('Error fetching teachers:', err);
    res.status(500).json({ message: 'Failed to fetch teachers.' });
  }
});

// --- UPDATED ROUTE ---
// Assign Subject to Teacher Route (Insert)
// This is an admin-only action.
// ** Updated to remove course_id **
router.post('/assignSubjects', async (req, res) => {
  const { teacher_id, subject_id } = req.body; // <-- MODIFIED

  // 1. Validate that all necessary IDs are provided
  if (!teacher_id || !subject_id) { // <-- MODIFIED
    return res.status(400).json({ message: 'Teacher ID and Subject ID are both required.' }); // <-- MODIFIED
  }

  try {
    // 2. Insert the new assignment into the database
    const newAssignmentResult = await db.query(
      `INSERT INTO teacher_subjects (teacher_id, subject_id)
       VALUES ($1, $2)
       RETURNING assignment_id`, // <-- MODIFIED
      [teacher_id, subject_id] // <-- MODIFIED
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
      return res.status(409).json({ message: 'This teacher is already assigned to this subject.' }); // <-- MODIFIED
    }
    if (err.code === '23503') { // foreign_key_violation
      return res.status(404).json({ message: 'The provided Teacher ID or Subject ID does not exist.' }); // <-- MODIFIED
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
router.get('/programs', async (req, res) => {
  try {
    const result = await db.query('SELECT program_id, program_name FROM programs ORDER BY program_id');
    const programs = result.rows.map(row => ({
      id: row.program_id,
      name: row.program_name
    }));
    res.status(200).json(programs);
  } catch (err) {
    console.error('Error fetching programs:', err);
    res.status(500).json({ message: 'Failed to fetch programs' });
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

// GET all subjects
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

// --- NEW ROUTE ---
// GET subjects for a specific course (by program, dept, sem)
// Corresponds to: getSubjectsByCourse
router.get('/subjects-by-course', async (req, res) => {
  const { program, dept, sem } = req.query;

  if (!program || !dept || !sem) {
    return res.status(400).json({ message: 'Program, department, and semester query parameters are required.' });
  }

  try {
    // 1. Find the course_id from the selection
    const courseResult = await db.query(
      'SELECT course_id FROM courses WHERE program_id = $1 AND department_id = $2 AND semester = $3',
      [program, dept, sem]
    );

    if (courseResult.rows.length === 0) {
      // No course found for this combination, return an empty array
      return res.status(200).json([]);
    }
    const courseId = courseResult.rows[0].course_id;

    // 2. Find all subjects for that course_id
    const subjectsResult = await db.query(
      'SELECT subject_id, subject_name FROM subjects WHERE course_id = $1 ORDER BY subject_name',
      [courseId]
    );

    res.status(200).json(subjectsResult.rows);

  } catch (err) {
    console.error('Error fetching subjects by course:', err);
    res.status(500).json({ message: 'Failed to fetch subjects.' });
  }
});

// --- NEW ROUTE ---
// ADD a new subject and assign it to a course
// Corresponds to: addSubjectToCourse
router.post('/subjects-to-course', async (req, res) => {
  const { subject_name, program_id, department_id, semester } = req.body;

  if (!subject_name || !program_id || !department_id || !semester) {
    return res.status(400).json({ message: 'Subject name, program_id, department_id, and semester are required.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Find the course_id
    const courseResult = await client.query(
      'SELECT course_id FROM courses WHERE program_id = $1 AND department_id = $2 AND semester = $3',
      [program_id, department_id, semester]
    );

    if (courseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'The selected course (program/dept/sem) was not found.' });
    }
    const courseId = courseResult.rows[0].course_id;

    // 2. Insert the new subject with the found course_id
    const newSubjectResult = await client.query(
      'INSERT INTO subjects (subject_name, course_id) VALUES ($1, $2) RETURNING subject_id, subject_name',
      [subject_name, courseId]
    );

    await client.query('COMMIT');
    
    // 3. Return the newly created subject object
    res.status(201).json(newSubjectResult.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    // Check for unique subject name violation (if you have one)
    if (err.code === '23505') {
        return res.status(409).json({ message: 'A subject with this name may already exist.' });
    }
    console.error('Error adding subject to course:', err);
    res.status(500).json({ message: 'Failed to add subject.' });
  } finally {
    client.release();
  }
});


// --- NEW ROUTE ---
// DELETE a subject by its ID
// Corresponds to: removeSubject
router.delete('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await db.query(
      'DELETE FROM subjects WHERE subject_id = $1',
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    
    res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (err) {
    console.error('Error deleting subject:', err);
    // This catches if you try to delete a subject that a teacher is assigned to
    if (err.code === '23503') { // foreign_key_violation
      return res.status(409).json({ message: 'Cannot delete subject. It is currently assigned to one or more teachers. Please unassign it first.' });
    }
    res.status(500).json({ message: 'Failed to delete subject.' });
  }
});

// --- UPDATED ROUTE ---
// Update Teacher Details AND Subjects (All-in-One)
// This now handles both basic info and subject assignments in one transaction.
router.put('/teacher/:id', async (req, res) => {
    const { id } = req.params;
    // Get the data from the body.
    // **IMPORTANT**: The frontend will send 'subject_ids'
    const { name, email, department_id, subject_ids } = req.body;

    // 1. Validation
    if (!name || !email || !department_id) {
        return res.status(400).json({ message: 'Name, email, and department_id are required.' });
    }
    // Ensure subject_ids is an array, even if it's empty
    if (!Array.isArray(subject_ids)) {
       return res.status(400).json({ message: 'Request body must contain a "subject_ids" array.' });
    }

    // 2. We need a transaction to update two tables safely
    const client = await db.connect();

    try {
        // 3. Start transaction
        await client.query('BEGIN');

        // 4. Update the teacher's basic details in 'teachers' table
        const updateResult = await client.query(
            `UPDATE teachers
             SET name = $1, email = $2, department_id = $3
             WHERE teacher_id = $4
             RETURNING *`, // Return the full updated teacher row
            [name, email, department_id, id]
        );

        // 4b. Check if the teacher was found
        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        // 5. Sync the subjects in 'teacher_subjects' table
        
        // 5a. Delete all *existing* assignments for this teacher
        await client.query(
            'DELETE FROM teacher_subjects WHERE teacher_id = $1',
            [id]
        );

        // 5b. Insert the new assignments from the provided array
        //     (Only if the array is not empty)
        if (subject_ids.length > 0) {
            // Build query: ($1, $2), ($1, $3), ($1, $4)
            const valuesPlaceholders = subject_ids.map((_, index) => {
                return `($1, $${index + 2})`; // $1 is always teacher_id
            }).join(', ');
            
            const insertQuery = `
                INSERT INTO teacher_subjects (teacher_id, subject_id)
                VALUES ${valuesPlaceholders}
            `;
            
            // Build values: ['B230036CS', 1, 5, 10]
            const insertValues = [id, ...subject_ids];
            
            // Run the insert
            await client.query(insertQuery, insertValues);
        }

        // 6. Commit the transaction
        await client.query('COMMIT');

        // 7. Send back the updated teacher data (minus password)
        const { password: _, ...updatedTeacher } = updateResult.rows[0];
        res.status(200).json({
            success: true,
            message: 'Teacher and assignments updated successfully.',
            teacher: updatedTeacher
        });

    } catch (err) {
        // 8. If any error occurs, roll back the entire transaction
        await client.query('ROLLBACK');
        
        // Handle specific errors
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'Email already exists for another user.' });
        }
        if (err.code === '23503') { // foreign_key_violation
            if (err.constraint === 'teachers_department_id_fkey') {
                return res.status(404).json({ message: 'The specified Department ID does not exist.' });
            }
            // This error will also catch bad subject_ids
            return res.status(404).json({ message: 'Error: A specified Department or Subject ID does not exist.' });
        }
        
        console.error('Update Teacher Error:', err);
        res.status(500).json({ message: 'An error occurred while updating the teacher.' });
    } finally {
        // 9. Always release the client back to the pool
        client.release();
    }
});

// Delete a Teacher (and all their assignments)
router.delete('/teacher/:id', async (req, res) => {
    const { id } = req.params;

    // We need a transaction to delete from two tables safely
    const client = await db.connect();

    try {
        // 1. Start the transaction
        await client.query('BEGIN');

        // 2. Delete all subject assignments for this teacher
        // This runs first to avoid any foreign key errors
        await client.query(
            'DELETE FROM teacher_subjects WHERE teacher_id = $1',
            [id]
        );

        // 3. Attempt to delete the teacher
        const deleteResult = await client.query(
            'DELETE FROM teachers WHERE teacher_id = $1',
            [id]
        );

        // 4. Check if a row was actually deleted (i.e., teacher existed)
        if (deleteResult.rowCount === 0) {
            // If no teacher was found, roll back
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        // 5. If everything is good, commit the transaction
        await client.query('COMMIT');

        // 6. Send success message
        res.status(200).json({ success: true, message: 'Teacher and all associated assignments deleted successfully.' });

    } catch (err) {
        // 7. If any error occurs, roll back
        await client.query('ROLLBACK');
        
        console.error('Delete Teacher Error:', err);
        res.status(500).json({ message: 'An error occurred while deleting the teacher.' });
    } finally {
        // 8. Always release the client back to the pool
        client.release();
    }
});


module.exports = router;