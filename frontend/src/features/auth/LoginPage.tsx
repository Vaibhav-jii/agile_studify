import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Sparkles, UserPlus, LogIn, GraduationCap, BookOpenCheck } from 'lucide-react';
import { loginUser, registerUser } from '../../services/api';
import { useAuth, User } from '../../context/AuthContext';
import { useToast } from '../../components/feedback/Toast';

interface LoginPageProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'signup';
type RoleOption = 'student' | 'teacher';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<RoleOption>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const response = await loginUser(email, password, role);
        const sessionUser: User = {
          id: response.id,
          email: response.email,
          role: response.role as User['role'],
          full_name: response.full_name
        };
        login(sessionUser);
        onLogin();
        showToast('Login successful!', 'success');
      } else {
        // Register
        if (!fullName.trim()) {
          showToast('Please enter your full name.', 'error');
          setIsLoading(false);
          return;
        }
        await registerUser(email, password, role, fullName);
        showToast('Account created! Logging you in…', 'success');

        // Auto-login after registration
        const response = await loginUser(email, password, role);
        const sessionUser: User = {
          id: response.id,
          email: response.email,
          role: response.role as User['role'],
          full_name: response.full_name
        };
        login(sessionUser);
        onLogin();
      }
    } catch (error: any) {
      showToast(error.message || (mode === 'login' ? 'Login failed.' : 'Registration failed.'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const inputClasses = `
    w-full px-4 py-3 rounded-xl
    bg-white/[0.04] border border-white/15
    backdrop-blur-xl
    text-white text-sm placeholder:text-white/30
    focus:bg-white/[0.08] focus:border-[#9B7CFF]/50 focus:ring-2 focus:ring-[#9B7CFF]/20
    hover:bg-white/[0.06] hover:border-white/25
    shadow-[0_4px_24px_rgba(0,0,0,0.3)]
    transition-all duration-300
    outline-none
  `;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-Screen Spline 3D Animation */}
      <div className="fixed inset-0 w-full h-full z-0">
        <iframe
          src="https://my.spline.design/animatedlightdesktop-q3VkMLsfCZi7SQXbWNIgqvIe/"
          className="w-full h-full border-0"
          title="STUDIFY 3D Animation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="eager"
          style={{
            pointerEvents: 'auto',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        />
      </div>

      {/* Login / Signup Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 pt-24 sm:pt-32 pointer-events-none">
        <div className="w-full max-w-[420px] animate-in fade-in duration-1000 pointer-events-auto">
          {/* Logo */}
          <div className="text-center mb-8 sm:mb-10 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Sparkles className="text-[#9B7CFF] drop-shadow-[0_0_12px_rgba(155,124,255,0.8)]" size={28} />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#9B7CFF] to-[#FFABE1] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(155,124,255,0.5)]">
                STUDIFY
              </h1>
            </div>
            <p className="text-white/80 text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Smart study, simplified.
            </p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6 sm:mb-8 animate-in slide-in-from-top-4 duration-700" style={{ animationDelay: '100ms' }}>
            <div className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-black/30 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                {mode === 'login' ? 'Continue your learning journey' : 'Join the smarter way to study'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
            {/* Full Name — only for signup */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-white/90 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] ml-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className={inputClasses}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-white/90 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] ml-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={inputClasses}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-white/90 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={`${inputClasses} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90 transition-colors duration-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Selector — shown on BOTH login and signup */}
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] ml-1">
                {mode === 'login' ? 'I am a' : 'I want to join as'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    border backdrop-blur-xl
                    text-sm font-semibold
                    transition-all duration-300
                    ${role === 'student'
                      ? 'bg-[#9B7CFF]/20 border-[#9B7CFF]/60 text-white shadow-[0_0_20px_rgba(155,124,255,0.3)]'
                      : 'bg-white/[0.04] border-white/15 text-white/60 hover:bg-white/[0.08] hover:border-white/25'
                    }
                  `}
                >
                  <GraduationCap size={18} />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                    border backdrop-blur-xl
                    text-sm font-semibold
                    transition-all duration-300
                    ${role === 'teacher'
                      ? 'bg-[#FFABE1]/20 border-[#FFABE1]/60 text-white shadow-[0_0_20px_rgba(255,171,225,0.3)]'
                      : 'bg-white/[0.04] border-white/15 text-white/60 hover:bg-white/[0.08] hover:border-white/25'
                    }
                  `}
                >
                  <BookOpenCheck size={18} />
                  Teacher
                </button>
              </div>
            </div>

            {/* Forgot Password (login only) */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs font-medium text-white/60 hover:text-[#9B7CFF] transition-colors drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full px-6 py-3.5 rounded-xl
                bg-gradient-to-r from-[#9B7CFF] via-[#8B5CF6] to-[#FFABE1]
                text-white font-bold text-sm
                flex items-center justify-center gap-2
                hover:shadow-[0_0_40px_rgba(155,124,255,0.8),0_0_80px_rgba(255,171,225,0.4)]
                hover:scale-[1.03]
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                shadow-[0_8px_32px_rgba(155,124,255,0.4)]
                transition-all duration-300
                relative overflow-hidden
                group
              "
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Logging in…' : 'Creating account…'}</span>
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}

              {/* Shimmer Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </button>

            {/* Toggle between Login / Signup */}
            <div className="text-center pt-3">
              <p className="text-xs text-white/60 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                {mode === 'login' ? (
                  <>New here?{' '}
                    <button type="button" onClick={toggleMode} className="text-[#5AC8FA] font-semibold hover:text-[#FFABE1] transition-colors">
                      Create account
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={toggleMode} className="text-[#5AC8FA] font-semibold hover:text-[#FFABE1] transition-colors">
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-white/10 animate-in fade-in duration-1000" style={{ animationDelay: '400ms' }}>
            <p className="text-xs text-white/40 text-center leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              By continuing, you agree to our{' '}
              <span className="text-white/60 hover:text-white/90 cursor-pointer transition-colors">Terms of Service</span> and{' '}
              <span className="text-white/60 hover:text-white/90 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}