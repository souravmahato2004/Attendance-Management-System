import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, User, Mail, Lock, Hash, GraduationCap, Eye, EyeOff, Calendar } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { studentService } from '../../services/studentService';
import { validateEmail, validatePassword } from '../../utils/helpers';
import { useToast } from '../../contexts/ToastContext';

const StudentSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    program: '',
    department: '',
    semester: ''
  });
  const { programs, semesters, departments, subjects } = useApp();
  const { getprograms, getsemesters, getdepartments, getSubjects } = useApp();
  const [isLoadingSubjects, setisLoadingSubjects] = useState(false);

  useEffect(() => {
    getprograms();
    getsemesters();
    getdepartments();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (formData.program && formData.department && formData.semester) {
        const semesterNumber = formData.semester.split(' ')[1];
        setisLoadingSubjects(true);
        getSubjects(formData.program, formData.department, semesterNumber);
        setisLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [formData.program, formData.department, formData.semester]);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { success, eror } = useToast();

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (value.length < 3) error = 'Name must be at least 3 characters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!validateEmail(value)) error = 'Please enter a valid email';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (!validatePassword(value)) error = 'Password must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== formData.password) error = 'Passwords do not match';
        break;
      case 'rollNumber':
        if (!value) error = 'Roll number is required';
        break;
      case 'program':
        if (!value) error = 'Please select a program';
        break;
      case 'semester':
        if (!value) error = 'Please select a semester';
        break;
      case 'department':
        if (!value) error = 'Please select a department';
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await studentService.signup(formData);
      success('Account created successfully! Please sign in.');
      navigate('/student/login');
    } catch (err) {
      eror(err.message || 'Signup failed. The email or roll number might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Base input styles for reuse
  const baseInputStyles = "appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm transition-shadow duration-200";
  const errorInputStyles = "border-red-500 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="outfit min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-white to-pink-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-800 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Join Student Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Create your account to track attendance</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit}>
            
            {/* Form Fields */}
            <div className='grid grid-cols-2 space-x-4 space-y-4'>
              {[{name: 'name', placeholder: 'Full Name', type: 'text', icon: User}, {name: 'email', placeholder: 'Email Address', type: 'email', icon: Mail}, {name: 'rollNumber', placeholder: 'Roll Number', type: 'text', icon: Hash}].map(field => (
              <div key={field.name}>
                <label htmlFor={field.name} className="sr-only">{field.placeholder}</label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    required
                    className={`${baseInputStyles} ${fieldErrors[field.name] ? errorInputStyles : ''}`}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                  />
                </div>
                {fieldErrors[field.name] && <p className="mt-1 text-xs text-red-600">{fieldErrors[field.name]}</p>}
              </div>
            ))}

            <div>
              <label htmlFor="program" className="sr-only">Program</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select id="program" name="program" required className={`${baseInputStyles} ${fieldErrors.program ? errorInputStyles : ''}`} value={formData.program} onChange={handleChange} onBlur={handleBlur} disabled={loading}>
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {fieldErrors.program && <p className="mt-1 text-xs text-red-600">{fieldErrors.program}</p>}
            </div>

            <div>
              <label htmlFor="department" className="sr-only">Department</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select id="department" name="department" required className={`${baseInputStyles} ${fieldErrors.department ? errorInputStyles : ''}`} value={formData.department} onChange={handleChange} onBlur={handleBlur} disabled={loading}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {fieldErrors.department && <p className="mt-1 text-xs text-red-600">{fieldErrors.department}</p>}
            </div>

            <div>
              <label htmlFor="semester" className="sr-only">Semester</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select id="semester" name="semester" required className={`${baseInputStyles} ${fieldErrors.semester ? errorInputStyles : ''}`} value={formData.semester} onChange={handleChange} onBlur={handleBlur} disabled={loading}>
                  <option value="">Select Semester</option>
                  {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                </select>
              </div>
              {fieldErrors.semester && <p className="mt-1 text-xs text-red-600">{fieldErrors.semester}</p>}
            </div>

          {formData.program && formData.department && formData.semester && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 mt-4 col-span-full">
              <p className="text-sm text-red-700 font-medium mb-2">
                Subjects for {formData.program} - {formData.department} - {formData.semester}:
              </p>
              
              {isLoadingSubjects && (
                <p className="text-sm text-red-500">Loading subjects...</p>
              )}

              {!isLoadingSubjects && subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {subjects.map(subject => (
                    <span key={subject.subject_id} className="px-2 py-1 bg-white border border-red-200 rounded text-xs text-red-700">
                      {subject.subject_name}
                    </span>
                  ))}
                </div>
              )}
              {!isLoadingSubjects && subjects.length === 0 && (
                <p className="text-sm text-red-500">No subjects found for this selection.</p>
              )}
            </div>
          )}

            {[{name: 'password', placeholder: 'Password', show: showPassword, setShow: setShowPassword}, {name: 'confirmPassword', placeholder: 'Confirm Password', show: showConfirmPassword, setShow: setShowConfirmPassword}].map(field => (
              <div key={field.name}>
                <label htmlFor={field.name} className="sr-only">{field.placeholder}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.show ? 'text' : 'password'}
                    required
                    className={`${baseInputStyles} pr-12 ${fieldErrors[field.name] ? errorInputStyles : ''}`}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                  />
                  <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10" onClick={() => field.setShow(!field.show)}>
                    {field.show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors[field.name] && <p className="mt-1 text-xs text-red-600">{fieldErrors[field.name]}</p>}
              </div>
            ))}
            </div>
            
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-800 focus disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/student/login" className="text-sm text-red-800 hover:text-red-600 font-medium transition-colors duration-200">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSignup;