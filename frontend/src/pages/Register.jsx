import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  Lock, 
  Mail, 
  User, 
  Building2,
  Phone,
  Check, 
  X, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  KeyRound
} from 'lucide-react';
import { useAuth, validatePassword } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Register() {
  const { register } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [staffKey, setStaffKey] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Password Criteria Checkers
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors = [];

    if (!name.trim()) validationErrors.push('Representative name is required.');
    if (!email.trim()) validationErrors.push('Valid business email is required.');

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      validationErrors.push(...passCheck.errors);
    }

    if (password !== confirmPassword) {
      validationErrors.push('Password confirmation does not match password.');
    }

    if (role === 'internal_staff' && !staffKey.trim()) {
      validationErrors.push('Staff Authorization Key is required for internal staff accounts.');
    }

    if (!agreeTerms) {
      validationErrors.push('You must agree to the Terms of Service & Privacy Policy.');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name,
        company: company || name,
        email,
        phone,
        password,
        role,
        staffKey,
      });

      if (res.success) {
        announce(`Account registered successfully for ${res.user.name}`);
        navigate('/app');
      } else {
        setErrors(res.errors || ['Registration failed. Please check entries.']);
      }
    } catch (err) {
      setErrors(['Unable to complete registration. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#1677F8] selection:text-white">
      {/* Back to Home Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0B1426] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to BRIGHTLOOP SMS Portal</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
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
              Create New Organization Account
            </h1>
            <p className="text-xs text-[#64748B]">
              Enter organization details to set up your subscription billing portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errors.length > 0 && (
              <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>Please correct the following errors:</span>
                </div>
                <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Account Type Selection */}
            <div>
              <label className="block font-bold text-[#111D35] mb-1.5">
                Select Account Classification *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'customer'
                      ? 'border-[#1677F8] bg-[#EAF3FF]/60 ring-1 ring-[#1677F8]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-[#111D35]">Customer Subscriber</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Commercial client subscribing to software plans</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('internal_staff')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'internal_staff'
                      ? 'border-[#1677F8] bg-[#EAF3FF]/60 ring-1 ring-[#1677F8]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-[#111D35]">Internal Staff Member</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Requires authorized company activation key</p>
                </button>
              </div>
            </div>

            {/* Staff Authorization Key (Conditional) */}
            {role === 'internal_staff' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-staffkey" className="block font-bold text-amber-900">
                    Staff Authorization Passcode *
                  </label>
                  <span className="text-[10px] text-amber-700 font-mono">
                    Demo key: <span className="font-bold">STAFF-BRIGHT-2026</span>
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-staffkey"
                    type="text"
                    required={role === 'internal_staff'}
                    value={staffKey}
                    onChange={(e) => setStaffKey(e.target.value)}
                    placeholder="Enter STAFF-BRIGHT-2026"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-amber-300 rounded-lg text-amber-950 font-mono focus-visible:ring-2 focus-visible:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 2-column fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-name" className="block font-bold text-[#111D35] mb-1">
                  Representative Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-company" className="block font-bold text-[#111D35] mb-1">
                  Organization / Company Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-company"
                    type="text"
                    placeholder="e.g. Acme Technologies Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-email" className="block font-bold text-[#111D35] mb-1">
                  Official Business Email (Unique) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone" className="block font-bold text-[#111D35] mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block font-bold text-[#111D35] mb-1">
                  Master Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm-password" className="block font-bold text-[#111D35] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Live Password Validation Checklist */}
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Security Requirements (Password Policy)
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Over 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5" />}
                  <span>Special character (!@#$)</span>
                </div>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`pt-1 text-[11px] font-semibold flex items-center gap-1.5 ${isMatch ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {isMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{isMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#1677F8] rounded border-[#CBD5E1] focus-visible:ring-[#1677F8]"
                />
                <span className="text-[11px] text-[#64748B]">
                  I agree to the <strong>Brightloop Enterprise Subscription Agreement</strong>, Data Protection Policy, and recurring payment terms.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 font-bold rounded-xl text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Registering Organization...' : 'Complete Registration & Open Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer link to login */}
          <div className="text-center pt-2 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#64748B]">
              Already have an enterprise account?{' '}
              <Link to="/login" className="font-bold text-[#1677F8] hover:underline">
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
