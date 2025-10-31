import { useState, useEffect } from 'react';
import Header from '../Common/Header';
import StatCard from '../Common/StatCard';
import AttendanceManager from './AttendanceManager';
import { Users, UserCheck, UserX, Clock, Calendar, TrendingUp, BarChart } from 'lucide-react'; // Added BarChart
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../contexts/AuthContext';

// --- NEW COMPONENTS (Create these files) ---
import StudentList from './StudentList';
import AttendanceReports from './AttendanceReports';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  
  // --- UPDATED: Added 'students' and 'reports' tabs ---
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Only load dashboard data when the user is on the overview tab
    // and the user object is available.
    if (activeTab === 'overview' && user?.teacher_id) {
      loadDashboardData();
    }
  }, [activeTab, user?.teacher_id]); // <-- Add dependencies

  const loadDashboardData = async () => {
    try {
      // We don't set loading to true here, so it's a silent refresh
      const data = await teacherService.getDashboardStats(user.teacher_id); 
      const subjects = await teacherService.getTeacherSubjects(user.teacher_id);
      setAssignedSubjects(subjects);
      setStats(data);
    } catch (error) {
      setError(error.message);
    } finally {
      // This will set loading to false after the *initial* load.
      // On subsequent tab-switching loads, it does nothing, which is fine.
      setLoading(false); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Teacher Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Teacher Dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Teacher'}!</h2>
          
          <p className="text-green-100">
            Subjects: {assignedSubjects.length 
              ? assignedSubjects.map(subject => subject.subject_name).join(', ') 
              : 'No subjects assigned'}
          </p>
          
          <p className="text-white text-md font-bold mt-2">
            Today is {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* --- UPDATED: Navigation Tabs --- */}
        <div>
          <nav className="flex flex-wrap space-x-4 sm:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'attendance'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attendance
            </button>
            {/* --- NEW TAB: Student List --- */}
            <button
              onClick={() => setActiveTab('students')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'students'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Student List
            </button>
            {/* --- NEW TAB: Reports --- */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              View Reports
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* --- UPDATED: Tab Content Rendering --- */}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="blue"/>
              <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="green" />
              <StatCard title="Absent Today" value={stats.absentToday} icon={UserX} color="red" />
              <StatCard title="Late Today" value={stats.lateToday} icon={Clock} color="yellow" />
            </div>

            {/* Recent Attendance Trends */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Attendance Trends</h3>
              </div>
              
              <div className="space-y-4">
                {/* Map over the recentAttendance array from the stats object */}
                {(stats.recentAttendance || []).map((record, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {/* This tells the browser to treat the date string "2025-10-31" as
                            midnight UTC, and then format it in UTC, ignoring your local timezone.
                          */}
                          {new Date(record.date + 'T00:00:00.000Z').toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric',
                            timeZone: 'UTC' // <-- ADD THIS LINE
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                      <span className="text-green-600 font-medium">Present: {record.present}</span>
                      <span className="text-red-600 font-medium">Absent: {record.absent}</span>
                      <span className="text-yellow-600 font-medium">Late: {record.late}</span>
                    </div>
                  </div>
                ))}

                {/* Show a message if no recent data exists */}
                {(!stats.recentAttendance || stats.recentAttendance.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent attendance data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- UPDATED: Quick Actions --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button 
                onClick={() => setActiveTab('attendance')}
                className="p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group w-full"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Mark Attendance</h4>
                    <p className="text-sm text-gray-500">Update today's attendance</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('reports')} // <-- WIRED UP
                className="p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group w-full"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                    <BarChart className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">View Reports</h4>
                    <p className="text-sm text-gray-500">Attendance analytics</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('students')} // <-- WIRED UP
                className="p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group w-full"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Student List</h4>
                    <p className="text-sm text-gray-500">Manage your students</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-lg">
            {/* Passing subjects from auth to the manager.
                This assumes your AttendanceManager is set up to receive this prop.
                If not, it will just use its own internal logic. 
            */}
            <AttendanceManager onStatsUpdate={setStats} teacherSubjects={user?.subjects} />
          </div>
        )}

        {/* --- NEW TAB CONTENT: Student List --- */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-lg">
            <StudentList teacherId={user?.teacher_id} />
          </div>
        )}

        {/* --- NEW TAB CONTENT: Reports --- */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-lg">
            <AttendanceReports teacherId={user?.teacher_id} />
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;