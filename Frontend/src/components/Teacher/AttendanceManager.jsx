import React, { useState, useEffect } from 'react';
import { Calendar, Save, Filter, Download, RefreshCw, UserCheck, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceManager = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { programs, departments, semesters, attendanceStatus } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [program, setProgram] = useState('B.Tech');
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState('Semester 3');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const init = async () => {
      // Prefer subjects from logged-in user if present; fallback to service
      if (user?.subjects?.length) {
        setSubjects(user.subjects);
        setSelectedSubject(user.subjects[0]);
      } else {
        const subs = await teacherService.getTeacherSubjects(user?.id);
        setSubjects(subs);
        setSelectedSubject(subs[0] || '');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    loadStudents();
  }, [program, department, semester, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) return;
    loadAttendance();
  }, [selectedDate, program, department, semester, selectedSubject]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getStudents(selectedSubject, { program, department, semester });
      setStudents(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (students.length === 0) return;

    try {
      const data = await teacherService.getAttendance(selectedDate, selectedSubject, { program, department, semester }, attendanceStatus);
      setAttendance(data);
      updateStats(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
      // Set default attendance for new dates
      const defaultAttendance = {};
      students.forEach(student => {
        defaultAttendance[student.id] = attendanceStatus.PRESENT;
      });
      setAttendance(defaultAttendance);
      updateStats(defaultAttendance);
    }
  };

  const updateStats = (attendanceData) => {
    const present = Object.values(attendanceData).filter(status => status === attendanceStatus.PRESENT).length;
    const absent = Object.values(attendanceData).filter(status => status === attendanceStatus.ABSENT).length;
    const late = Object.values(attendanceData).filter(status => status === attendanceStatus.LATE).length;
    
    const stats = {
      totalStudents: students.length,
      presentToday: present,
      absentToday: absent,
      lateToday: late
    };

    onStatsUpdate(stats);
  };

  const handleAttendanceChange = (studentId, status) => {
    const newAttendance = { ...attendance, [studentId]: status };
    setAttendance(newAttendance);
    updateStats(newAttendance);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await teacherService.saveAttendance(selectedDate, selectedSubject, attendance, { program, department, semester });
      setSuccess('Attendance saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(student => {
      allPresent[student.id] = attendanceStatus.PRESENT;
    });
    setAttendance(allPresent);
    updateStats(allPresent);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case attendanceStatus.PRESENT:
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case attendanceStatus.ABSENT:
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case attendanceStatus.LATE:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(status => status === attendanceStatus.PRESENT).length;
    const absent = Object.values(attendance).filter(status => status === attendanceStatus.ABSENT).length;
    const late = Object.values(attendance).filter(status => status === attendanceStatus.LATE).length;
    const total = students.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, total, percentage };
  };

  const stats = getAttendanceStats();

  if (loading && students.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {programs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      </div>

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
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-800">{stats.percentage}%</div>
          <div className="text-sm text-blue-600">Present Rate</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={saveAttendance}
          disabled={saving || students.length === 0}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Attendance</span>
        </button>

        <button
          onClick={markAllPresent}
          disabled={loading || students.length === 0}
          className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors duration-300 flex items-center space-x-2"
        >
          <UserCheck className="h-4 w-4" />
          <span>Mark All Present</span>
        </button>

        <button
          onClick={loadAttendance}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 flex items-center space-x-3">
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

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.rollNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm mr-4">
                      {student.name.charAt(0)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    {Object.values(attendanceStatus).map(status => (
                      <label
                        key={status}
                        className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 ${
                          attendance[student.id] === status
                            ? getStatusColor(status)
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          value={status}
                          checked={attendance[student.id] === status}
                          onChange={() => handleAttendanceChange(student.id, status)}
                          className="sr-only"
                        />
                        <span className="capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {students.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-gray-500">No students found for the selected program.</div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;