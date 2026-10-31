import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Lock, 
  Mail, 
  User, 
  Check, 
  X, 
  AlertCircle 
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
  const [role, setRole] = useState('customer');
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

    const res = await register(name, email, password, role);
    if (res.success) {
      announce(`Account created for ${name}`);
      navigate('/');
    } else {
      setErrors(res.errors || ['Registration failed.']);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-3">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Create an Account
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Join Brightloop Subscription Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errors.length > 0 && (
              <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
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
              <label htmlFor="reg-name" className="block font-bold text-slate-700 mb-1">
                Full Name / Organization *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Rahul Verma / Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block font-bold text-slate-700 mb-1">
                Official Email Address (Unique) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="rahul@acmecorp.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-role" className="block font-bold text-slate-700 mb-1">
                Account Persona
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="customer">Customer (Manage own subscriptions & invoices)</option>
                <option value="internal_staff">Internal Staff (Handle day-to-day operations)</option>
                <option value="admin">Administrator (Full system control)</option>
              </select>
            </div>

            <div>
              <label htmlFor="reg-pwd" className="block font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-pwd"
                  type="password"
                  required
                  placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              {/* Accessible Live Requirement Checklist */}
              <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[11px]" aria-live="polite">
                <p className="font-bold text-slate-600 mb-1.5">Password Complexity Rules:</p>
                <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>More than 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least one special character (!@#$%^...)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 font-bold rounded-lg text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors text-xs"
            >
              Complete Registration
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-sky-600 hover:text-sky-700 underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

