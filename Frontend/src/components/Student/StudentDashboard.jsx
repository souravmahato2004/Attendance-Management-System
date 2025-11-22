import { useState, useEffect, useCallback } from 'react';
import Header from '../Common/Header';
import StatCard from '../Common/StatCard';
import AttendanceCalendar from './AttendanceCalendar';
import { Clock, Calendar, TrendingUp, Award, Target, BookOpen, Check, X } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
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
        {/* Welcome Section */}
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
          
          {/* Subject Dropdown */}
          {subjects?.length > 0 ? (
            <div className="mt-4">
              <label htmlFor="subject-select" className="text-sm text-red-100 mr-2">
                Viewing Attendance For:
              </label>
              <select
                id="subject-select"
                value={selectedSubject} // Value is the subject_id
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

        {/* Navigation Tabs */}
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Classes"
                value={loading ? '...' : stats.totalDays}
                icon={Calendar}
                color="blue"
                subtitle="Total classes held this month"
              />
              <StatCard
                title="Present"
                value={loading ? '...' : stats.presentDays}
                icon={Check}
                color="green"
                subtitle="Total days marked present"
              />
              <StatCard
                title="Absent"
                value={loading ? '...' : stats.absentDays}
                icon={X}
                color="red"
                subtitle="Total days marked absent"
              />
              <StatCard
                title="Late"
                value={loading ? '...' : stats.lateDays}
                icon={Clock}
                color="yellow"
                subtitle="Total days marked late"
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
                    goalMessage = <p className="text-green-600 font-medium">Excellent! You're aiming for a perfect 100%!</p>;
                    barColor = 'bg-green-500';
                  } else if (stats.attendancePercentage >= 75) {
                    currentGoal = 90;
                    goalMessage = <p className="text-yellow-600 font-medium">Great! Now push for the next milestone: 90%.</p>;
                    barColor = 'bg-yellow-500';
                  } else {
                    currentGoal = 75;
                    goalMessage = <p className="text-red-600 font-medium">You are below the 75% requirement. Let's get you there!</p>;
                    barColor = 'bg-red-500';
                  }

                  return (
                    <>
                      <div className="flex items-center space-x-3 mb-4">
                        <Target className="h-6 w-6 text-green-600" />
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
                  <BookOpen className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Subject Summary</h3>
                </div>
                
                {loading ? (
                  <div className="text-gray-500 text-sm">Loading stats...</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Classes Attended (Present + Late)</span>
                      <span className="font-semibold text-gray-900">{stats.presentDays + stats.lateDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Classes Absent</span>
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

            {/* Quick Actions */}
            {/* <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                    <div>
                      <p className="font-medium text-gray-900">View Calendar</p>
                      <p className="text-sm text-gray-500">Check daily attendance</p>
                    </div>
                  </div>
                </button>

                <button className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors duration-200 group">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                    <div>
                      <p className="font-medium text-gray-900">View Trends</p>
                      <p className="text-sm text-gray-500">Attendance analytics</p>
                    </div>
                  </div>
                </button>

                <button className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors duration-200 group">
                  <div className="flex items-center space-x-3">
                    <Award className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                    <div>
                      <p className="font-medium text-gray-900">Achievements</p>
                      <p className="text-sm text-gray-500">View milestones</p>
                    </div>
                  </div>
                </button>
              </div>
            </div> */}
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
      </main>
    </div>
  );
};

export default StudentDashboard;