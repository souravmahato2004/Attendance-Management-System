export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

export const MOCK_CREDENTIALS = {
  ADMIN: { email: 'admin@university.com', password: 'admin123' },
  TEACHER: { email: 'john@university.com', password: 'temp123' },
  STUDENT: { email: 'alice@student.com', password: 'student123' }
};


export const SUBJECTS = [
  // Expanded subjects for college use-case
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Data Structures', 'Algorithms', 'Discrete Mathematics', 'Operating Systems', 'Database Systems',
  'Networks', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'English', 'History', 'Geography', 'Art'
];

// College: list of semesters and default subject mapping per semester
export const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

export const SEMESTER_SUBJECTS = {
  'Semester 1': ['Mathematics', 'Physics', 'English'],
  'Semester 2': ['Mathematics', 'Chemistry', 'Computer Science'],
  'Semester 3': ['Data Structures', 'Discrete Mathematics', 'Electronics'],
  'Semester 4': ['Algorithms', 'Operating Systems', 'Networks'],
  'Semester 5': ['Database Systems', 'Computer Science', 'Mathematics'],
  'Semester 6': ['Operating Systems', 'Networks', 'Algorithms'],
  'Semester 7': ['Data Structures', 'Database Systems', 'Electronics'],
  'Semester 8': ['Computer Science', 'Civil Engineering', 'Mechanical Engineering']
};

// College programs
export const PROGRAMS = ['B.Tech', 'M.Tech', 'PhD'];

// Program-specific subject mapping per semester
export const PROGRAM_SEMESTER_SUBJECTS = {
  'B.Tech': {
    'Semester 1': ['Mathematics', 'Physics', 'English'],
    'Semester 2': ['Mathematics', 'Chemistry', 'Computer Science'],
    'Semester 3': ['Data Structures', 'Discrete Mathematics', 'Electronics'],
    'Semester 4': ['Algorithms', 'Operating Systems', 'Networks'],
    'Semester 5': ['Database Systems', 'Computer Science', 'Mathematics'],
    'Semester 6': ['Operating Systems', 'Networks', 'Algorithms'],
    'Semester 7': ['Data Structures', 'Database Systems', 'Electronics'],
    'Semester 8': ['Computer Science', 'Civil Engineering', 'Mechanical Engineering']
  },
  'M.Tech': {
    'Semester 1': ['Advanced Algorithms', 'Distributed Systems'],
    'Semester 2': ['Machine Learning', 'Advanced Databases'],
    'Semester 3': ['Research Methodology', 'Thesis Seminar'],
    'Semester 4': ['Thesis']
  },
  'PhD': {
    'Semester 1': ['Research Methodology', 'Literature Review'],
    'Semester 2': ['Advanced Topics Seminar'],
    'Semester 3': ['Comprehensive Exam Prep'],
    'Semester 4': ['Thesis Proposal'],
    'Semester 5': ['Research'],
    'Semester 6': ['Research'],
    'Semester 7': ['Research'],
    'Semester 8': ['Thesis Defense']
  }
};

// College departments
export const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];

// Program + Department + Semester subject mappings (fallbacks to PROGRAM_SEMESTER_SUBJECTS when missing)
export const PROGRAM_DEPT_SEM_SUBJECTS = {
  'B.Tech': {
    'CSE': {
      'Semester 1': ['Mathematics', 'Physics', 'English'],
      'Semester 2': ['Mathematics', 'Chemistry', 'Computer Science'],
      'Semester 3': ['Data Structures', 'Discrete Mathematics', 'Electronics'],
      'Semester 4': ['Algorithms', 'Operating Systems', 'Networks']
    },
    'ECE': {
      'Semester 1': ['Mathematics', 'Physics', 'English'],
      'Semester 2': ['Mathematics', 'Chemistry', 'Electronics'],
      'Semester 3': ['Signals and Systems', 'Digital Electronics', 'Network Theory'],
      'Semester 4': ['Control Systems', 'Communication Systems', 'Microprocessors']
    }
  },
  'M.Tech': {
    'CSE': {
      'Semester 1': ['Advanced Algorithms', 'Distributed Systems'],
      'Semester 2': ['Machine Learning', 'Advanced Databases']
    }
  }
};

export const API_ENDPOINTS = {
  // Admin endpoints
  ADMIN_LOGIN: '/api/admin/login',
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  TEACHERS: '/api/admin/teachers',
  
  // Teacher endpoints
  TEACHER_LOGIN: '/api/teacher/login',
  TEACHER_DASHBOARD: '/api/teacher/dashboard',
  ATTENDANCE: '/api/teacher/attendance',
  
  // Student endpoints
  STUDENT_LOGIN: '/api/student/login',
  STUDENT_SIGNUP: '/api/student/signup',
  STUDENT_DASHBOARD: '/api/student/dashboard',
  STUDENT_ATTENDANCE: '/api/student/attendance',
};
