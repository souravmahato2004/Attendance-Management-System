export const teacherService = {
  // Mock login
  login: async (credentials) => {
    const apiUrl = 'http://localhost:3001/api/teacher/login';
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
        user: data.teacher
      };

    } catch (error) {
      throw error;
    }
  },

  // Get subjects handled by this teacher (college use-case)
  getTeacherSubjects: async (teacherId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Return the same as login for mock purposes
    return ['Data Structures', 'Algorithms'];
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalStudents: 35,
      presentToday: 28,
      absentToday: 5,
      lateToday: 2,
      recentAttendance: [
        { date: '2024-09-08', present: 30, absent: 3, late: 2 },
        { date: '2024-09-07', present: 32, absent: 2, late: 1 },
      ]
    };
  },

  // Get students for a subject
  getStudents: async (subject, filters = {}) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { program = 'B.Tech', department = 'CSE', semester = 'Semester 3' } = filters;

    return [
      { id: 1, name: 'Alice Johnson', rollNumber: '2023001', subject, program, department, semester },
      { id: 2, name: 'Bob Smith', rollNumber: '2023002', subject, program, department, semester },
      { id: 3, name: 'Carol Davis', rollNumber: '2023003', subject, program, department, semester },
      { id: 4, name: 'David Wilson', rollNumber: '2023004', subject, program, department, semester },
      { id: 5, name: 'Emma Brown', rollNumber: '2023005', subject, program, department, semester },
      { id: 6, name: 'Frank Miller', rollNumber: '2023006', subject, program, department, semester }
    ];
  },

  // Get attendance for a specific date
  getAttendance: async (date, subject, filters = {}, attendanceStatus) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock attendance data
    const mockAttendance = {
      1: attendanceStatus.PRESENT,
      2: attendanceStatus.ABSENT,
      3: attendanceStatus.PRESENT,
      4: attendanceStatus.LATE,
      5: attendanceStatus.PRESENT,
      6: attendanceStatus.PRESENT
    };
    
    return mockAttendance;
  },

  // Save attendance
  saveAttendance: async (date, subject, attendanceData, filters = {}) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Saving attendance:', { date, subject, attendanceData, filters });
    
    return {
      success: true,
      message: 'Attendance saved successfully',
      savedAt: new Date().toISOString()
    };
  },

  // Get attendance history
  getAttendanceHistory: async (subject, startDate, endDate) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const history = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        history.push({
          date: d.toISOString().split('T')[0],
          present: Math.floor(Math.random() * 5) + 28,
          absent: Math.floor(Math.random() * 5) + 1,
          late: Math.floor(Math.random() * 3)
        });
      }
    }
    
    return history;
  }
};