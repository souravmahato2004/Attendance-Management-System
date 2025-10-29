import { generatePassword, downloadPDF, formatDate } from '../utils/helpers';
const API_URL = 'http://localhost:3001/api/admin';
// This service will be updated to use context data when called from components
export const adminService = {

  login: async (credentials) => {
    const apiUrl = `${API_URL}/login`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('Login Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      return {
        success: true,
        user: data.admin
      };

    } catch (error) {
      throw error;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalTeachers: 15,
      totalStudents: 450,
      presentToday: 380,
      attendanceRate: 84.4,
      recentActivity: [
        { id: 1, action: 'New teacher added', time: '2 hours ago' },
        { id: 2, action: 'Attendance updated', time: '4 hours ago' },
      ]
    };
  },

  // Get all teachers
  getTeachers: async () => {
    // 1. Define the API endpoint
    const apiUrl = `${API_URL}/getTeachers`; // Calls GET /api/admin/teachers

    try {
      // 2. Make the fetch request
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header if required
        },
      });

      const data = await response.json();

      // 3. Check if the request was successful
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch teachers.');
      }

      // 4. Return the array of teachers
      //    The backend sends an array like:
      //    [{ teacher_id, name, email, department_id, department_name }, ...]
      return data;

    } catch (error) {
      throw error;
    }
  },

  // Add teacher with subject assignment
  addTeacherWithSubject: async (teacherData) => {
    const { subjectIds, ...coreTeacherData } = teacherData;
    let newTeacherId;
    let createdTeacher;

    try {
      const addTeacherUrl = `${API_URL}/add-teacher`;
      const addTeacherResponse = await fetch(addTeacherUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header if required
        },
        body: JSON.stringify(coreTeacherData),
      });

      const addTeacherData = await addTeacherResponse.json();
      if (!addTeacherResponse.ok) {
        throw new Error(addTeacherData.message || 'Failed to add teacher.');
      }

      // Get the new teacher's ID from the successful response
      newTeacherId = addTeacherData.teacher_id;
      // Store the created teacher data (minus password) for the return
      const { password, ...newTeacher } = coreTeacherData;
      createdTeacher = {
        ...newTeacher,
        teacher_id: newTeacherId
      };

      // --- STEP 2: If subjects were provided, assign them ONE BY ONE ---
      // We check if the subjects array exists and has items
      if (subjectIds && subjectIds.length > 0) {
        
        // This is your new backend route
        const assignSubjectsUrl = `${API_URL}/assignSubjects`;
        
        // Create an array of fetch promises, one for each subject
        const assignmentPromises = subjectIds.map(subjectId => {
          return fetch(assignSubjectsUrl, {
            method: 'POST', // Use POST as defined in your backend
            headers: {
              'Content-Type': 'application/json',
              // TODO: Add Authorization header if required
            },
            // Your backend expects: { "teacher_id": "...", "subject_id": "..." }
            body: JSON.stringify({ 
              teacher_id: newTeacherId, // The ID from Step 1
              subject_id: subjectId     // The current subject from the array
            }),
          }).then(async (response) => {
            // We need to check if the individual request failed
            if (!response.ok) {
              const errorData = await response.json();
              // Throw an error to make Promise.all reject
              throw new Error(errorData.message || 'Failed to assign a subject.');
            }
            return response.json();
          });
        });

        // Wait for all assignment promises to resolve
        // If ANY of them fail, this will throw an error
        // and be caught by the outer try...catch block.
        await Promise.all(assignmentPromises);
      }

      // --- SUCCESS: Both steps completed ---
      return {
        success: true,
        message: 'Teacher created and subjects assigned successfully!',
        teacher: createdTeacher, // Return the newly created teacher data
      };

    } catch (error) {
      // Check if the error happened AFTER teacher creation
      if (newTeacherId) {
        // Step 1 succeeded, but Step 2 (subject assignment) failed
        // This means the teacher exists, but assignments are incomplete.
        throw new Error(
          `Teacher was created (ID: ${newTeacherId}), but subject assignment failed: ${error.message}`
        );
      } else {
        // Step 1 (teacher creation) failed
        // Re-throw the original error
        throw error;
      }
    }
  },
  // Update teacher
  updateTeacher: async (id, teacherData) => {
    // NOTE: This assumes your backend route is /api/admin/teacher/:id
    const apiUrl = `${API_URL}/teacher/${id}`; 
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT', // Or 'PATCH'
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header if required
        },
        body: JSON.stringify(teacherData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update teacher.');
      }

      return {
        success: true,
        teacher: data.teacher, // Assuming backend returns the updated teacher object
        message: data.message,
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    // NOTE: This assumes your backend route is /api/admin/teacher/:id
    const apiUrl = `${API_URL}/teacher/${id}`; 
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          // TODO: Add Authorization header if required
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete teacher.');
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      throw error;
    }
  },

  // Get students by program
  getStudentsByProgram: async (programName) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      { id: 1, name: 'Alice Johnson', rollNumber: '2023001', program: programName },
      { id: 2, name: 'Bob Smith', rollNumber: '2023002', program: programName },
      { id: 3, name: 'Carol Davis', rollNumber: '2023003', program: programName },
    ];
  },

  // Update teacher subjects
  updateTeacherSubjects: async (teacherId, subjects) => {
    
    return {
      success: true,
      message: 'Teacher subjects updated successfully',
      subjects: subjects
    };
  },

  // Get all subjects for a program, department and semester
  getSubjectsForProgram: async (program, semester, department, programDeptSemSubjects) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if department-specific subjects exist, otherwise fall back to program-semester
    const deptSubjects = programDeptSemSubjects?.[program]?.[department]?.[semester];
    
    return deptSubjects || [];
  },

  // Add subject to program-department-semester
  addSubjectToProgram: async (program, semester, subject, department) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In real implementation, this would update the database
    return {
      success: true,
      message: 'Subject added successfully',
      subjects: [subject] // This will be updated by the context
    };
  },

  // Remove subject from program-department-semester
  removeSubjectFromProgram: async (program, semester, subject, department) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In real implementation, this would update the database
    return {
      success: true,
      message: 'Subject removed successfully',
      subjects: [] // This will be updated by the context
    };
  },

  // Generate monthly attendance report PDF
  generateMonthlyReport: async (month, year, program, department, semester) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[month];
    
    // Mock attendance data
    const mockAttendanceData = [
      { date: '2024-09-01', present: 45, absent: 5, late: 2, subject: 'Data Structures' },
      { date: '2024-09-02', present: 48, absent: 2, late: 1, subject: 'Algorithms' },
      { date: '2024-09-03', present: 46, absent: 4, late: 0, subject: 'Mathematics' },
      { date: '2024-09-04', present: 47, absent: 3, late: 1, subject: 'Data Structures' },
      { date: '2024-09-05', present: 49, absent: 1, late: 0, subject: 'Algorithms' },
    ];
    
    const totalDays = mockAttendanceData.length;
    const totalPresent = mockAttendanceData.reduce((sum, day) => sum + day.present, 0);
    const totalAbsent = mockAttendanceData.reduce((sum, day) => sum + day.absent, 0);
    const totalLate = mockAttendanceData.reduce((sum, day) => sum + day.late, 0);
    const averageAttendance = totalDays > 0 ? ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1) : 0;
    
    // Prepare PDF data
    const pdfData = {
      title: `Monthly Attendance Report - ${monthName} ${year}`,
      generatedDate: formatDate(new Date(), 'readable'),
      studentInfo: {
        'Program': program,
        'Department': department,
        'Semester': semester,
        'Report Period': `${monthName} ${year}`,
        'Generated By': 'Administrator'
      },
      summary: {
        'Total Academic Days': totalDays,
        'Total Present': totalPresent,
        'Total Absent': totalAbsent,
        'Total Late': totalLate,
        'Average Attendance': `${averageAttendance}%`
      },
      tableData: mockAttendanceData.map(record => ({
        date: record.date,
        day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }),
        status: `${record.present} Present, ${record.absent} Absent, ${record.late} Late`,
        subject: record.subject
      }))
    };
    
    const filename = `monthly_attendance_report_${program}_${department}_${semester}_${monthName}_${year}.pdf`;
    downloadPDF(pdfData, filename);
    
    return {
      success: true,
      message: 'Monthly report generated successfully'
    };
  },

  // Get all programs and semesters
  getProgramsAndSemesters: async (programs, semesters) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      programs: programs,
      semesters: semesters
    };
  },

  getDepartments: async () => {
    const apiUrl = 'http://localhost:3001/api/admin/departments';
    try {
      const response = await fetch(apiUrl, {
        method: 'GET'
      });

      const departments = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      return departments;
    } catch (error) {
      throw error;
    }    
  },

  // Get all subjects
  getAllSubjects: async () => {
    const apiUrl = 'http://localhost:3001/api/admin/subjects';
    try {
      const response = await fetch(apiUrl, {
        method: 'GET'
      });

      const subjects = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      return subjects;
    } catch (error) {
      throw error;
    }    
  }
};