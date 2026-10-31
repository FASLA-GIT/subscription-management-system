import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Lock,
  Mail,
  User,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, validatePassword } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Register() {
  const { register } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);

  // Live Password Checklist
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const res = await register(name, email, password);
    if (res.success) {
      announce(`Account created for ${name}`);
      navigate('/app');
    } else {
      setErrors(res.errors || ['Registration failed.']);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#1677F8] selection:text-white">
      {/* Return to Landing Page Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1677F8] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-xl space-y-6 edge-lighting">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1677F8] to-[#0A5CD6] items-center justify-center text-white shadow-lg shadow-[#1677F8]/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs text-[#64748B]">
              Join Brightloop Subscription Management Workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errors.length > 0 && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Please resolve the following:</span>
                </div>
                <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label htmlFor="reg-name" className="block font-bold text-[#111D35] mb-1">
                Full Name / Organization *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Rahul Verma / Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block font-bold text-[#111D35] mb-1">
                Official Email Address (Unique) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="rahul@acmecorp.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                />
              </div>
            </div>

            <p className="text-[11px] text-[#64748B]">Customer accounts are created here. Staff and administrator accounts are provisioned by an administrator.</p>

            <div>
              <label htmlFor="reg-pwd" className="block font-bold text-[#111D35] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="p-1 text-[#64748B] hover:text-[#111D35] absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Accessible Live Requirement Checklist */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#F5F7FB] border border-[#E2E8F0] space-y-1 text-[11px]" aria-live="polite">
                <p className="font-bold text-[#111D35] mb-1.5">Password Complexity Rules:</p>
                <div className={`flex items-center gap-1.5 ${hasLength ? 'text-[#059669] font-bold' : 'text-[#64748B]'}`}>
                  {hasLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>More than 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#059669] font-bold' : 'text-[#64748B]'}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-[#059669] font-bold' : 'text-[#64748B]'}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-[#059669] font-bold' : 'text-[#64748B]'}`}>
                  {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one special character (!@#$%^...)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 font-bold rounded-xl text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98] text-xs"
            >
              Complete Registration
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#64748B] border-t border-[#E2E8F0] pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#1677F8] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

