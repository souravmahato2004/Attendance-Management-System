import { useState, useEffect, useCallback } from 'react';
import Header from '../Common/Header';
import StatCard from '../Common/StatCard';
import AttendanceCalendar from './AttendanceCalendar';
import { Clock, Calendar, Target, BookOpen, Check, X, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { success, eror } = useToast();

  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    attendancePercentage: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardStats(user.student_id, selectedSubject);
      setStats(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id, selectedSubject]);

  const loadSubjects = useCallback(async () => {
    if (user && user.program_name && user.department_name && user.semester) {
      try {
        const subjectData = await studentService.getSubjects(
          user.program_name,
          user.department_name,
          user.semester
        );
        setSubjects(subjectData);
        
        if (subjectData.length > 0) {
          setSelectedSubject(subjectData[0].subject_id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user, loadSubjects]);

  useEffect(() => {
    if (user?.student_id && selectedSubject) {
      loadDashboardData();
    }
    if (!selectedSubject) {
      setStats({ totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, attendancePercentage: 0, currentStreak: 0 });
    }
  }, [selectedSubject, user?.student_id, loadDashboardData]);

  // --- NEW: Handle Account Deletion ---
  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ WARNING: Are you sure you want to delete your account?\nThis action is PERMANENT. All your attendance records and personal data will be wiped immediately.")) {
      
      // Optional: Second layer of security
      const confirmation = window.prompt("To confirm deletion, please type 'DELETE' below:");
      
      if (confirmation === 'DELETE') {
        try {
          setLoading(true);
          await studentService.deleteAccount(user.student_id);
          success('Your account has been successfully deleted.');
          logout(); // Redirect to login
        } catch (err) {
          setLoading(false);
          eror(`Failed to delete account: ${err.message}`);
        }
      } else if (confirmation !== null) {
        eror("Deletion cancelled. You did not type 'DELETE' correctly.");
      }
    }
  };

  if (!user || (loading && subjects.length === 0)) { 
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Student Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="outfit min-h-screen bg-gray-50">
      <Header title="Student Dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section - Keeping your Red Theme */}
        <div className="bg-red-800 rounded-xl p-6 text-white mb-6">
          <h2 className="text-2xl font-bold mb-4">Welcome back, {user.name}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-purple-100 text-sm">Roll Number</p>
              <p className="font-semibold text-lg">{user.roll_number}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Program</p>
              <p className="font-semibold text-lg">{user.program_name}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Department</p>
              <p className="font-semibold text-lg">{user.department_name || '—'}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Semester</p>
              <p className="font-semibold text-lg">{user.semester || '—'}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Current Attendance</p>
              <p className="font-semibold text-lg">{loading ? '...' : `${stats.attendancePercentage}%`}</p>
            </div>
          </div>
          
          {subjects?.length > 0 ? (
            <div className="mt-4">
              <label htmlFor="subject-select" className="text-sm text-red-100 mr-2">
                Viewing Attendance For:
              </label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white/20 border border-white/40 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
              >
                {subjects.map(sub => (
                  <option key={sub.subject_id} value={sub.subject_id} className='text-gray-900'>
                    {sub.subject_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-purple-100 text-sm mt-4">No subjects found for your course.</p>
          )}
        </div>

        {/* Navigation Tabs - Keeping Red Theme */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'attendance'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attendance Calendar
            </button>
            {/* --- NEW: Settings Tab --- */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'settings'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Classes"
                value={loading ? '...' : stats.totalDays}
                icon={Calendar}
                color="blue"
                subtitle="Total classes held"
              />
              <StatCard
                title="Present"
                value={loading ? '...' : stats.presentDays}
                icon={Check}
                color="green"
                subtitle="Days marked present"
              />
              <StatCard
                title="Absent"
                value={loading ? '...' : stats.absentDays}
                icon={X}
                color="red"
                subtitle="Days marked absent"
              />
              <StatCard
                title="Late"
                value={loading ? '...' : stats.lateDays}
                icon={Clock}
                color="yellow"
                subtitle="Days marked late"
              />
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Goal */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                {(() => {
                  let currentGoal;
                  let goalMessage;
                  let barColor;

                  if (loading) {
                    currentGoal = 75;
                    goalMessage = <p className="text-gray-500 font-medium">Loading stats...</p>;
                    barColor = 'bg-gray-200';
                  } else if (stats.attendancePercentage >= 90) {
                    currentGoal = 100;
                    goalMessage = <p className="text-green-600 font-medium">🎉 Excellent! You're aiming for a perfect 100%!</p>;
                    barColor = 'bg-green-500';
                  } else if (stats.attendancePercentage >= 75) {
                    currentGoal = 90;
                    goalMessage = <p className="text-yellow-600 font-medium">📈 Great! Now push for the next milestone: 90%.</p>;
                    barColor = 'bg-yellow-500';
                  } else {
                    currentGoal = 75;
                    goalMessage = <p className="text-red-600 font-medium">⚠️ You are below the 75% requirement. Let's get you there!</p>;
                    barColor = 'bg-red-500';
                  }

                  return (
                    <>
                      <div className="flex items-center space-x-3 mb-4">
                        <Target className="h-6 w-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Attendance Goal ({currentGoal}%)</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Current: {loading ? '...' : `${stats.attendancePercentage}%`}</span>
                            <span className="text-gray-600">Goal: {currentGoal}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.min(stats.attendancePercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {goalMessage}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Subject Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Subject Summary</h3>
                </div>
                
                {loading ? (
                  <div className="text-gray-500 text-sm">Loading stats...</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Attended (Present + Late)</span>
                      <span className="font-semibold text-gray-900">{stats.presentDays + stats.lateDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Absent</span>
                      <span className="font-semibold text-gray-900">{stats.absentDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Classes</span>
                      <span className="font-semibold text-gray-900">{stats.totalDays} days</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-lg">
            <AttendanceCalendar 
              subjectId={selectedSubject} 
              studentId={user.student_id} 
              subjects={subjects}
            />
          </div>
        )}

        {/* --- NEW: Settings Tab (Delete Account) --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Settings className="h-6 w-6 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="text-md font-bold text-red-800">Danger Zone</h4>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h5 className="text-gray-900 font-medium mb-1">Delete Account</h5>
                        <p className="text-sm text-gray-500 max-w-xl">
                          Permanently remove your account and all associated data. This includes your profile information and attendance records. 
                          <span className="font-bold text-red-600 ml-1">This action cannot be undone.</span>
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center space-x-2 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;