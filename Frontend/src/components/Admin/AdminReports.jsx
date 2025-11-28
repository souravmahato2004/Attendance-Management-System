import { useState, useEffect } from 'react';
import { Download, Calendar, FileText, TrendingUp, Users, BookOpen, GraduationCap } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

const AdminReports = () => {
  const { success, eror } = useToast(); 
  const [programs, setPrograms] = useState([]);
  // REMOVED: const [semesters, setSemesters] = useState([]); -> Calculated dynamically now
  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [reportData, setReportData] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    program: '',
    department: '',
    semester: ''
  });

  // --- NEW LOGIC START: Calculate semesters based on program ---
  const getSemesterOptions = () => {
    // Find the full program object based on the selected ID
    const program = programs.find(p => String(p.id) === String(reportData.program));
    const programName = program?.name?.toLowerCase() || '';

    let limit = 8; // Default for B.Tech or others
    
    if (programName.includes('m.tech')) {
      limit = 4;
    } else if (programName.includes('phd')) {
      limit = 2;
    }

    // Generate array [1, 2, ... limit]
    return Array.from({ length: limit }, (_, i) => i + 1);
  };

  const semesterOptions = getSemesterOptions();
  // --- NEW LOGIC END ---

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoading(true);
        // Removed getSemesters() from this call
        const [programsData, departmentsData] = await Promise.all([
          adminService.getPrograms(),
          adminService.getDepartments()
        ]);
        
        setPrograms(programsData);
        setDepartments(departmentsData);
        // setSemesters(semestersData); -> Removed

        const currentYear = new Date().getFullYear();
        setYears(Array.from({ length: 5 }, (_, i) => currentYear - i));
        
      } catch (error) {
        eror('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };
    
    loadDropdownData();
  }, [eror]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateReport = async () => {
    if (!reportData.program || !reportData.department || !reportData.semester) {
      eror('Please select program, department, and semester');
      return;
    }

    try {
      setGenerating(true);
      await adminService.generateMonthlyReport(
        parseInt(reportData.month),
        parseInt(reportData.year),
        reportData.program,
        reportData.department,
        reportData.semester
      );
      success('Report generated successfully');
    } catch (error) {
      eror(`Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Report Generation</h2>
        <p className="text-gray-600">Generate monthly attendance reports for programs and semesters</p>
      </div>

      {/* Report Generation Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Attendance Report</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                name="month"
                value={reportData.month}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              name="year"
              value={reportData.year}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Program Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select
              name="program"
              value={reportData.program}
              onChange={(e) => {
                handleInputChange(e);
                // Reset semester when program changes to avoid invalid states (e.g., sem 8 in M.Tech)
                setReportData(prev => ({ ...prev, program: e.target.value, semester: '' }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
            >
              <option value="">Select Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              name="department"
              value={reportData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Selection - UPDATED TO DYNAMIC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              name="semester"
              value={reportData.semester}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
              disabled={!reportData.program} // Disable if no program selected
            >
              <option value="">Select Semester</option>
              {semesterOptions.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={generating || !reportData.program || !reportData.department || !reportData.semester}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{generating ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData.program && reportData.department && reportData.semester && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Period:</span> {monthNames[reportData.month]} {reportData.year}</p>
                  <p><span className="font-medium">Program:</span> {programs.find(p => String(p.id) === String(reportData.program))?.name || '...'}</p>
                  <p><span className="font-medium">Department:</span> {departments.find(d => String(d.id) === String(reportData.department))?.name || '...'}</p>
                  <p><span className="font-medium">Semester:</span> {reportData.semester}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Report Contents</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• Monthly Attendance summary</p>
                  <p>• Overall statistics</p>
                  <p>• Generated in PDF format</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Programs</p>
              <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Available Semesters</p>
              {/* Shows current available semesters based on selection */}
              <p className="text-2xl font-bold text-gray-900">{semesterOptions.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;