import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import SwitchRoleModal from './SwitchRoleModal';

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const userRole = user?.role || 'customer';
  const hasAccess = allowedRoles.includes(userRole);

  if (hasAccess) {
    return children;
  }

  return (
    <div className="py-12 px-4 max-w-2xl mx-auto text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 px-2.5 py-1 rounded-full bg-amber-100">
          Role-Based Access Control (RBAC)
        </span>
        <h2 className="text-2xl font-black text-[#111D35] tracking-tight">
          Clearance Required
        </h2>
        <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
          Your current account role (<strong>{user?.roleLabel || userRole}</strong>) is restricted from accessing this administrative module. Authorized staff or administrator credentials are required.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm transition-all"
        >
          <KeyRound className="w-4 h-4" />
          <span>Authenticate as Administrator / Staff</span>
        </button>
      </div>

      <SwitchRoleModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
