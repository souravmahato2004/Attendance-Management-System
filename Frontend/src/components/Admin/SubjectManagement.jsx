import { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Save, X, Search } from 'lucide-react';
// import { useApp } from '../../contexts/AppContext'; // 1. REMOVED useApp
import { adminService } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

const SubjectManagement = () => {
  // 2. State to hold data (as objects)
  const [programs, setPrograms] = useState([]);
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]); // Static list
  const [departments, setDepartments] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // Master list
  
  const [selectedProgram, setSelectedProgram] = useState(''); // Stores Program ID
  const [selectedDepartment, setSelectedDepartment] = useState(''); // Stores Dept ID
  const [selectedSemester, setSelectedSemester] = useState(''); // Stores Semester number

  const [currentSubjects, setCurrentSubjects] = useState([]); // Subjects for selected course
  const [newSubject, setNewSubject] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 3. FIXED typo: eror -> error
  const { success, eror } = useToast();

  // --- Effects ---

  // 4. Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch subjects whenever the selection changes
  useEffect(() => {
    if (selectedProgram && selectedDepartment && selectedSemester) {
      loadSubjectsForCourse();
    } else {
      setCurrentSubjects([]); // Clear list if selection is incomplete
    }
  }, [selectedProgram, selectedDepartment, selectedSemester]);

  // --- Data Fetching Functions ---

  // 5. Fetches all dropdown data from adminService
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [programsData, departmentsData, allSubjectsData] = await Promise.all([
        adminService.getPrograms(),      // Using adminService
        adminService.getDepartments(),   // Using adminService
        adminService.getAllSubjects()    // Using adminService
      ]);
      
      setPrograms(programsData);
      setDepartments(departmentsData);
      setAllSubjects(allSubjectsData);

    } catch (err) {
      eror(`Failed to load initial data: ${err.message}`);
    } finally {
      // 6. FIXED: Set loading to false
      setLoading(false);
    }
  };

  // 7. Fetches subjects for the specific course
  const loadSubjectsForCourse = async () => {
    try {
      const subjects = await adminService.getSubjectsByCourse(
        selectedProgram,
        selectedDepartment,
        selectedSemester
      );
      setCurrentSubjects(subjects); // Expects [{ subject_id, subject_name }]
    } catch (err) {
      eror(`Failed to load subjects: ${err.message}`);
    }
  };

  // --- Event Handlers ---

  // 8. Add a new subject to the selected course
  const handleAddSubject = async () => {
    const subjectName = newSubject.trim();
    if (!subjectName) {
      eror('Please enter a subject name');
      return;
    }

    if (currentSubjects.some(s => s.subject_name.toLowerCase() === subjectName.toLowerCase())) {
      eror('Subject already exists for this course');
      return;
    }

    try {
      const newSubjectData = {
        subject_name: subjectName,
        program_id: selectedProgram,
        department_id: selectedDepartment,
        semester: selectedSemester
      };
      
      // Calls the REAL adminService function
      const addedSubject = await adminService.addSubjectToCourse(newSubjectData);

      // Add to both lists
      setCurrentSubjects(prev => [...prev, addedSubject]);
      setAllSubjects(prev => [...prev, { id: addedSubject.subject_id, name: addedSubject.subject_name }]); 
      
      setNewSubject('');
      setSearchTerm('');
      success('Subject added successfully');

    } catch (err) {
      eror(`Failed to add subject: ${err.message}`);
    }
  };

  // 9. Remove a subject by its unique ID
  const handleRemoveSubject = async (subjectToRemove) => {
    if (window.confirm(`Are you sure you want to remove "${subjectToRemove.subject_name}"?`)) {
      try {
        await adminService.removeSubject(subjectToRemove.subject_id);
        
        // Remove from current list
        setCurrentSubjects(prev => 
          prev.filter(s => s.subject_id !== subjectToRemove.subject_id)
        );
        // Remove from master list
        setAllSubjects(prev => 
          prev.filter(s => s.id !== subjectToRemove.subject_id)
        );
        
        success('Subject removed successfully');
      } catch (err) {
        eror(`Failed to remove subject: ${err.message}`);
      }
    }
  };

  // 10. Filter list of objects
  const filteredSubjects = allSubjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // --- JSX ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
        <p className="text-gray-600">Manage subjects for different programs, departments and semesters</p>
      </div>

      {/* Program, Department and Semester Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Program, Department & Semester</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 11. Program Dropdown (handles objects) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setSelectedDepartment('');
                setSelectedSemester('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </div>

          {/* 12. Department Dropdown (handles objects) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedSemester('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedProgram}
            >
              <option value="">Select a department</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>

          {/* 13. Semester Dropdown (static list) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedProgram || !selectedDepartment}
            >
              <option value="">Select a semester</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* This section only shows after a valid selection */}
      {selectedProgram && selectedDepartment && selectedSemester && (
        <>
          {/* 14. Current Subjects List (handles objects) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Subjects for this Course
              </h3>
              <span className="text-sm text-gray-500">
                {currentSubjects.length} subjects
              </span>
            </div>

            {currentSubjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No subjects assigned to this course</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSubjects.map(subject => (
                  <div
                    key={subject.subject_id} // Use unique ID
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <span className="text-sm font-medium text-gray-900">{subject.subject_name}</span>
                    <button
                      onClick={() => handleRemoveSubject(subject)} // Pass the whole object
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Subject */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Subject</h3>
            
            {/* 15. Search/filter list (handles objects) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search all existing subjects
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subjects..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 16. Search results (handles objects) */}
            {searchTerm && filteredSubjects.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Available subjects:</p>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredSubjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => setNewSubject(subject.name)} // Click to copy name
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add subject form */}
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Enter new subject name to create and add"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAddSubject}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Subject</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 17. All Subjects Overview (handles objects) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Available Subjects</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {allSubjects.map(subject => (
            <div
              key={subject.id}
              className="p-2 bg-gray-50 rounded-lg text-sm text-gray-700 text-center"
            >
              {subject.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;