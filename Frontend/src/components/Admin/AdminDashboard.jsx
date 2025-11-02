import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import StatCard from '../Common/StatCard';
import TeacherManagement from './TeacherManagement';
import SubjectManagement from './SubjectManagement';
import AdminReports from './AdminReports';
import { Users, GraduationCap, UserCheck, TrendingUp, Activity, Clock, BookOpen, FileText, Settings } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0
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
      const data = await adminService.getDashboardStats();
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
        <Header title="Admin Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-8 w-8 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Admin Dashboard" />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="error-message">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Admin Dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex flex-wrap space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teachers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teacher Management
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subject Management
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Teachers"
                value={stats.totalTeachers}
                icon={GraduationCap}
                color="blue"
                subtitle="Active faculty members"
              />
              <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon={Users}
                color="green"
                subtitle="Enrolled students"
              />
              <StatCard
                title="Present Today"
                value={stats.presentToday}
                icon={UserCheck}
                color="purple"
                subtitle="Students in attendance"
              />
              <StatCard
                title="Attendance Rate"
                value={`${stats.attendanceRate}%`}
                icon={TrendingUp}
                color="yellow"
                subtitle="Overall performance"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Activity className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              
              <div className="space-y-4">
              {/* Check if recentActivity exists and has items */}
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
              // Show this message if no activity is found
              <div className="text-center py-4 text-gray-500">
                <p>No recent activity found.</p>
              </div>
            )}
          </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('teachers')}
                  className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Teachers</p>
                      <p className="text-sm text-gray-500">Add, edit, or remove teachers</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('subjects')}
                  className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Subjects</p>
                      <p className="text-sm text-gray-500">Configure course subjects</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Generate Reports</p>
                      <p className="text-sm text-gray-500">Create attendance reports</p>
                    </div>
                  </div>
                </button>
                
                <button className="p-4 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">System Settings</p>
                      <p className="text-sm text-gray-500">Configure application</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <TeacherManagement />
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <SubjectManagement />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <AdminReports />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
