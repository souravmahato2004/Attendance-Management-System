import { api } from '../utils/api';
import { API_ENDPOINTS, MOCK_CREDENTIALS, PROGRAM_SEMESTER_SUBJECTS, PROGRAM_DEPT_SEM_SUBJECTS } from '../utils/constants';
import { generatePassword, downloadPDF, formatDate } from '../utils/helpers';

export const adminService = {
  // Mock login - replace with real API call
  login: async (credentials) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === MOCK_CREDENTIALS.ADMIN.email && 
        credentials.password === MOCK_CREDENTIALS.ADMIN.password) {
      return {
        success: true,
        user: {
          id: 1,
          name: 'Administrator',
          email: credentials.email,
          role: 'admin',
          token: 'mock-admin-token-' + Date.now()
        }
      };
    } else {
      throw new Error('Invalid credentials');
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
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@university.com', 
        subject: 'Mathematics', 
        phone: '123-456-7890', 
        address: '123 Main St',
        createdAt: '2024-01-15'
      },
      { 
        id: 2, 
        name: 'Jane Smith', 
        email: 'jane@university.com', 
        subject: 'English', 
        phone: '098-765-4321', 
        address: '456 Oak Ave',
        createdAt: '2024-02-20'
      },
      { 
        id: 3, 
        name: 'Mike Johnson', 
        email: 'mike@university.com', 
        subject: 'Science', 
        phone: '555-123-4567', 
        address: '789 Pine Rd',
        createdAt: '2024-03-10'
      }
    ];
  },

  // Add new teacher
  addTeacher: async (teacherData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTeacher = {
      id: Date.now(),
      ...teacherData,
      password: generatePassword(),
      createdAt: new Date().toISOString()
    };
    
    // In real implementation, send email with credentials
    console.log('Sending welcome email to:', teacherData.email);
    
    return {
      success: true,
      teacher: newTeacher,
      message: 'Teacher added successfully'
    };
  },

  // Update teacher
  updateTeacher: async (id, teacherData) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      teacher: { id, ...teacherData, updatedAt: new Date().toISOString() },
      message: 'Teacher updated successfully'
    };
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      message: 'Teacher deleted successfully'
    };
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

  // Add teacher with subject assignment
  addTeacherWithSubject: async (teacherData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTeacher = {
      id: Date.now(),
      ...teacherData,
      password: generatePassword(),
      subjects: teacherData.subjects || [],
      createdAt: new Date().toISOString()
    };
    
    return {
      success: true,
      teacher: newTeacher,
      message: 'Teacher added successfully with subject assignments'
    };
  },

  // Update teacher subjects
  updateTeacherSubjects: async (teacherId, subjects) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      message: 'Teacher subjects updated successfully',
      subjects: subjects
    };
  },

  // Get all subjects for a program, department and semester
  getSubjectsForProgram: async (program, semester, department) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if department-specific subjects exist, otherwise fall back to program-semester
    const deptSubjects = PROGRAM_DEPT_SEM_SUBJECTS?.[program]?.[department]?.[semester];
    const programSubjects = PROGRAM_SEMESTER_SUBJECTS[program]?.[semester] || [];
    
    return deptSubjects || programSubjects;
  },

  // Add subject to program-department-semester
  addSubjectToProgram: async (program, semester, subject, department) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In real implementation, this would update the database
    // For now, we'll add to the department-specific structure if it exists
    if (department && PROGRAM_DEPT_SEM_SUBJECTS?.[program]?.[department]) {
      if (!PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester]) {
        PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester] = [];
      }
      if (!PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester].includes(subject)) {
        PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester].push(subject);
      }
      return {
        success: true,
        message: 'Subject added successfully',
        subjects: PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester]
      };
    } else {
      // Fallback to program-semester structure
      if (!PROGRAM_SEMESTER_SUBJECTS[program]) {
        PROGRAM_SEMESTER_SUBJECTS[program] = {};
      }
      if (!PROGRAM_SEMESTER_SUBJECTS[program][semester]) {
        PROGRAM_SEMESTER_SUBJECTS[program][semester] = [];
      }
      
      if (!PROGRAM_SEMESTER_SUBJECTS[program][semester].includes(subject)) {
        PROGRAM_SEMESTER_SUBJECTS[program][semester].push(subject);
      }
      
      return {
        success: true,
        message: 'Subject added successfully',
        subjects: PROGRAM_SEMESTER_SUBJECTS[program][semester]
      };
    }
  },

  // Remove subject from program-department-semester
  removeSubjectFromProgram: async (program, semester, subject, department) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Try department-specific structure first
    if (department && PROGRAM_DEPT_SEM_SUBJECTS?.[program]?.[department]?.[semester]) {
      const index = PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester].indexOf(subject);
      if (index > -1) {
        PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester].splice(index, 1);
      }
      return {
        success: true,
        message: 'Subject removed successfully',
        subjects: PROGRAM_DEPT_SEM_SUBJECTS[program][department][semester] || []
      };
    } else if (PROGRAM_SEMESTER_SUBJECTS[program]?.[semester]) {
      // Fallback to program-semester structure
      const index = PROGRAM_SEMESTER_SUBJECTS[program][semester].indexOf(subject);
      if (index > -1) {
        PROGRAM_SEMESTER_SUBJECTS[program][semester].splice(index, 1);
      }
      return {
        success: true,
        message: 'Subject removed successfully',
        subjects: PROGRAM_SEMESTER_SUBJECTS[program][semester] || []
      };
    }
    
    return {
      success: true,
      message: 'Subject removed successfully',
      subjects: []
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
  getProgramsAndSemesters: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      programs: Object.keys(PROGRAM_SEMESTER_SUBJECTS),
      semesters: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']
    };
  },

  // Get all subjects
  getAllSubjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allSubjects = new Set();
    Object.values(PROGRAM_SEMESTER_SUBJECTS).forEach(program => {
      Object.values(program).forEach(semester => {
        semester.forEach(subject => allSubjects.add(subject));
      });
    });
    
    return Array.from(allSubjects);
  }
};
