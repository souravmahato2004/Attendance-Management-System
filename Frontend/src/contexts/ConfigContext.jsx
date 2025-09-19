import React, { createContext, useContext, useState } from 'react';

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
  });

  // Mock credentials - in a real app, this would come from environment variables or API
  const [mockCredentials] = useState({
    ADMIN: { email: 'admin@university.com', password: 'admin123' },
    TEACHER: { email: 'john@university.com', password: 'temp123' },
    STUDENT: { email: 'alice@student.com', password: 'student123' }
  });

  // Application configuration
  const [config, setConfig] = useState({
    appName: 'Attendance Management System',
    version: '1.0.0',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    enableMockData: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    paginationLimit: 10,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  });

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const getApiUrl = (endpoint) => {
    return `${config.apiBaseUrl}${endpoint}`;
  };

  const value = {
    apiEndpoints,
    mockCredentials,
    config,
    updateConfig,
    getApiUrl
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
