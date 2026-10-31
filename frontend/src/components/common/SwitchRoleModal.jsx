import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { useAuth, DEFAULT_USERS, DEMO_PASSWORDS } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function SwitchRoleModal({ isOpen, onClose }) {
  const { user, verifyAndSwitchRole } = useAuth();
  const { announce } = useAccessibility();

  const [targetRole, setTargetRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const roles = [
    {
      id: 'admin',
      name: 'System Administrator',
      email: DEFAULT_USERS.admin.email,
      desc: 'Full administrative clearance: products, plans, financial reports & staff provisioning.',
      icon: ShieldCheck,
      color: 'text-[#1677F8] border-[#1677F8] bg-[#EAF3FF]',
      demoPass: DEMO_PASSWORDS['admin@brightloop.com'],
    },
    {
      id: 'staff',
      name: 'Internal Operations Staff',
      email: DEFAULT_USERS.staff.email,
      desc: 'Day-to-day operations: customer support, subscription lifecycle, invoicing & quotations.',
      icon: UserCheck,
      color: 'text-indigo-600 border-indigo-600 bg-indigo-50',
      demoPass: DEMO_PASSWORDS['priya.staff@brightloop.com'],
    },
    {
      id: 'customer',
      name: 'Customer Subscriber',
      email: DEFAULT_USERS.customer.email,
      desc: 'Client portal: view active subscriptions, download invoices & settle payments.',
      icon: Users,
      color: 'text-emerald-600 border-emerald-600 bg-emerald-50',
      demoPass: DEMO_PASSWORDS['rahul@acmecorp.in'],
    },
  ];

  const selectedRoleObj = roles.find(r => r.id === targetRole) || roles[0];

  const handleRoleChange = (roleId) => {
    setTargetRole(roleId);
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password) {
      setError('Password is required to authorize account switch.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyAndSwitchRole(targetRole, selectedRoleObj.email, password);
      if (res.success) {
        setSuccess(`Successfully authorized and switched to ${res.user.roleLabel}.`);
        announce(`Role switched to ${res.user.roleLabel}`);
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 800);
      } else {
        setError(res.error || 'Authentication rejected. Incorrect credentials.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An authentication error occurred. Please check credentials.');
      setIsSubmitting(false);
    }
  };

  const handleUseDemoPass = () => {
    setPassword(selectedRoleObj.demoPass);
    setError('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-role-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B1426] text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-[#1677F8]" />
            </div>
            <div>
              <h2 id="switch-role-title" className="text-sm font-black text-[#111D35] tracking-tight">
                Role Re-Authentication Gate
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Verify credentials before switching account permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1 rounded-lg text-[#64748B] hover:text-[#111D35] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Current Session Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Session</span>
              <p className="font-bold text-slate-900">{user?.name} ({user?.roleLabel || user?.role})</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
              {user?.email}
            </span>
          </div>

          {/* Select Target Account */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#111D35]">
              Select Target Role to Authenticate:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = targetRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#1677F8] bg-[#EAF3FF]/60 shadow-xs ring-1 ring-[#1677F8]'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#1677F8]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-900">{r.name.split(' ')[0]}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{r.email}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Role Description */}
          <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 text-[11px] text-slate-700">
            <strong className="text-slate-900">{selectedRoleObj.name} Clearance:</strong> {selectedRoleObj.desc}
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div role="alert" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-target-email" className="block text-xs font-bold text-[#111D35]">
                  Target Account Email
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Read-Only</span>
              </div>
              <input
                id="auth-target-email"
                type="email"
                readOnly
                value={selectedRoleObj.email}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-target-password" className="block text-xs font-bold text-[#111D35]">
                  Password Verification *
                </label>
                <button
                  type="button"
                  onClick={handleUseDemoPass}
                  className="text-[11px] text-[#1677F8] hover:underline font-medium"
                >
                  Insert Demo Password (<span className="font-mono">{selectedRoleObj.demoPass}</span>)
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-target-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={`Enter password for ${selectedRoleObj.email}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#E2E8F0] rounded-xl text-slate-900 focus-visible:ring-2 focus-visible:ring-[#1677F8] transition-all"
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

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Authorize & Switch Role'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
