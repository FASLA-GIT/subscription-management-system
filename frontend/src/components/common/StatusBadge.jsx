import React from 'react';
import { 
  FileEdit, 
  FileText, 
  CheckCircle2, 
  CheckCircle, 
  PauseCircle, 
  XCircle, 
  BadgeCheck, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  const normStatus = (status || '').toLowerCase().trim();

  const configs = {
    draft: {
      label: 'Draft',
      icon: FileEdit,
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      ariaLabel: 'Status: Draft',
    },
    quotation: {
      label: 'Quotation',
      icon: FileText,
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      ariaLabel: 'Status: Quotation',
    },
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      bg: 'bg-[#EAF3FF] text-[#1677F8] border-[#1677F8]/25',
      ariaLabel: 'Status: Confirmed',
    },
    active: {
      label: 'Active',
      icon: CheckCircle,
      bg: 'bg-emerald-50 text-[#059669] border-emerald-200 font-semibold',
      ariaLabel: 'Status: Active',
    },
    paused: {
      label: 'Paused',
      icon: PauseCircle,
      bg: 'bg-amber-50 text-[#D97706] border-amber-200',
      ariaLabel: 'Status: Paused',
    },
    closed: {
      label: 'Closed',
      icon: XCircle,
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      ariaLabel: 'Status: Closed',
    },
    paid: {
      label: 'Paid',
      icon: BadgeCheck,
      bg: 'bg-emerald-50 text-[#059669] border-emerald-200 font-semibold',
      ariaLabel: 'Payment Status: Fully Paid',
    },
    'partially paid': {
      label: 'Partially Paid',
      icon: Clock,
      bg: 'bg-amber-50 text-[#D97706] border-amber-200',
      ariaLabel: 'Payment Status: Partially Paid',
    },
    overdue: {
      label: 'Overdue',
      icon: AlertTriangle,
      bg: 'bg-rose-50 text-[#DC2626] border-rose-200 font-semibold',
      ariaLabel: 'Payment Status: Overdue',
    },
  };

  const conf = configs[normStatus] || {
    label: status || 'Unknown',
    icon: FileText,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    ariaLabel: `Status: ${status}`,
  };

  const Icon = conf.icon;

  return (
    <span
      role="status"
      aria-label={conf.ariaLabel}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border font-medium ${conf.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{conf.label}</span>
    </span>
  );
}
