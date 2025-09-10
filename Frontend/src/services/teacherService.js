import { api } from '../utils/api';
import { API_ENDPOINTS, MOCK_CREDENTIALS, ATTENDANCE_STATUS } from '../utils/constants';

export const teacherService = {
  // Mock login
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === MOCK_CREDENTIALS.TEACHER.email && 
        credentials.password === MOCK_CREDENTIALS.TEACHER.password) {
      return {
        success: true,
        user: {
          id: 1,
          name: 'John Doe',
          email: credentials.email,
          role: 'teacher',
          // College: teachers can have multiple subjects
          subjects: ['Data Structures', 'Algorithms'],
          token: 'mock-teacher-token-' + Date.now()
        }
      };
    } else {
      throw new Error('Invalid credentials');
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
  getAttendance: async (date, subject, filters = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock attendance data
    const mockAttendance = {
      1: ATTENDANCE_STATUS.PRESENT,
      2: ATTENDANCE_STATUS.ABSENT,
      3: ATTENDANCE_STATUS.PRESENT,
      4: ATTENDANCE_STATUS.LATE,
      5: ATTENDANCE_STATUS.PRESENT,
      6: ATTENDANCE_STATUS.PRESENT
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
