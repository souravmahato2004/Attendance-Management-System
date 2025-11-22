import { useState, useEffect, useCallback } from 'react';
import { Calendar, Save, Filter, RefreshCw, UserCheck, Users } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

const AttendanceManager = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { success, eror } = useToast();

  const getLocalDate = () => {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
    const day = todayDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getLocalDate());

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      if (user?.teacher_id) {
        let subjectData = [];
        if (user.subjects?.length) {
          subjectData = user.subjects;
        } else {
          subjectData = await teacherService.getTeacherSubjects(user.teacher_id);
        }
        setSubjects(subjectData);
        setSelectedSubject('');
      }
    };
    if (user) {
      init();
    }
  }, [user]);

  const updateStats = useCallback((attendanceData, studentList) => {
    const total = studentList.length;

    if (total === 0 && Object.keys(attendanceData).length === 0) {
        if (onStatsUpdate) {
            onStatsUpdate({ totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0 });
        }
        return;
    }

    const present = Object.values(attendanceData).filter(s => s === ATTENDANCE_STATUS.PRESENT).length;
    const absent = Object.values(attendanceData).filter(s => s === ATTENDANCE_STATUS.ABSENT).length;
    const late = Object.values(attendanceData).filter(s => s === ATTENDANCE_STATUS.LATE).length;
    
    if (onStatsUpdate) {
      onStatsUpdate({
        totalStudents: total,
        presentToday: present,
        absentToday: absent,
        lateToday: late
      });
    }
  }, [onStatsUpdate]);

  const loadStudents = useCallback(async () => {
    if (!selectedSubject) {
      setStudents([]);
      return [];
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getStudentsBySubject(selectedSubject);
      setStudents(data);
      return data;
    } catch (err) {
      setError(err.message);
      eror(`Failed to load students: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, eror]);

  const loadAttendance = useCallback(async (studentList) => {
    if (studentList.length === 0) {
      setAttendance({});
      updateStats({}, []);
      return;
    }

    try {
      const data = await teacherService.getAttendance(selectedSubject, selectedDate);
      const attendanceMap = data.reduce((acc, record) => {
        acc[record.student_id] = record.status;
        return acc;
      }, {});

      setAttendance(attendanceMap);
      updateStats(attendanceMap, studentList);

    } catch (error) {
      const defaultAttendance = {};
      setAttendance(defaultAttendance);
      updateStats(defaultAttendance, studentList);
    }
  }, [selectedSubject, selectedDate, updateStats]);

  useEffect(() => {
    if (!selectedSubject) {
      setStudents([]);
      setAttendance({});
      updateStats({}, []);
      return;
    }

    loadStudents().then(studentList => {
      if (studentList) {
        loadAttendance(studentList);
      }
    });
  }, [selectedSubject, selectedDate, loadStudents, loadAttendance, updateStats]);

  const saveAttendance = async () => {
    if (!selectedSubject || students.length === 0) return;

    setSaving(true);
    setError('');
    try {
      const attendanceData = Object.keys(attendance)
        .filter(studentId => attendance[studentId])
        .map(studentId => ({
          student_id: studentId,
          status: attendance[studentId]
        }));
      
      if (attendanceData.length === 0) {
        eror("No attendance data to save. Please mark at least one student.");
        setSaving(false);
        return;
      }

      await teacherService.saveAttendance(
        selectedSubject,
        selectedDate,
        attendanceData,
        user.teacher_id
      );
      
      success('Attendance saved successfully!');
    } catch (err) {
      setError(err.message);
      eror(`Failed to save attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    const newStatus = attendance[studentId] === status ? null : status;
    const newAttendance = { ...attendance, [studentId]: newStatus };
    
    setAttendance(newAttendance);
    updateStats(newAttendance, students);
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(student => {
      allPresent[student.student_id] = ATTENDANCE_STATUS.PRESENT;
    });
    setAttendance(allPresent);
    updateStats(allPresent, students);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case ATTENDANCE_STATUS.ABSENT:
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case ATTENDANCE_STATUS.LATE:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(s => s === ATTENDANCE_STATUS.PRESENT).length;
    const absent = Object.values(attendance).filter(s => s === ATTENDANCE_STATUS.ABSENT).length;
    const late = Object.values(attendance).filter(s => s === ATTENDANCE_STATUS.LATE).length;
    const total = students.length;
    const percentage = (total - absent) > 0 ? Math.round(((total - absent) / total) * 100) : 0;
    return { present, absent, late, total, percentage };
  };

  const stats = getAttendanceStats();

  if (loading && students.length === 0 && selectedSubject) {
     return (
       <div className="p-6">
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent bg-white"
            >
              <option value="">Select a Subject</option>
              {subjects.map(sub => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.subject_name} - ({sub.program_name}, {sub.department_name}, Sem {sub.semester})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent bg-white"
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
          <div className="text-sm text-blue-600">Attendance Rate</div>
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
          onClick={() => loadStudents().then(loadAttendance)}
          disabled={loading || !selectedSubject}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 flex items-center space-x-3">
          <div>
            <p className="text-sm font-medium">{error}</p>
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
              <tr key={student.student_id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.roll_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm mr-4">
                      {student.name.charAt(0)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    {Object.values(ATTENDANCE_STATUS).map(status => (
                      <label
                        key={status}
                        className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 ${
                          attendance[student.student_id] === status
                            ? getStatusColor(status)
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`attendance-${student.student_id}`}
                          value={status}
                          checked={attendance[student.student_id] === status}
                          onChange={() => handleAttendanceChange(student.student_id, status)}
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
          <div className="text-gray-500">
            {selectedSubject ? 'No students found for this subject.' : 'Please select a subject to begin.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;