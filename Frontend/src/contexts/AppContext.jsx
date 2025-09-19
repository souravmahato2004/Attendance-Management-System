import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // User roles
  const [userRoles] = useState({
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
  });

  // Attendance status
  const [attendanceStatus] = useState({
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late'
  });

  // Academic data - these would typically come from API
  const [subjects, setSubjects] = useState([
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'Data Structures', 'Algorithms', 'Discrete Mathematics', 'Operating Systems', 'Database Systems',
    'Networks', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'English', 'History', 'Geography', 'Art'
  ]);

  const [semesters, setSemesters] = useState([
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ]);

  const [programs, setPrograms] = useState(['B.Tech', 'M.Tech', 'PhD']);

  const [departments, setDepartments] = useState(['CSE', 'ECE', 'EEE', 'ME', 'CE']);

  // Program + Department + Semester subject mappings
  const [programDeptSemSubjects, setProgramDeptSemSubjects] = useState({
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
  });

  // Methods to update academic data
  const addSubject = (subject) => {
    if (!subjects.includes(subject)) {
      setSubjects(prev => [...prev, subject]);
    }
  };

  const removeSubject = (subject) => {
    setSubjects(prev => prev.filter(s => s !== subject));
  };

  const addSubjectToProgram = (program, department, semester, subject) => {
    setProgramDeptSemSubjects(prev => ({
      ...prev,
      [program]: {
        ...prev[program],
        [department]: {
          ...prev[program]?.[department],
          [semester]: [
            ...(prev[program]?.[department]?.[semester] || []),
            subject
          ]
        }
      }
    }));
  };

  const removeSubjectFromProgram = (program, department, semester, subject) => {
    setProgramDeptSemSubjects(prev => ({
      ...prev,
      [program]: {
        ...prev[program],
        [department]: {
          ...prev[program]?.[department],
          [semester]: (prev[program]?.[department]?.[semester] || []).filter(s => s !== subject)
        }
      }
    }));
  };

  const getSubjectsForProgram = (program, department, semester) => {
    return programDeptSemSubjects[program]?.[department]?.[semester] || [];
  };

  const addProgram = (program) => {
    if (!programs.includes(program)) {
      setPrograms(prev => [...prev, program]);
    }
  };

  const addDepartment = (department) => {
    if (!departments.includes(department)) {
      setDepartments(prev => [...prev, department]);
    }
  };

  const addSemester = (semester) => {
    if (!semesters.includes(semester)) {
      setSemesters(prev => [...prev, semester]);
    }
  };

  const value = {
    // Static data
    userRoles,
    attendanceStatus,
    
    // Academic data
    subjects,
    semesters,
    programs,
    departments,
    programDeptSemSubjects,
    
    // Methods
    addSubject,
    removeSubject,
    addSubjectToProgram,
    removeSubjectFromProgram,
    getSubjectsForProgram,
    addProgram,
    addDepartment,
    addSemester,
    
    // Setters for external updates
    setSubjects,
    setSemesters,
    setPrograms,
    setDepartments,
    setProgramDeptSemSubjects
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
