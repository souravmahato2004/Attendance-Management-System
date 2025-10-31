const APIURL='http://localhost:3001/api/teacher';

export const teacherService = {
  // Mock login
  login: async (credentials) => {
    const apiUrl = `${APIURL}/login`;
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
        user: data.user
      };

    } catch (error) {
      throw error;
    }
  },

  // Get all assigned subjects for a specific teacher
  getTeacherSubjects: async (teacherId) => {
    // This calls the backend route: GET /api/teacher/:id/subjects
    const apiUrl = `http://localhost:3001/api/teacher/${teacherId}/subjects`;
    
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
        throw new Error(data.message || 'Failed to fetch subjects.');
      }

      // Returns array: [{ subject_id, subject_name, semester, ... }, ...]
      return data; 
      
    } catch (error) {
      // If it fails, return an empty array so the UI doesn't crash
      console.error('Error fetching teacher subjects:', error);
      return []; 
    }
  },

  // Get dashboard stats for a specific teacher
  getDashboardStats: async (teacherId) => {
    // Return empty stats if there is no teacherId
    if (!teacherId) {
      return { totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0, recentAttendance: [] };
    }
    
    // --- 1. GET LOCAL DATE ---
    // This correctly gets today's date in your user's timezone (IST)
    const getLocalDate = () => {
      const todayDate = new Date();
      const year = todayDate.getFullYear();
      const month = (todayDate.getMonth() + 1).toString().padStart(2, '0'); // (0-11) + 1
      const day = todayDate.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`; // e.g., "2025-10-31"
    };
    
    const today = getLocalDate();
    // --- END ---

    // 2. Add 'today' to the API query
    const apiUrl = `http://localhost:3001/api/teacher/dashboard-stats?teacherId=${teacherId}&today=${today}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard stats.');
      }
      return data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return { totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0, recentAttendance: [] };
    }
  },

  // NEW: Get students for a specific subject
  getStudentsBySubject: async (subjectId) => {
    // This calls GET /api/teacher/students-by-subject?subjectId=...
    const apiUrl = `http://localhost:3001/api/teacher/students-by-subject?subjectId=${subjectId}`;
    try {
      const response = await fetch(apiUrl, { /* ...headers... */ });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data; // Expects [{ student_id, roll_number, name }]
    } catch (error) {
      console.error("Failed to get students:", error);
      throw error;
    }
  },

  // NEW: Get attendance for a specific class on a specific date
  getAttendance: async (subjectId, date) => {
    // This calls GET /api/teacher/attendance?subjectId=...&date=...
    const params = new URLSearchParams({ subjectId, date });
    const apiUrl = `http://localhost:3001/api/teacher/attendance?${params.toString()}`;
    try {
      const response = await fetch(apiUrl, { /* ...headers... */ });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data; // Expects [{ student_id, status }]
    } catch (error) {
      console.error("Failed to get attendance:", error);
      throw error;
    }
  },

  // NEW: Save attendance for a class
  saveAttendance: async (subjectId, date, attendanceData, teacherId) => {
    // This calls POST /api/teacher/attendance
    const apiUrl = `http://localhost:3001/api/teacher/attendance`;
    try {
      const payload = {
        subjectId,
        date,
        teacherId,
        attendance: attendanceData // [{ student_id, status }, ...]
      };
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', /* ...auth... */ },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      console.error("Failed to save attendance:", error);
      throw error;
    }
  },

  // Get attendance history
  // getAttendanceHistory: async (subject, startDate, endDate) => {
    
  //   const history = [];
  //   const start = new Date(startDate);
  //   const end = new Date(endDate);
    
  //   for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  //     if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
  //       history.push({
  //         date: d.toISOString().split('T')[0],
  //         present: Math.floor(Math.random() * 5) + 28,
  //         absent: Math.floor(Math.random() * 5) + 1,
  //         late: Math.floor(Math.random() * 3)
  //       });
  //     }
  //   }
    
  //   return history;
  // },

  // NEW: Get attendance report
  getAttendanceReport: async (subjectId, startDate, endDate) => {
    const params = new URLSearchParams({ subjectId, startDate, endDate });
    const apiUrl = `http://localhost:3001/api/teacher/attendance-report?${params.toString()}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch report.');
      }
      // Returns [{ student_id, roll_number, name, total_classes, total_present, ... }, ...]
      return data;
    } catch (error) {
      console.error("Error fetching report:", error);
      throw error;
    }
  },

};