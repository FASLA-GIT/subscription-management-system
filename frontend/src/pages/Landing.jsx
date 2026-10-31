import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Repeat,
  Receipt,
  CreditCard,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Layers,
  Calendar,
  Lock,
  FileText,
  KeyRound,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { useAuth, DEFAULT_USERS, DEMO_PASSWORDS } from '../context/AuthContext';

const PREVIEW_REVENUE = [
  { month: 'May', rev: 28000 },
  { month: 'Jun', rev: 34500 },
  { month: 'Jul', rev: 41200 },
  { month: 'Aug', rev: 48900 },
  { month: 'Sep', rev: 56400 },
  { month: 'Oct', rev: 67350 },
];

export default function Landing() {
  const navigate = useNavigate();
  const { loginAsRole } = useAuth();

  const handleQuickEnter = (roleKey) => {
    loginAsRole(roleKey);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#1677F8] selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0B1426] flex items-center justify-center text-white border border-slate-700 shadow-xs transition-transform group-hover:scale-105">
              <RefreshCw className="w-4 h-4 text-[#1677F8]" aria-hidden="true" />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-[#0B1426]">
                  BRIGHTLOOP
                </span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-black tracking-widest bg-[#EAF3FF] text-[#1677F8] rounded border border-[#1677F8]/20">
                  SMS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
                Subscription Management System
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#portals" className="hover:text-[#1677F8] transition-colors">
              Access Portals
            </a>
            <a href="#architecture" className="hover:text-[#1677F8] transition-colors">
              Lifecycle Engine
            </a>
            <a href="#invoicing" className="hover:text-[#1677F8] transition-colors">
              Automated Billing
            </a>
            <a href="#compliance" className="hover:text-[#1677F8] transition-colors">
              Security & RBAC
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#1677F8] hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Entering Interface */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-5">
          {/* Enterprise Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FF] border border-[#1677F8]/20 text-[#1677F8] text-[11px] font-bold uppercase tracking-wider">
            <span>Enterprise Recurring Revenue Infrastructure</span>
          </div>

          {/* Title with exact site name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B1426] tracking-tight max-w-4xl mx-auto leading-[1.1]">
            BRIGHTLOOP <span className="text-[#1677F8]">SMS</span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-700 max-w-3xl mx-auto">
            Comprehensive Subscription Management & Automated Recurring Billing System
          </p>

          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate error-prone spreadsheets. Unifies catalog products, multi-variant pricing, contract lifecycle states, automated GST invoice generation, and real-time financial reporting.
          </p>

          {/* Main Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition-all"
            >
              <span>Register New Organization</span>
            </Link>

            <button
              type="button"
              onClick={() => handleQuickEnter('admin')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              <span>Launch Live Workspace</span>
            </button>
          </div>

          {/* 3 Dedicated Role Portals with Sign Access */}
          <div id="portals" className="pt-12 text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Role-Based Gateways
                </span>
                <h2 className="text-xl font-black text-[#0B1426] tracking-tight">
                  Enter Dedicated Portal
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Credentials verified upon entry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Portal */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Client Portal
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Customer Subscriber Portal
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    View contracted subscriptions, inspect itemized tax invoices, submit online payments, and download payment receipts.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-700">{DEFAULT_USERS.customer.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{DEFAULT_USERS.customer.email}</p>
                    <p className="text-slate-400 text-[10px]">Password: <span className="font-mono text-slate-600">{DEMO_PASSWORDS[DEFAULT_USERS.customer.email]}</span></p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to="/login?role=customer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Sign In as Client</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleQuickEnter('customer')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                  >
                    Direct Enter
                  </button>
                </div>
              </div>

              {/* Staff Operations Console */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                      Staff Console
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Operations Staff Workspace
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Day-to-day operations: manage customer directories, issue commercial quotations, execute subscription billing cycles.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-700">{DEFAULT_USERS.staff.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{DEFAULT_USERS.staff.email}</p>
                    <p className="text-slate-400 text-[10px]">Password: <span className="font-mono text-slate-600">{DEMO_PASSWORDS[DEFAULT_USERS.staff.email]}</span></p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to="/login?role=staff"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800"
                  >
                    <span>Sign In as Staff</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleQuickEnter('staff')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                  >
                    Direct Enter
                  </button>
                </div>
              </div>

              {/* Administrator Suite */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#1677F8]/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF3FF] text-[#1677F8] flex items-center justify-center border border-[#1677F8]/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1677F8] bg-[#EAF3FF] px-2 py-0.5 rounded">
                      Full Admin Access
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    System Administrator Suite
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Complete administrative authority: product & plan configuration, discount schedules, financial reports, and workspace settings.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-700">{DEFAULT_USERS.admin.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{DEFAULT_USERS.admin.email}</p>
                    <p className="text-slate-400 text-[10px]">Password: <span className="font-mono text-slate-600">{DEMO_PASSWORDS[DEFAULT_USERS.admin.email]}</span></p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to="/login?role=admin"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1677F8] hover:text-[#0A5CD6]"
                  >
                    <span>Sign In as Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleQuickEnter('admin')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                  >
                    Direct Enter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Workspace Live Preview Panel */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl p-2 bg-[#0B1426] border border-slate-700 shadow-2xl text-left">
            <div className="rounded-xl overflow-hidden bg-white border border-slate-200">
              {/* Window Bar */}
              <div className="h-9 px-4 bg-[#0B1426] flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 font-medium">
                  brightloop-sms.local/app/dashboard
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  SYSTEM ACTIVE
                </span>
              </div>

              {/* Dashboard Snapshot */}
              <div className="p-4 sm:p-6 bg-[#F8FAFC] space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Subscriptions</p>
                    <p className="text-xl font-black text-slate-900 mt-1">24 Active</p>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" /> +14% this month
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monthly Run-Rate</p>
                    <p className="text-xl font-black text-slate-900 mt-1 font-mono">₹67,350.00</p>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> 100% automated
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding Invoices</p>
                    <p className="text-xl font-black text-amber-600 mt-1 font-mono">₹18,680.00</p>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
                      Net 15 terms active
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duplicate Invoicing</p>
                    <p className="text-xl font-black text-[#1677F8] mt-1">0 Duplicates</p>
                    <span className="text-[11px] font-semibold text-[#1677F8] mt-0.5 block">
                      Idempotent billing
                    </span>
                  </div>
                </div>

                {/* Graph preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900">Revenue Velocity Trend</h4>
                      <span className="text-[10px] font-semibold text-[#1677F8] bg-[#EAF3FF] px-2 py-0.5 rounded">
                        Predictive
                      </span>
                    </div>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={PREVIEW_REVENUE} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="heroRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1677F8" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#1677F8" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" fontSize={10} stroke="#94A3B8" tickLine={false} />
                          <YAxis fontSize={10} stroke="#94A3B8" tickLine={false} />
                          <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                          <Area type="monotone" dataKey="rev" stroke="#1677F8" strokeWidth={2} fill="url(#heroRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-900">Upcoming Renewals</h4>
                    <div className="space-y-2 pt-1 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">Acme Technologies</p>
                          <p className="text-[10px] text-slate-500">Enterprise Plan</p>
                        </div>
                        <span className="font-mono font-bold text-[#1677F8]">₹6,041.60</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">Zenith Global</p>
                          <p className="text-[10px] text-slate-500">Cloud Edition</p>
                        </div>
                        <span className="font-mono font-bold text-[#1677F8]">₹28,680.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Lifecycle Engine Section */}
      <section id="architecture" className="py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1677F8] bg-[#EAF3FF] px-2.5 py-1 rounded-full">
              System Specification
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1426] tracking-tight">
              5-Stage Subscription Lifecycle Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              BRIGHTLOOP SMS models formal lifecycle transitions to protect against premature billing or unfulfilled orders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                step: '01',
                title: 'Draft',
                desc: 'Initial line item setup, plan selection, add-on variant assembly, and preliminary pricing.',
                color: 'border-slate-200 bg-slate-50 text-slate-700',
              },
              {
                step: '02',
                title: 'Quotation',
                desc: 'Configurable validity window, formal customer proposal generation with product lines.',
                color: 'border-blue-200 bg-blue-50/60 text-blue-900',
              },
              {
                step: '03',
                title: 'Confirmed',
                desc: 'Client signature or operational acceptance with locked pricing terms and scheduled billing.',
                color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900',
              },
              {
                step: '04',
                title: 'Active',
                desc: 'Automated recurring invoice generation, payment tracking, renewals, pause and early closure.',
                color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
              },
              {
                step: '05',
                title: 'Closed',
                desc: 'Term completion or structured early termination with archival and final ledger settlement.',
                color: 'border-rose-200 bg-rose-50/60 text-rose-900',
              },
            ].map((st) => (
              <div key={st.step} className={`p-4 rounded-xl border ${st.color} space-y-2`}>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Stage {st.step}</span>
                <h3 className="text-sm font-black">{st.title}</h3>
                <p className="text-[11px] leading-relaxed opacity-90">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Automated Invoicing & Product Variants Section */}
      <section id="invoicing" className="py-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1677F8]">
                Core Automation Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B1426] tracking-tight mt-1">
                Engineered for Commercial Precision
              </h2>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1677F8] hover:underline"
            >
              <span>Explore Invoicing Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Multi-tier variant pricing */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B1426]">
                <Layers className="w-4 h-4 text-[#1677F8]" />
                <span>Product Catalog & Variant Pricing</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supports products with configurable add-on variants. Base prices and variant additions are calculated per unit line.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Product: Business Software</span>
                  <span>₹2,000.00</span>
                </div>
                <div className="flex justify-between text-[#1677F8] font-bold">
                  <span>Variant: Odoo Integration</span>
                  <span>+₹560.00</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-slate-900">
                  <span>Final Unit Price</span>
                  <span>₹2,560.00</span>
                </div>
              </div>
            </div>

            {/* Automated recurring billing */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B1426]">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Automated Recurring Invoices</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scheduled background scanning evaluates next billing dates across daily, weekly, monthly, and yearly cycles with tax calculation.
              </p>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Idempotent Billing Safety</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Guarantees that re-running generation does not duplicate invoices for already-billed periods.
                </p>
              </div>
            </div>

            {/* Payment & Audit trail */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B1426]">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Payment Tracking & Reconciliation</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Accepts UPI, Net Banking, and Bank Transfers. Matches transactions with UTR reference codes and tracks partial settlements.
              </p>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs space-y-1 text-indigo-950">
                <p className="font-bold">Multi-Method Settlement Audit</p>
                <p className="text-[11px] text-indigo-800">
                  Full status progression: Unpaid → Partially Paid → Paid → Refunded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Security & RBAC Section */}
      <section id="compliance" className="py-16 bg-[#0B1426] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1677F8] bg-[#EAF3FF]/10 px-2.5 py-1 rounded-full border border-[#1677F8]/30">
              Access Governance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Enterprise Role-Based Access Control
            </h2>
            <p className="text-xs text-slate-400">
              Strict isolation of permissions between internal operations and external subscriber organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#1677F8]" />
                <span>System Administrator</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full authority: product catalog, pricing plans, discount rules, staff provisioning, and audit ledgers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Internal Staff</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Commercial operations: customer management, quotation formulation, billing runs, and lifecycle updates.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Customer Client</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict client boundary: restricted to own subscription lines, invoices, and payment history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-[#070D18] text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0B1426] flex items-center justify-center text-white border border-slate-700">
              <RefreshCw className="w-3.5 h-3.5 text-[#1677F8]" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">BRIGHTLOOP SMS</p>
              <p className="text-[10px] text-slate-500">Subscription Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register Account</Link>
            <Link to="/app" className="hover:text-white transition-colors">Workspace</Link>
          </div>

          <p className="text-[10px] text-slate-500">
            Brightloop Software Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
