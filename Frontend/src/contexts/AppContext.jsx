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
  const [subjects, setSubjects] = useState([]);

  const getSubjects = async (program, department, semester) => {
    const params = new URLSearchParams({
      program: program,
      department: department,
      semester: semester
    });
    const response = await fetch(`http://localhost:3001/api/student/subjects?${params.toString()}`);
    const data = await response.json();
    setSubjects(data);
  }

  const [semesters, setSemesters] = useState([]);

  const getsemesters = async () => {
    const response = await fetch(`http://localhost:3001/api/student/semesters`);
    const data = await response.json();
    setSemesters(data);
  }

  const [programs, setPrograms] = useState([]);

  const getprograms = async () => {
    const response = await fetch(`http://localhost:3001/api/student/programs`);
    const data = await response.json();
    setPrograms(data);
  }

  const [departments, setDepartments] = useState([]);

  const getdepartments = async () => {
    const response = await fetch(`http://localhost:3001/api/student/departments`);
    const data = await response.json();
    setDepartments(data);
  }

  
  // i have to work on it later starting from here
  // const getSubjects=async()=>{
  //   const response=await fetch(`${process.env.API_BASE_URL}/api/students/subjects`);
  //   const data=await response.json();
  //   setProgramDeptSemSubjects(data);
  // }

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

    // api calls
    getprograms,
    getsemesters,
    getdepartments,
    getSubjects
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
