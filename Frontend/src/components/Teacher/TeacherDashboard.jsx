import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import StatCard from '../Common/StatCard';
import AttendanceManager from './AttendanceManager';
import { Users, UserCheck, UserX, Clock, Calendar, TrendingUp } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../contexts/AuthContext';

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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getDashboardStats();
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
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
          {user.subjects?.length ? (
            <p className="text-green-100">Subjects: {user.subjects.join(', ')}</p>
          ) : (
            <p className="text-green-100">Subjects: -</p>
          )}
          <p className="text-green-100 text-sm mt-2">
            Today is {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Navigation Tabs */}
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
              Attendance Management
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon={Users}
                color="blue"
                subtitle="Under your guidance"
              />
              <StatCard
                title="Present Today"
                value={stats.presentToday}
                icon={UserCheck}
                color="green"
                subtitle="Students in course"
              />
              <StatCard
                title="Absent Today"
                value={stats.absentToday}
                icon={UserX}
                color="red"
                subtitle="Students missing"
              />
              <StatCard
                title="Late Today"
                value={stats.lateToday}
                icon={Clock}
                color="yellow"
                subtitle="Students late"
              />
            </div>

            {/* Recent Attendance Trends */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Attendance Trends</h3>
              </div>
              
              <div className="space-y-4">
                {(stats.recentAttendance || []).map((record, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
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
                {(!stats.recentAttendance || stats.recentAttendance.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent attendance data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
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

              <button className="p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group w-full">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">View Reports</h4>
                    <p className="text-sm text-gray-500">Attendance analytics</p>
                  </div>
                </div>
              </button>

              <button className="p-4 sm:p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group w-full">
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
            <AttendanceManager onStatsUpdate={setStats} />
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
