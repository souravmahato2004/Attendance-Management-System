import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import { teacherService } from '../services/teacherService';
import { studentService } from '../services/studentService';

const TestLogin = () => {
  const [results, setResults] = useState({});

  const testLogins = async () => {
    const testResults = {};

    // Test Admin Login
    try {
      const adminResult = await adminService.login({
        email: 'admin@university.com',
        password: 'admin123'
      });
      testResults.admin = { success: true, data: adminResult };
    } catch (error) {
      testResults.admin = { success: false, error: error.message };
    }

    // Test Teacher Login
    try {
      const teacherResult = await teacherService.login({
        email: 'john@university.com',
        password: 'temp123'
      });
      testResults.teacher = { success: true, data: teacherResult };
    } catch (error) {
      testResults.teacher = { success: false, error: error.message };
    }

    // Test Student Login
    try {
      const studentResult = await studentService.login({
        email: 'alice@student.com',
        password: 'student123'
      });
      testResults.student = { success: true, data: studentResult };
    } catch (error) {
      testResults.student = { success: false, error: error.message };
    }

    setResults(testResults);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Login Test</h1>
      <button
        onClick={testLogins}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Test All Logins
      </button>

      <div className="space-y-4">
        <div>
          <h3 className="font-bold">Admin Login (admin@university.com / admin123)</h3>
          {results.admin ? (
            <div className={`p-2 rounded ${results.admin.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {results.admin.success ? 'SUCCESS' : `ERROR: ${results.admin.error}`}
            </div>
          ) : (
            <div className="text-gray-500">Not tested</div>
          )}
        </div>

        <div>
          <h3 className="font-bold">Teacher Login (john@university.com / temp123)</h3>
          {results.teacher ? (
            <div className={`p-2 rounded ${results.teacher.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {results.teacher.success ? 'SUCCESS' : `ERROR: ${results.teacher.error}`}
            </div>
          ) : (
            <div className="text-gray-500">Not tested</div>
          )}
        </div>

        <div>
          <h3 className="font-bold">Student Login (alice@student.com / student123)</h3>
          {results.student ? (
            <div className={`p-2 rounded ${results.student.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {results.student.success ? 'SUCCESS' : `ERROR: ${results.student.error}`}
            </div>
          ) : (
            <div className="text-gray-500">Not tested</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestLogin;

