import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Calendar as CalendarIcon, Filter, RefreshCw, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';
import { useToast } from '../../contexts/ToastContext';

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

const AttendanceCalendar = ({ subjectId, studentId, subjects }) => {
  const { user } = useAuth();
  const { eror } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
 

  const loadAttendanceData = useCallback(async () => {
    if (!studentId || !subjectId) {
      setAttendanceData([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await studentService.getMonthlyAttendance(
        studentId, 
        selectedMonth, 
        selectedYear, 
        subjectId
      );
      setAttendanceData(data);
    } catch (error) {
      setError(error.message);
      eror(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, subjectId, studentId, eror]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  const stats = useMemo(() => {
    const present = attendanceData.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
    const absent = attendanceData.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;
    const late = attendanceData.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;
    const total = attendanceData.length;
    const attended = present + late;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { present, absent, late, total, percentage };
  }, [attendanceData]);

  const downloadMonthlyReport = async () => {
    const subject = subjects?.find(s => s.subject_id == subjectId);
    const subjectName = subject ? subject.subject_name : "Subject";

    try {
      setDownloading(true);
      await studentService.downloadMonthlyReport(
        user, 
        attendanceData, 
        selectedMonth, 
        selectedYear, 
        subjectName,
        ATTENDANCE_STATUS 
      );
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
      case ATTENDANCE_STATUS.PRESENT:
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
      case ATTENDANCE_STATUS.ABSENT:
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case ATTENDANCE_STATUS.LATE:
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT: return <Check className="h-5 w-5" />;
      case ATTENDANCE_STATUS.ABSENT: return <X className="h-5 w-5" />;
      case ATTENDANCE_STATUS.LATE: return <Clock className="h-5 w-5" />;
      default: return '?';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const currentSubjectName = useMemo(() => {
     if (!subjectId || !subjects) return "";
     const subject = subjects.find(s => s.subject_id == subjectId);
     return subject ? `- ${subject.subject_name}` : "";
  }, [subjectId, subjects]);

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h3 className="text-xl font-bold text-gray-900">Monthly Attendance {currentSubjectName}</h3>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-transparent bg-white"
              disabled={loading}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            
            {/* --- 2. THIS IS THE UPDATED DROPDOWN --- */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-transparent bg-white"
              disabled={loading}
            >
              {/* Map over the dynamic 'years' array */}
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {/* --- END OF UPDATED DROPDOWN --- */}

          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={loadAttendanceData}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={downloadMonthlyReport}
              disabled={downloading || attendanceData.length === 0}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
        </div>
      ) : (
        /* Attendance Calendar Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 mb-6">
          {attendanceData.map((record, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 text-center transition-all duration-300 hover:shadow-lg cursor-pointer ${getStatusStyles(record.status)}`}
              title={`${new Date(record.date + 'T00:00:00.000Z').toLocaleDateString('en-US', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'UTC'
              })} - ${getStatusLabel(record.status)}`}
            >
              <div className="text-2xl font-bold mb-1">{record.dayNumber}</div>
              <div className="text-xs uppercase tracking-wide mb-2 opacity-75">{record.day}</div>
              <div className="text-xl mb-1 flex justify-center">{getStatusIcon(record.status)}</div>
              <div className="text-xs font-medium capitalize">{record.status}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && attendanceData.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-gray-500 mb-2">
            {subjectId ? "No attendance data available for this subject in the selected month." : "Please select a subject from the dashboard."}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Legend:</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center">
              <Check className="h-3 w-3 text-green-800" />
            </div>
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
              <X className="h-3 w-3 text-red-800" />
            </div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
              <Clock className="h-3 w-3 text-yellow-800" />
            </div>
            <span className="text-sm text-gray-600">Late</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;