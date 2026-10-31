import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Info, 
  Sparkles 
} from 'lucide-react';
import { useAuth, DEFAULT_USERS } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Login() {
  const { login, loginAsRole } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@brightloop.com');
  const [password, setPassword] = useState('Admin@Bright2026!');
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

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        announce(`Signed in as ${res.user.name}`);
        navigate(res.user.homeRoute || '/app');
      }
    } catch (err) {
      setError(err.message || 'Unable to authenticate demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (roleKey) => {
    const user = loginAsRole(roleKey);
    announce(`Demo access granted as ${user.roleLabel}`);
    navigate(user.homeRoute || '/app');
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
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1677F8] to-[#0A5CD6] items-center justify-center text-white shadow-lg shadow-[#1677F8]/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
              Brightloop SubSync
            </h1>
            <p className="text-xs text-[#64748B]">
              Sign in to your unified subscription workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div 
                role="alert" 
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block font-bold text-[#111D35] mb-1">
                Email Address
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block font-bold text-[#111D35]">
                  Password
                </label>
                <span className="text-[11px] text-[#64748B]">
                  Demo: any or predefined
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
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white transition-all"
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
              className="w-full py-2.5 px-4 font-bold rounded-xl text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* 1-Click Demo Mode Access Section */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                ⚡ 1-Click Demo Persona Access
              </span>
              <span className="text-[10px] font-bold bg-[#EAF3FF] text-[#1677F8] px-2 py-0.5 rounded-full">
                Frontend Demo
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin')}
                className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#1677F8]/50 hover:bg-[#EAF3FF]/40 text-left transition-all edge-lighting"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D35]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1677F8]" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">Full system</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('staff')}
                className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#1677F8]/50 hover:bg-[#EAF3FF]/40 text-left transition-all edge-lighting"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D35]">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Staff</span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">Operations</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('customer')}
                className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#1677F8]/50 hover:bg-[#EAF3FF]/40 text-left transition-all edge-lighting"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111D35]">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer</span>
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5 truncate">Self-service</p>
              </button>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] flex items-start gap-2 text-[11px] text-[#64748B]">
              <Info className="w-4 h-4 text-[#1677F8] flex-shrink-0 mt-0.5" />
              <p>
                <strong>Demo Mode:</strong> Role switching and mock auth state are stored non-sensitively in client <code className="font-mono text-[#111D35]">sessionStorage</code>. Real production environments require a trusted backend auth provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
