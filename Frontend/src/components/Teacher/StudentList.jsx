import React, { useState, useEffect } from 'react';
import { Filter, Users, Book, Building, GraduationCap } from 'lucide-react'; // Added new icons
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../contexts/AuthContext';

const StudentList = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(''); // Default to empty
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Load subjects (for the dropdown)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectData = await teacherService.getTeacherSubjects(user.teacher_id); 
        setSubjects(subjectData);
        setSelectedSubject(''); // Start with no subject selected
      } catch (err) {
        setError('Failed to load classes.');
      }
    };
    
    if (user?.teacher_id) {
      loadSubjects();
    }
    
  }, [user?.teacher_id]);

  // 2. Load students (when selectedSubject changes)
  useEffect(() => {
    // If no subject is selected, clear the student list and stop.
    if (!selectedSubject) {
      setStudents([]);
      return;
    }
    
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');
        // This service will now return:
        // [{ student_id, roll_number, name, email, semester, program_name, department_name }, ...]
        const studentData = await teacherService.getStudentsBySubject(selectedSubject);
        setStudents(studentData);
      } catch (err) {
        setError('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();

  }, [selectedSubject]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Student List</h2>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

      {/* Student Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* --- UPDATED COLUMNS --- */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center p-4 text-gray-500">Loading students...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="text-center p-4 text-red-500">{error}</td></tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  {selectedSubject ? 'No students found for this subject.' : 'Please select a subject to see the student list.'}
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  {/* --- UPDATED ROW DATA --- */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm mr-4 flex-shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.roll_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                      {student.program_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      {student.department_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <Book className="h-4 w-4 text-gray-400 mr-2" />
                      {student.semester}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentList;