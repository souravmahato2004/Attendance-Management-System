import { useState, useEffect, useMemo } from 'react';
import { BarChart, Calendar, Filter, Percent, Check, X, Clock } from 'lucide-react';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const AttendanceReports = () => {
  const { user } = useAuth();
  const { eror } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const getLocalDate = () => {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
    const day = todayDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today);
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectData = await teacherService.getTeacherSubjects(user.teacher_id); 
        setSubjects(subjectData);
        setSelectedSubject('');
      } catch (err) {
        console.error("Failed to load subjects", err);
        setError("Failed to load subjects.");
      }
    };
    
    if (user?.teacher_id) {
      loadSubjects();
    }
  }, [user?.teacher_id]);

  const handleGenerateReport = async () => {
    if (!selectedSubject || !startDate || !endDate) {
      eror("Please select a subject, start date, and end date.");
      return;
    }

    setLoading(true);
    setError('');
    setReportData([]);
    try {
      const data = await teacherService.getAttendanceReport(selectedSubject, startDate, endDate);
      setReportData(data);
    } catch (err) {
      setError(err.message);
      eror(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePercentage = (present, late, total) => {
    if (total === 0) return 0;
    const attended = present + late; 
    return Math.round((attended / total) * 100);
  };

  const reportSummary = useMemo(() => {
    return reportData.reduce((acc, student) => {
      acc.total_classes += parseInt(student.total_classes, 10);
      acc.total_present += parseInt(student.total_present, 10);
      acc.total_absent += parseInt(student.total_absent, 10);
      acc.total_late += parseInt(student.total_late, 10);
      return acc;
    }, { total_classes: 0, total_present: 0, total_absent: 0, total_late: 0 });
  }, [reportData]);
  
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
      </div>
      
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent bg-white"
            >
              <option value="">Select a subject</option>
              {subjects.map(sub => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.subject_name} ({sub.program_name} {sub.department_name} Sem {sub.semester})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={handleStartDateChange} // Use the new handler
              max={today} // Prevents selecting future dates
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        
        {/* End Date */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="flex items-end">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <BarChart className="h-4 w-4" />
            )}
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Report Display Table (No changes below this line) */}
      <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
        {loading && (
          <div className="text-center py-12 text-gray-500">
             <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto"></div>
             <p className="mt-4">Loading report...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 text-red-500">
             <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && reportData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Please select a subject and date range to generate a report.</p>
          </div>
        )}

        {!loading && !error && reportData.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600 mr-1"/> Present
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <X className="h-4 w-4 text-red-600 mr-1"/> Absent
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                   <div className="flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600 mr-1"/> Late
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <Percent className="h-4 w-4 text-blue-600 mr-1"/> Attendance
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map(student => {
                const total_classes = parseInt(student.total_classes, 10);
                const total_present = parseInt(student.total_present, 10);
                const total_absent = parseInt(student.total_absent, 10);
                const total_late = parseInt(student.total_late, 10);
                const percentage = calculatePercentage(total_present, total_late, total_classes);
                
                return (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.roll_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">{total_present}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center font-medium">{total_absent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 text-center font-medium">{total_late}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">{total_classes}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="font-bold text-gray-900">
                <td colSpan="2" className="px-6 py-3 text-right text-sm">Class Totals:</td>
                <td className="px-6 py-3 text-center text-sm">{reportSummary.total_present}</td>
                <td className="px-6 py-3 text-center text-sm">{reportSummary.total_absent}</td>
                <td className="px-6 py-3 text-center text-sm">{reportSummary.total_late}</td>
                <td className="px-6 py-3 text-center text-sm">{reportSummary.total_classes}</td>
                <td className="px-6 py-3 text-center text-sm font-bold">
                  {calculatePercentage(reportSummary.total_present, reportSummary.total_late, reportSummary.total_classes)}%
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;