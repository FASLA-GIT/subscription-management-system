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
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      ariaLabel: 'Status: Draft',
    },
    quotation: {
      label: 'Quotation',
      icon: FileText,
      bg: 'bg-purple-100 text-purple-900 border-purple-300',
      ariaLabel: 'Status: Quotation',
    },
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      bg: 'bg-blue-100 text-blue-900 border-blue-300',
      ariaLabel: 'Status: Confirmed',
    },
    active: {
      label: 'Active',
      icon: CheckCircle,
      bg: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-semibold',
      ariaLabel: 'Status: Active',
    },
    paused: {
      label: 'Paused',
      icon: PauseCircle,
      bg: 'bg-amber-100 text-amber-950 border-amber-400',
      ariaLabel: 'Status: Paused',
    },
    closed: {
      label: 'Closed',
      icon: XCircle,
      bg: 'bg-slate-200 text-slate-700 border-slate-400',
      ariaLabel: 'Status: Closed',
    },
    paid: {
      label: 'Paid',
      icon: BadgeCheck,
      bg: 'bg-teal-100 text-teal-950 border-teal-400 font-semibold',
      ariaLabel: 'Payment Status: Fully Paid',
    },
    'partially paid': {
      label: 'Partially Paid',
      icon: Clock,
      bg: 'bg-orange-100 text-orange-950 border-orange-400',
      ariaLabel: 'Payment Status: Partially Paid',
    },
    overdue: {
      label: 'Overdue',
      icon: AlertTriangle,
      bg: 'bg-rose-100 text-rose-950 border-rose-400 font-semibold',
      ariaLabel: 'Payment Status: Overdue',
    },
  };

  const conf = configs[normStatus] || {
    label: status || 'Unknown',
    icon: FileText,
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    ariaLabel: `Status: ${status}`,
  };

  const Icon = conf.icon;

  return (
    <span
      role="status"
      aria-label={conf.ariaLabel}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${conf.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{conf.label}</span>
    </span>
  );
}

