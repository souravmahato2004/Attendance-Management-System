import { downloadPDF, formatDate } from '../utils/helpers';

export const studentService = {
  
  login: async (credentials) => {
  const API_URL = 'http://localhost:3001/api/student/login';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'An unknown error occurred.');
    }
    return responseData;

  } catch (error) {
    console.error('Login API Error:', error);
    // Re-throw the error so the component calling this function can handle it
    throw error;
  }
},

  // Student signup
  signup: async (studentData) => {
    const API_URL = 'http://localhost:3001/api/student/signup';
    try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData), 
    });

    // Parse the JSON response from the server
    const responseData = await response.json();

    // If the server returns an error status (e.g., 400, 409), throw an error
    if (!response.ok) {
      throw new Error(responseData.message || 'An unknown error occurred.');
    }
    return responseData;

  } catch (error) {
    console.error('Signup API Error:', error);
    throw error;
  }
  },

  // NEW: Get subjects for the logged-in student
  getSubjects: async (program_name, department_name, semester) => {
    const API_URL = 'http://localhost:3001/api/student/subjects';
    
    const params = new URLSearchParams({
      program: program_name,
      department: department_name,
      semester: semester
    });

    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subjects.');
      }
      return data; // Returns [{ subject_id, subject_name }, ...]
    } catch (error) {
      console.error('getSubjects API Error:', error);
      throw error;
    }
  },

  // --- UPDATED ---
  // Get dashboard stats (now fetches from backend)
  getDashboardStats: async (studentId, subjectId) => {
    // Return empty stats if data is missing
    if (!studentId || !subjectId) {
      return { totalDays: 0, presentDays: 0, absentDays: 0, attendancePercentage: 0, lateDays: 0 };
    }
    
    const API_URL = 'http://localhost:3001/api/student/dashboard-stats';
    const params = new URLSearchParams({ studentId, subjectId });

    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stats.');
      }
      return data;
    } catch (error) {
      console.error('getDashboardStats API Error:', error);
      throw error;
    }
  },

  // --- UPDATED ---
  // Get attendance data for a month (now fetches from backend)
  getMonthlyAttendance: async (studentId, month, year, subjectId) => {
    // Note: 'subject' prop is now 'subjectId'
    if (!studentId || !subjectId) {
      return []; // Not enough info to fetch
    }
    
    const API_URL = 'http://localhost:3001/api/student/monthly-attendance';
    const params = new URLSearchParams({
      studentId,
      subjectId,
      month, // 0-indexed
      year
    });
    
    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch monthly attendance.');
      }
      return data;
    } catch (error) {
      console.error('getMonthlyAttendance API Error:', error);
      throw error;
    }
  },

  // --- UPDATED FUNCTION ---
  // Download monthly report
  downloadMonthlyReport: async (studentData, attendanceData, month, year, subject, attendanceStatus) => {
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[month];
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(d => d.status === attendanceStatus.PRESENT).length;
    const absentDays = attendanceData.filter(d => d.status === attendanceStatus.ABSENT).length;
    const lateDays = attendanceData.filter(d => d.status === attendanceStatus.LATE).length;
    const attended = presentDays + lateDays;
    const percentage = totalDays > 0 ? ((attended / totalDays) * 100).toFixed(1) : 0;
    
    // Prepare PDF data
    const pdfData = {
      title: `Student Attendance Report - ${monthName} ${year} (${subject})`,
      generatedDate: formatDate(new Date(), 'readable'), // Assumes you have formatDate helper
      
      // --- THIS SECTION IS FIXED ---
      studentInfo: {
        'Name': studentData.name,
        'Roll Number': studentData.roll_number,       // Use roll_number
        'Program': studentData.program_name || 'N/A', // Use program_name
        'Department': studentData.department_name || 'N/A', // Use department_name
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
    const filename = `attendance_report_${studentData.roll_number}_${safeSubject}_${monthName}_${year}.pdf`;
    
    // This call to your helper function will now work
    downloadPDF(pdfData, filename); 
    
    return {
      success: true,
      message: 'Report downloaded successfully'
    };
  },

};