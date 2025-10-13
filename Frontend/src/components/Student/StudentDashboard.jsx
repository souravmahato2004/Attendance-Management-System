import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import StatCard from '../Common/StatCard';
import AttendanceCalendar from './AttendanceCalendar';
import { Clock, Calendar, TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSubject, setSelectedSubject] = useState('');

  const { subjects } = useApp();
  const { getSubjects } = useApp();

  useEffect(() => {
    if (user && user.program_name && user.department_name && user.semester) {
      getSubjects(user.program_name, user.department_name, user.semester);
    }
  }, [user]);

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
      loadDashboardData();
    }
  }, [subjects]); 

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardStats(user.id, selectedSubject);
      setStats(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Student Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-8 w-8 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Student Dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white mb-6">
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
              <p className="font-semibold text-lg">{stats.attendancePercentage}%</p>
            </div>
          </div>
          {subjects?.length > 0 && (
            <div className="mt-4">
              <label htmlFor="subject-select" className="text-sm text-purple-100 mr-2">
                Viewing Attendance For:
              </label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white/20 border border-white/40 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub} className='text-gray-900'>{sub}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'attendance'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attendance Calendar
            </button>
          </nav>
        </div>

        {error && (
          <div className="error-message mb-6">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Days"
                value={stats.totalDays}
                icon={Calendar}
                color="blue"
                subtitle="Academic days this month"
                trend={stats.totalDays > 20 ? { positive: true, value: 5, period: 'from last month' } : null}
              />
              <StatCard
                title="Present Days"
                value={stats.presentDays}
                icon={Clock}
                color="green"
                subtitle="Days attended"
                trend={stats.presentDays > 15 ? { positive: true, value: 10, period: 'from last month' } : null}
              />
              <StatCard
                title="Absent Days"
                value={stats.absentDays}
                icon={TrendingUp}
                color="red"
                subtitle="Days missed"
                trend={stats.absentDays < 3 ? { positive: true, value: 2, period: 'improvement' } : { positive: false, value: 1, period: 'from target' }}
              />
              <StatCard
                title="Attendance Rate"
                value={`${stats.attendancePercentage}%`}
                icon={Award}
                color="purple"
                subtitle="Current performance"
                trend={stats.attendancePercentage > 80 ? { positive: true, value: 5, period: 'above minimum' } : { positive: false, value: 5, period: 'below target' }}
              />
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Goal */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Target className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Goal</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Current: {stats.attendancePercentage}%</span>
                      <span className="text-gray-600">Goal: 85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          stats.attendancePercentage >= 85 
                            ? 'bg-green-500' 
                            : stats.attendancePercentage >= 75 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(stats.attendancePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {stats.attendancePercentage >= 85 ? (
                      <p className="text-green-600 font-medium">🎉 Great job! You've met your attendance goal!</p>
                    ) : stats.attendancePercentage >= 75 ? (
                      <p className="text-yellow-600 font-medium">📈 You're close to your goal. Keep it up!</p>
                    ) : (
                      <p className="text-red-600 font-medium">⚠️ You need to improve your attendance rate.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">This Month Summary</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Best streak</span>
                    <span className="font-semibold text-gray-900">{stats.currentStreak || 5} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Days late</span>
                    <span className="font-semibold text-gray-900">{stats.lateDays || 1} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Perfect days</span>
                    <span className="font-semibold text-gray-900">{stats.presentDays - (stats.lateDays || 1)} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
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
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-lg">
            <AttendanceCalendar onStatsUpdate={setStats} subject={selectedSubject} />
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;