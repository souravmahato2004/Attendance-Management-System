import { useState, useEffect } from 'react';
import { Download, Calendar as CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';

const AttendanceCalendar = ({ onStatsUpdate, subject }) => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAttendanceData();
  }, [selectedMonth, selectedYear, subject]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await studentService.getMonthlyAttendance(user.id, selectedMonth, selectedYear, subject);
      setAttendanceData(data);
      updateStats(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const total = data.length;
    const present = data.filter(record => record.status === 'present').length;
    const absent = data.filter(record => record.status === 'absent').length;
    const late = data.filter(record => record.status === 'late').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    const stats = {
      totalDays: total,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      attendancePercentage: parseFloat(percentage)
    };

    onStatsUpdate(stats);
  };

  const downloadMonthlyReport = async () => {
    try {
      setDownloading(true);
      await studentService.downloadMonthlyReport(user, attendanceData, selectedMonth, selectedYear, subject);
    } catch (error) {
      alert(error.message);
    } finally {
      setDownloading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusStyles = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case 'late':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return '✓';
      case 'absent':
        return '✗';
      case 'late':
        return '⏰';
      default:
        return '?';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getAttendanceStats = () => {
    const present = attendanceData.filter(record => record.status === 'present').length;
    const absent = attendanceData.filter(record => record.status === 'absent').length;
    const late = attendanceData.filter(record => record.status === 'late').length;
    const total = attendanceData.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, total, percentage };
  };

  const stats = getAttendanceStats();

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h3 className="text-xl font-bold text-gray-900">Monthly Attendance Calendar {subject ? `- ${subject}` : ''}</h3>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={loadAttendanceData}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={downloadMonthlyReport}
              disabled={downloading || attendanceData.length === 0}
              className="btn-primary flex items-center space-x-2"
            >
              {downloading ? (
                <div className="loading-spinner h-4 w-4"></div>
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message mb-6">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-800">{stats.present}</div>
          <div className="text-sm text-green-600">Present</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-800">{stats.absent}</div>
          <div className="text-sm text-red-600">Absent</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-800">{stats.late}</div>
          <div className="text-sm text-yellow-600">Late</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-800">{stats.percentage}%</div>
          <div className="text-sm text-purple-600">Attendance</div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner h-8 w-8 border-purple-500"></div>
        </div>
      ) : (
        /* Attendance Calendar Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 mb-6">
          {attendanceData.map((record, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 text-center transition-all duration-300 hover:shadow-lg cursor-pointer ${getStatusStyles(record.status)}`}
              title={`${new Date(record.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} - ${getStatusLabel(record.status)}`}
            >
              <div className="text-2xl font-bold mb-1">{record.dayNumber}</div>
              <div className="text-xs uppercase tracking-wide mb-2 opacity-75">{record.day}</div>
              <div className="text-xl mb-1">{getStatusIcon(record.status)}</div>
              <div className="text-xs font-medium capitalize">{record.status}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && attendanceData.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-gray-500 mb-2">No attendance data available for the selected month.</div>
          <button
            onClick={loadAttendanceData}
            className="text-purple-600 hover:text-purple-500 font-medium"
          >
            Try refreshing the data
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Legend:</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
              <span className="text-xs">✗</span>
            </div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
              <span className="text-xs">⏰</span>
            </div>
            <span className="text-sm text-gray-600">Late</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;