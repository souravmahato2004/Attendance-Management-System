import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Save, X, Search } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

const SubjectManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments] = useState(['CSE', 'ECE', 'Mechanical', 'Civil', 'EEE', 'IT', 'Chemical', 'Aerospace']);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [currentSubjects, setCurrentSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProgram && selectedDepartment && selectedSemester) {
      loadSubjectsForProgram();
    }
  }, [selectedProgram, selectedDepartment, selectedSemester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programsData, subjectsData] = await Promise.all([
        adminService.getProgramsAndSemesters(),
        adminService.getAllSubjects()
      ]);
      
      setPrograms(programsData.programs);
      setSemesters(programsData.semesters);
      setAllSubjects(subjectsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectsForProgram = async () => {
    try {
      const subjects = await adminService.getSubjectsForProgram(selectedProgram, selectedSemester, selectedDepartment);
      setCurrentSubjects(subjects);
    } catch (error) {
      showToast('Failed to load subjects', 'error');
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) {
      showToast('Please enter a subject name', 'error');
      return;
    }

    if (currentSubjects.includes(newSubject)) {
      showToast('Subject already exists', 'error');
      return;
    }

    try {
      await adminService.addSubjectToProgram(selectedProgram, selectedSemester, newSubject, selectedDepartment);
      setNewSubject('');
      loadSubjectsForProgram();
      showToast('Subject added successfully', 'success');
    } catch (error) {
      showToast('Failed to add subject', 'error');
    }
  };

  const handleRemoveSubject = async (subject) => {
    if (window.confirm(`Are you sure you want to remove "${subject}" from this program-department-semester?`)) {
      try {
        await adminService.removeSubjectFromProgram(selectedProgram, selectedSemester, subject, selectedDepartment);
        loadSubjectsForProgram();
        showToast('Subject removed successfully', 'success');
      } catch (error) {
        showToast('Failed to remove subject', 'error');
      }
    }
  };

  const filteredSubjects = allSubjects.filter(subject =>
    subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program
            </label>
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
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
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
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
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

      {selectedProgram && selectedDepartment && selectedSemester && (
        <>
          {/* Current Subjects */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Subjects for {selectedProgram} - {selectedDepartment} - {selectedSemester}
              </h3>
              <span className="text-sm text-gray-500">
                {currentSubjects.length} subjects
              </span>
            </div>

            {currentSubjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No subjects assigned to this program-semester</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSubjects.map(subject => (
                  <div
                    key={subject}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <span className="text-sm font-medium text-gray-900">{subject}</span>
                    <button
                      onClick={() => handleRemoveSubject(subject)}
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
            
            {/* Search existing subjects */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search existing subjects
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

            {/* Available subjects */}
            {searchTerm && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Available subjects:</p>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredSubjects.map(subject => (
                    <button
                      key={subject}
                      onClick={() => setNewSubject(subject)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      {subject}
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
                  placeholder="Enter subject name"
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

      {/* All Subjects Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Available Subjects</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {allSubjects.map(subject => (
            <div
              key={subject}
              className="p-2 bg-gray-50 rounded-lg text-sm text-gray-700 text-center"
            >
              {subject}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;
