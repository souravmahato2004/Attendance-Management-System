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

  // Get dashboard stats (NOW FETCHES FROM BACKEND)
  getDashboardStats: async () => {
    // 1. Get today's date in 'YYYY-MM-DD' format
    const getLocalDate = () => {
      const todayDate = new Date();
      const year = todayDate.getFullYear();
      const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
      const day = todayDate.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const today = getLocalDate();

    // 2. Call the new backend route
    const apiUrl = `${API_URL}/dashboard-stats?today=${today}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header if required
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard stats.');
      }
      return data; // Returns { totalTeachers, totalStudents, ... }
      
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      throw error;
    }
  },

  // Get all unique semesters
  getSemesters: async () => {
    const apiUrl = `${API_URL}/semesters`;
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch semesters');
      }
      return data; // Returns [1, 2, 3...]
    } catch (error) {
      throw error;
    }
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

  // Update teacher (and their subjects)
  updateTeacher: async (id, teacherData) => {
    // 1. Define the API endpoint
    const apiUrl = `${API_URL}/teacher/${id}`; // Calls PUT /api/admin/teacher/:id
    
    // 2. Destructure the data from the form
    const { 
      subjectIds,   // This is the array [1, 2, 3]
      departmentId, // This is '5'
      teacherId,    // We don't need to send this in the body
      password,     // We don't send a password on update
      ...coreData   // This is { name, email }
    } = teacherData;

    // 3. Build the payload in the format the backend expects (snake_case)
    const payload = {
      ...coreData,                   // { name, email }
      department_id: departmentId,   // Rename to 'department_id'
      subject_ids: subjectIds        // Rename to 'subject_ids'
    };

    try {
      // 4. Make the fetch request
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header if required
        },
        body: JSON.stringify(payload), // Send the new formatted payload
      });

      const data = await response.json();

      // 5. Handle response
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update teacher.');
      }

      // 6. Return success
      return {
        success: true,
        teacher: data.teacher, // Backend returns the updated teacher object
        message: data.message,
      };
    } catch (error) {
      throw error;
    }
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    const apiUrl = `${API_URL}/teacher/${id}`; // Calls DELETE /api/admin/teacher/:id
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

  // GETS ALL PROGRAMS
  getPrograms: async () => {
    const apiUrl = `${API_URL}/programs`; // Assumes new backend route
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch programs.');
      }
      return data; // Returns [{id, name}, ...]
    } catch (error) {
      throw error;
    }
  },


  // NEW: GET SUBJECTS FOR A SPECIFIC COURSE
  getSubjectsByCourse: async (program_id, department_id, semester) => {
    const params = new URLSearchParams({
      program: program_id,
      dept: department_id,
      sem: semester
    });
    const apiUrl = `${API_URL}/subjects-by-course?${params.toString()}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subjects for this course.');
      }
      return data; // Returns [{subject_id, subject_name}, ...]
    } catch (error) {
      throw error;
    }
  },

  // NEW: ADD A SUBJECT TO A COURSE
  addSubjectToCourse: async (subjectData) => {
    // subjectData = { subject_name, program_id, department_id, semester }
    const apiUrl = `${API_URL}/subjects-to-course`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add subject.');
      }
      return data; // Returns new subject { subject_id, subject_name }
    } catch (error) {
      throw error;
    }
  },

  // NEW: REMOVE A SUBJECT BY ITS ID
  removeSubject: async (subject_id) => {
    const apiUrl = `${API_URL}/subjects/${subject_id}`;
    try {
      const response = await fetch(apiUrl, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove subject.');
      }
      return data; // Returns { success: true, ... }
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

  // --- UPDATED FUNCTION ---
  // Fetches data from backend, then builds and downloads the PDF
  generateMonthlyReport: async (month, year, program_id, department_id, semester) => {
    
    // 1. Fetch the data from the new backend route
    const params = new URLSearchParams({
      month,
      year,
      program_id,
      department_id,
      semester
    });
    const apiUrl = `${API_URL}/report-data?${params.toString()}`;

    let reportData;
    try {
      const response = await fetch(apiUrl);
      reportData = await response.json();
      if (!response.ok) {
        throw new Error(reportData.message);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      throw error; // Let the component handle this
    }

    // 2. Data fetched, now build the PDF
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month];
    
    // 3. Use the fetched data
    const pdfData = {
      title: `Monthly Attendance Report - ${monthName} ${year}`,
      generatedDate: formatDate(new Date(), 'readable'),
      studentInfo: reportData.studentInfo,
      summary: reportData.summary,
      tableData: reportData.tableData // This now matches the PDF helper
    };
    
    // Find names for the filename
    const programName = reportData.studentInfo['Program'] || 'Prog';
    const deptName = reportData.studentInfo['Department'] || 'Dept';
    
    const filename = `monthly_report_${programName}_${deptName}_${semester}_${monthName}_${year}.pdf`;
    
    // 4. Call the helper from utils/helpers.js
    downloadPDF(pdfData, filename);
    
    return {
      success: true,
      message: 'Report generated successfully'
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