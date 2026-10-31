import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RefreshCw, 
  Lock, 
  Mail, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  ArrowRight,
  KeyRound
} from 'lucide-react';
import { useAuth, DEFAULT_USERS, DEMO_PASSWORDS } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Login() {
  const { login } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial role from query param or default admin
  const requestedRole = searchParams.get('role');
  const initialUser = (requestedRole && DEFAULT_USERS[requestedRole]) ? DEFAULT_USERS[requestedRole] : DEFAULT_USERS.admin;

  const [email, setEmail] = useState(initialUser.email);
  const [password, setPassword] = useState(initialUser.password || DEMO_PASSWORDS[initialUser.email]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        announce(`Signed in as ${res.user.name}`);
        navigate(res.user.homeRoute || '/app');
      } else {
        setError(res.error || 'Authentication rejected. Please check email and password.');
      }
    } catch (err) {
      setError(err.message || 'Unable to authenticate session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoleCredentials = (roleKey) => {
    const selected = DEFAULT_USERS[roleKey];
    if (selected) {
      setEmail(selected.email);
      setPassword(selected.password || DEMO_PASSWORDS[selected.email]);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#1677F8] selection:text-white">
      {/* Return to Home Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0B1426] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to BRIGHTLOOP SMS Portal</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 border-b border-[#E2E8F0] pb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#0B1426] flex items-center justify-center text-white border border-slate-700 shadow-xs">
                <RefreshCw className="w-4 h-4 text-[#1677F8]" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#0B1426]">
                BRIGHTLOOP <span className="text-[#1677F8]">SMS</span>
              </span>
            </div>
            <h1 className="text-xl font-black text-[#111D35] tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-[#64748B]">
              Authenticate to access subscriptions, invoices, and billing ledgers
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div 
                role="alert" 
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block font-bold text-[#111D35] mb-1">
                Account Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block font-bold text-[#111D35]">
                  Password *
                </label>
                <span className="text-[10px] text-slate-400">
                  Secure credentials required
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white transition-all font-mono"
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 font-bold rounded-xl text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Credential Presets for Hackathon Evaluation */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Evaluation Credential Profiles
              </span>
              <span className="text-[10px] text-slate-400">
                Click to load credentials
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleSelectRoleCredentials('admin')}
                className={`p-2.5 rounded-xl border transition-all ${
                  email === DEFAULT_USERS.admin.email
                    ? 'border-[#1677F8] bg-[#EAF3FF]/70 ring-1 ring-[#1677F8]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D35]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1677F8]" />
                  <span>Admin</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">Admin@123</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleCredentials('staff')}
                className={`p-2.5 rounded-xl border transition-all ${
                  email === DEFAULT_USERS.staff.email
                    ? 'border-[#1677F8] bg-[#EAF3FF]/70 ring-1 ring-[#1677F8]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D35]">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Staff</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">Staff@123</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleCredentials('customer')}
                className={`p-2.5 rounded-xl border transition-all ${
                  email === DEFAULT_USERS.customer.email
                    ? 'border-[#1677F8] bg-[#EAF3FF]/70 ring-1 ring-[#1677F8]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D35]">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">Customer@123</p>
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="text-center pt-2 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#64748B]">
              New organization or customer?{' '}
              <Link to="/register" className="font-bold text-[#1677F8] hover:underline">
                Register New Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
