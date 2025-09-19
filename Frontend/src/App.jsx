import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import TeacherLogin from './components/Teacher/TeacherLogin';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import StudentLogin from './components/Student/StudentLogin';
import StudentSignup from './components/Student/StudentSignup';
import StudentDashboard from './components/Student/StudentDashboard';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ToastContainer from './components/Common/ToastContainer';
import TestLogin from './components/TestLogin';

function App() {
  return (
    <ConfigProvider>
      <AppProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/" element={<Navigate to="/student/login" />} />
                  <Route path="/test" element={<TestLogin />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Teacher Routes */}
                  <Route path="/teacher/login" element={<TeacherLogin />} />
                  <Route 
                    path="/teacher/dashboard" 
                    element={
                      <ProtectedRoute requiredRole="teacher">
                        <TeacherDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Student Routes */}
                  <Route path="/student/login" element={<StudentLogin />} />
                  <Route path="/student/signup" element={<StudentSignup />} />
                  <Route 
                    path="/student/dashboard" 
                    element={
                      <ProtectedRoute requiredRole="student">
                        <StudentDashboard />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
                <ToastContainer />
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </AppProvider>
    </ConfigProvider>
  );
}

export default App;
