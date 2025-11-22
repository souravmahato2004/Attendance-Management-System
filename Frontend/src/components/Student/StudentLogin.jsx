import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ShieldUser , Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { studentService } from '../../services/studentService'

const StudentLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { eror } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await studentService.login(credentials)
      await login(response.user)
      navigate('/student/dashboard')
    } catch (err) {
      eror(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="outfit min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-white to-pink-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="hidden flex-none w-3/5 h-114 bg-cover bg-center bg-no-repeat md:flex" style={{backgroundImage: "url('https://placement.nitsikkim.ac.in/images/about/campus.png')"}}></div>
      <div className="max-w-md space-y-8 md:mr-36">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-800 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <ShieldUser  className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
            Student Portal
          </h2>
          <p className="text-sm text-gray-600">
            Access your attendance dashboard
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input id="email" name="email" type="email" required
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-1 sm:text-sm transition-all duration-200"
                  placeholder="Email address"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-1 sm:text-sm transition-all duration-200 pr-12"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 focus:outline-none transition-all duration-300 ease-in-out"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : ('Login')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't Have an Account ?
                </span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <Link
                to="/student/signup"
                className="text-sm text-red-800 hover:text-red-500 font-medium transition-colors duration-200"
              >
                Create a new account
              </Link>
            </div>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Other portals
                  </span>
                </div>
              </div>

              <div className="mt-2 flex justify-center space-x-4">
                <Link
                  to="/admin/login"
                  className="text-sm text-green-600 hover:text-green-500 font-medium transition-colors duration-200">
                  Admin Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/teacher/login"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                >
                  Teacher Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentLogin