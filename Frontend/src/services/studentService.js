import { api } from '../utils/api';
import { API_ENDPOINTS, MOCK_CREDENTIALS, ATTENDANCE_STATUS, PROGRAM_DEPT_SEM_SUBJECTS } from '../utils/constants';
import { downloadPDF, formatDate } from '../utils/helpers';

export const studentService = {
  // Mock login
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === MOCK_CREDENTIALS.STUDENT.email && 
        credentials.password === MOCK_CREDENTIALS.STUDENT.password) {
      return {
        success: true,
        user: {
          id: 1,
          name: 'Alice Johnson',
          email: credentials.email,
          role: 'student',
          rollNumber: '2023001',
          program: 'B.Tech',
          // College: students enroll in multiple subjects
          enrolledSubjects: ['Data Structures', 'Algorithms', 'Discrete Mathematics'],
          token: 'mock-student-token-' + Date.now()
        }
      };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  // Student signup
  signup: async (studentData) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mock validation - check if email already exists
    if (studentData.email === MOCK_CREDENTIALS.STUDENT.email) {
      throw new Error('Email already exists');
    }
    
    // Auto-assign subjects based on program + department + semester if provided (department overrides), fallback to program-semester
    const deptSubjects = studentData.program && studentData.department && studentData.semester && PROGRAM_DEPT_SEM_SUBJECTS[studentData.program]?.[studentData.department]?.[studentData.semester];
    const programSubjects = studentData.program && studentData.semester && PROGRAM_DEPT_SEM_SUBJECTS[studentData.program]?.[studentData.semester];
    const autoSubjects = deptSubjects
      ? deptSubjects
      : programSubjects || [];

    const newStudent = {
      id: Date.now(),
      ...studentData,
      enrolledSubjects: autoSubjects,
      program: studentData.program,
      department: studentData.department,
      semester: studentData.semester,
      createdAt: new Date().toISOString()
    };
    
    return {
      success: true,
      student: newStudent,
      message: 'Account created successfully'
    };
  },

  // Get dashboard stats
  getDashboardStats: async (studentId, subject) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock different stats per subject
    const base = subject ? subject.length : 0;
    return {
      totalDays: 22,
      presentDays: 16 + (base % 3),
      absentDays: 4 - (base % 2),
      lateDays: 2 - (base % 2),
      attendancePercentage: 75 + (base % 10),
      currentStreak: 5,
      monthlyStats: {
        September: { present: 18, absent: 3, late: 1 },
        August: { present: 20, absent: 2, late: 0 }
      }
    };
  },

  // Get attendance data for a month
  getMonthlyAttendance: async (studentId, month, year, subject) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const data = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const seed = (subject ? subject.length : 1) * (day + 3);
        const random = (Math.sin(seed) + 1) / 2; // deterministic-ish by subject
        let status;
        
        if (random > 0.15) {
          status = ATTENDANCE_STATUS.PRESENT;
        } else if (random > 0.05) {
          status = ATTENDANCE_STATUS.ABSENT;
        } else {
          status = ATTENDANCE_STATUS.LATE;
        }
        
        data.push({
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: day,
          status: status,
          subject: subject
        });
      }
    }
    
    return data;
  },

  // Download monthly report
  downloadMonthlyReport: async (studentData, attendanceData, month, year, subject) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[month];
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(d => d.status === ATTENDANCE_STATUS.PRESENT).length;
    const absentDays = attendanceData.filter(d => d.status === ATTENDANCE_STATUS.ABSENT).length;
    const lateDays = attendanceData.filter(d => d.status === ATTENDANCE_STATUS.LATE).length;
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
    
    // Prepare PDF data
    const pdfData = {
      title: `Student Attendance Report - ${monthName} ${year} (${subject})`,
      generatedDate: formatDate(new Date(), 'readable'),
      studentInfo: {
        'Name': studentData.name,
        'Roll Number': studentData.rollNumber,
        'Program': studentData.program || 'N/A',
        'Department': studentData.department || 'N/A',
        'Semester': studentData.semester || 'N/A',
        'Email': studentData.email,
        'Subject': subject
      },
      summary: {
        'Total Academic Days': totalDays,
        'Days Present': presentDays,
        'Days Absent': absentDays,
        'Days Late': lateDays,
        'Attendance Percentage': `${percentage}%`
      },
      tableData: attendanceData.map(record => ({
        date: record.date,
        day: record.day,
        status: record.status
      }))
    };
    
    const safeSubject = (subject || 'Subject').replace(/\s+/g, '_').toLowerCase();
    const filename = `attendance_report_${studentData.rollNumber}_${safeSubject}_${monthName}_${year}.pdf`;
    downloadPDF(pdfData, filename);
    
    return {
      success: true,
      message: 'Report downloaded successfully'
    };
  },

  // Get attendance summary for multiple months
  getAttendanceSummary: async (studentId, months = 6) => {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const summary = [];
    const currentDate = new Date();
    
    for (let i = 0; i < months; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      summary.push({
        month: monthName,
        present: Math.floor(Math.random() * 5) + 18,
        absent: Math.floor(Math.random() * 4) + 1,
        late: Math.floor(Math.random() * 3),
        percentage: Math.floor(Math.random() * 10) + 85
      });
    }
    
    return summary;
  }
};
