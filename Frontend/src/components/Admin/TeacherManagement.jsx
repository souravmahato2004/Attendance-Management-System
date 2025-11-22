import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Lock, Save, X, Hash, Building2, BookOpen } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const { success, eror } = useToast();
  const [searchTerm, setSearchTerm] = useState('');


  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    teacherId: '',
    name: '',
    email: '',
    password: '',
    departmentId: '',
    subjectIds: []
  });

  useEffect(() => {
    loadTeachers();
    loadDepartments();
    loadSubjects();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTeachers();
      setTeachers(data);
    } catch (error) {
      eror('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await adminService.getDepartments();
      setDepartments(data);
    } catch (error) {
      eror('Failed to load departments');
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await adminService.getAllSubjects();
      setSubjects(data);
    } catch (error) {
      eror('Failed to load subjects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectsChange = (e) => {
  const { value, checked } = e.target;
  const id = Number(value);

  setFormData((prev) => {
    let updatedSubjects;

    if (checked) {
      updatedSubjects = prev.subjectIds.includes(id)
        ? prev.subjectIds
        : [...prev.subjectIds, id];
    } else {
      updatedSubjects = prev.subjectIds.filter((sid) => sid !== id);
    }

    return { ...prev, subjectIds: updatedSubjects };
  });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await adminService.updateTeacher(editingTeacher.teacher_id, formData);
        success('Teacher updated successfully');
        setEditingTeacher(null);
      } else {
        await adminService.addTeacherWithSubject(formData);
        success('Teacher added successfully');
      }
      setShowAddForm(false);
      setFormData({ teacherId: '', name: '', email: '', password: '', departmentId: '', subjectIds: [] });
      loadTeachers();
    } catch (error) {
      eror(error.message || 'Failed to save teacher');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      teacherId: teacher.teacher_id || '',
      name: teacher.name || '',
      email: teacher.email || '',
      password: '',
      departmentId: teacher.department_id || '',
      subjectIds: (teacher.subjects || []).map(subject => subject.subject_id)
    });
    setShowAddForm(true);
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await adminService.deleteTeacher(teacherId);
        success('Teacher deleted successfully');
        loadTeachers();
      } catch (error) {
        eror('Failed to delete teacher');
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTeacher(null);
    setFormData({ teacherId: '', name: '', email: '', password: '', departmentId: '', subjectIds: [] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
          <p className="text-gray-600">Manage teachers, their departments, and assigned subjects</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Teacher</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
                    placeholder="Enter teacher ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
                    placeholder="Enter teacher name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {!editingTeacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent"
                  >
                    <option value="">Select a department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Subjects *
                </label>
                <div className="md:col-span-2">

                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-transparent mb-2"
                    />

                    <div className="border border-gray-300 rounded-lg h-64 overflow-y-auto p-2">
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                          <label
                            key={subject.id}
                            className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded-md cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={subject.id}
                              checked={formData.subjectIds.includes(subject.id)}
                              onChange={handleSubjectsChange}
                              className="h-4 w-4 text-green-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{subject.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No subjects found
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.subjectIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.subjectIds.map((id) => {
                        const subject = subjects.find((s) => s.id === id);
                        return (
                          <span
                            key={id}
                            className="flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                          >
                            {subject?.name}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  subjectIds: prev.subjectIds.filter((sid) => sid !== id),
                                }))
                              }
                              className="hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingTeacher ? 'Update' : 'Add'} Teacher</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Teachers List</h3>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map(teacher => (
                  <tr key={teacher.teacher_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{teacher.teacher_id || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{teacher.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {departments.find(d => d.id === teacher.department_id)?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        <ul>
                          {teacher.subjects.map((subject) => (
                            <li key={subject.subject_id}>
                              {subject.subject_name}
                            </li>
                          ))}
                        </ul>) : (<em>No subjects assigned</em>)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(teacher)} className="text-green-600 hover:text-green-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(teacher.teacher_id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
