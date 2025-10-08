import { createContext, useContext, useState } from 'react';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  // API Endpoints
  const [apiEndpoints] = useState({
    ADMIN_LOGIN: '/api/admin/login',
    ADMIN_DASHBOARD: '/api/admin/dashboard',
    TEACHERS: '/api/admin/teachers',

    TEACHER_LOGIN: '/api/teacher/login',
    TEACHER_DASHBOARD: '/api/teacher/dashboard',
    ATTENDANCE: '/api/teacher/attendance',

    STUDENT_LOGIN: '/api/student/login',
    STUDENT_SIGNUP: '/api/student/signup',
    STUDENT_DASHBOARD: '/api/student/dashboard',
    STUDENT_ATTENDANCE: '/api/student/attendance',
  });

  // Mock credentials from process.env
  const mockCredentials = {
  ADMIN: { 
    email: import.meta.env.VITE_ADMIN_EMAIL, 
    password: import.meta.env.VITE_ADMIN_PASSWORD 
  },
  TEACHER: { 
    email: import.meta.env.VITE_TEACHER_EMAIL, 
    password: import.meta.env.VITE_TEACHER_PASSWORD 
  },
  STUDENT: { 
    email: import.meta.env.VITE_STUDENT_EMAIL, 
    password: import.meta.env.VITE_STUDENT_PASSWORD 
  },
};

  // Config from process.env
  const [config, setConfig] = useState({
    appName: process.env.APP_NAME || 'Attendance Management System',
    version: process.env.APP_VERSION || '1.0.0',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    enableMockData: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    paginationLimit: Number(process.env.PAGINATION_LIMIT) || 10,
    sessionTimeout: Number(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000,
  });

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const getApiUrl = (endpoint) => `${config.apiBaseUrl}${endpoint}`;

  const value = {
    apiEndpoints,
    mockCredentials,
    config,
    updateConfig,
    getApiUrl,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};