import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Repeat,
  Receipt,
  CreditCard,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Zap,
  Sparkles,
  Layers,
  Users,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { useAuth } from '../context/AuthContext';

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

  const handleExploreDashboard = () => {
    loginAsRole('admin');
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#111D35] flex flex-col font-sans selection:bg-[#1677F8] selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1677F8] to-[#0A5CD6] flex items-center justify-center text-white shadow-md shadow-[#1677F8]/20 transition-transform group-hover:scale-105">
              <RefreshCw className="w-5 h-5 animate-[spin_12s_linear_infinite]" aria-hidden="true" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#111D35]">
                Brightloop
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider ml-1.5 px-1.5 py-0.5 bg-[#EAF3FF] text-[#1677F8] rounded">
                SubSync
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#64748B]">
            <a href="#features" className="hover:text-[#1677F8] transition-colors">
              Features
            </a>
            <a href="#preview" className="hover:text-[#1677F8] transition-colors">
              Platform Preview
            </a>
            <a href="#solutions" className="hover:text-[#1677F8] transition-colors">
              Solutions
            </a>
            <a href="#about" className="hover:text-[#1677F8] transition-colors">
              About
            </a>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-[#111D35] hover:text-[#1677F8] transition-colors"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={handleExploreDashboard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden bg-gradient-to-b from-white via-[#F5F7FB] to-[#F5F7FB]">
        {/* Subtle Ambient Blue Lighting */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-[#1677F8]/12 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF3FF] border border-[#1677F8]/20 text-[#1677F8] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Enterprise Subscription Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111D35] tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Every Subscription. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1677F8] via-[#0A5CD6] to-[#0B1426]">
              One Intelligent Platform.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto font-normal leading-relaxed">
            Manage subscriptions, billing, invoices, customers, and payments from one unified workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-md shadow-[#1677F8]/25 transition-all active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleExploreDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#111D35] bg-white border border-[#E2E8F0] hover:border-[#1677F8]/40 hover:bg-[#EAF3FF]/40 shadow-xs transition-all edge-lighting"
            >
              <Zap className="w-4 h-4 text-[#1677F8]" />
              <span>Explore Dashboard</span>
            </button>
          </div>

          {/* Interactive Hero Visual Composition */}
          <div className="mt-14 max-w-5xl mx-auto relative rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-[#111D35]/10 to-[#111D35]/5 border border-[#E2E8F0] shadow-2xl backdrop-blur-sm">
            <div className="rounded-xl overflow-hidden bg-white border border-[#E2E8F0]">
              {/* Window Controls Bar */}
              <div className="h-9 px-4 bg-[#0B1426] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 font-medium">
                  app.brightloop.io/dashboard
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  LIVE DEMO ACTIVE
                </span>
              </div>

              {/* Composition Preview Body */}
              <div className="p-4 sm:p-6 bg-[#F5F7FB] space-y-4 text-left">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs edge-lighting">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Active Subscriptions</p>
                    <p className="text-xl font-black text-[#111D35] mt-1">24 Active</p>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" /> +14% this month
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs edge-lighting">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Monthly Revenue</p>
                    <p className="text-xl font-black text-[#111D35] mt-1">₹67,350.00</p>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> 100% automated
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs edge-lighting">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Pending Receivables</p>
                    <p className="text-xl font-black text-amber-600 mt-1">₹18,680.00</p>
                    <span className="text-[11px] font-medium text-[#64748B] mt-0.5 block">
                      Net 15 terms active
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs edge-lighting">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Automated Invoicing</p>
                    <p className="text-xl font-black text-[#1677F8] mt-1">Zero Duplicates</p>
                    <span className="text-[11px] font-semibold text-[#1677F8] mt-0.5 block">
                      Idempotent cycles
                    </span>
                  </div>
                </div>

                {/* Mini Graph & Renewals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-[#111D35]">Recurring Revenue Velocity</h4>
                      <span className="text-[10px] font-semibold text-[#1677F8] bg-[#EAF3FF] px-2 py-0.5 rounded">
                        Predictive Run-Rate
                      </span>
                    </div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={PREVIEW_REVENUE} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="heroRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1677F8" stopOpacity={0.35} />
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

                  <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
                    <h4 className="text-xs font-bold text-[#111D35]">Upcoming Renewals</h4>
                    <div className="space-y-2 pt-1 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#F5F7FB] border border-[#E2E8F0]">
                        <div>
                          <p className="font-bold text-[#111D35]">Acme Corp</p>
                          <p className="text-[10px] text-[#64748B]">Enterprise Plan</p>
                        </div>
                        <span className="font-bold text-[#1677F8]">₹6,041.60</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#F5F7FB] border border-[#E2E8F0]">
                        <div>
                          <p className="font-bold text-[#111D35]">Zenith Global</p>
                          <p className="text-[10px] text-[#64748B]">Cloud Edition</p>
                        </div>
                        <span className="font-bold text-[#1677F8]">₹28,680.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1677F8] bg-[#EAF3FF] px-3 py-1 rounded-full">
              Engineered for Scalability
            </span>
            <h2 className="text-3xl font-black text-[#111D35] tracking-tight">
              Complete End-to-End Subscription Governance
            </h2>
            <p className="text-sm text-[#64748B]">
              Every phase of the customer lifecycle seamlessly handled by automated pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card hover:border-[#1677F8]/40 hover:shadow-glow-sm transition-all edge-lighting group">
              <div className="w-11 h-11 rounded-xl bg-[#EAF3FF] text-[#1677F8] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111D35] mb-2">Subscription Management</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full lifecycle governance from Draft and Quotation to Active renewal, pauses, and structured closures.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card hover:border-[#1677F8]/40 hover:shadow-glow-sm transition-all edge-lighting group">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111D35] mb-2">Smart Billing & Invoices</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automated due date scanning with cryptographic duplicate prevention and automatic tax calculation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card hover:border-[#1677F8]/40 hover:shadow-glow-sm transition-all edge-lighting group">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111D35] mb-2">Payment Tracking</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Supports multi-method settlements, partial payments, UTR tracking, and accurate non-floating decimal audits.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-card hover:border-[#1677F8]/40 hover:shadow-glow-sm transition-all edge-lighting group">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111D35] mb-2">Analytics & Reporting</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Real-time MRR trends, subscription plan distribution, overdue invoice tracking, and customer spend analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Product Preview Section */}
      <section id="preview" className="py-20 bg-[#F5F7FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1677F8]">
                Interactive Workspace
              </span>
              <h2 className="text-3xl font-black text-[#111D35] tracking-tight mt-1">
                Designed for Rapid Financial Operations
              </h2>
            </div>
            <button
              type="button"
              onClick={handleExploreDashboard}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#1677F8] hover:underline"
            >
              <span>Launch Live Workspace Preview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 edge-lighting">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111D35]">
                <Layers className="w-4 h-4 text-[#1677F8]" />
                <span>Multi-Tier Product Variants</span>
              </div>
              <p className="text-xs text-[#64748B]">
                Configure base catalog pricing with add-on modules (e.g. Odoo Integration, AI Streams) computed dynamically per seat.
              </p>
              <div className="p-3 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Business Software</span>
                  <span>₹2,000</span>
                </div>
                <div className="flex justify-between text-[#1677F8] font-bold">
                  <span>+ Odoo Pack</span>
                  <span>+₹560</span>
                </div>
                <div className="border-t border-[#E2E8F0] pt-1 flex justify-between font-black text-[#111D35]">
                  <span>Total Unit Price</span>
                  <span>₹2,560</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 edge-lighting">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111D35]">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>1-Click Billing Generation</span>
              </div>
              <p className="text-xs text-[#64748B]">
                Eliminate spreadsheets forever. The billing engine processes active subscriptions due for invoicing with idempotent safety.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">⚡ Automated Invoice Engine</p>
                <p className="text-[11px] text-emerald-700">Scan date matrices, apply active discounts, and prevent billing duplicates.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 edge-lighting">
              <div className="flex items-center gap-2 text-xs font-bold text-[#111D35]">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Role-Based Access Control</span>
              </div>
              <p className="text-xs text-[#64748B]">
                Dedicated portals for Administrators, Operational Staff, and Customer Self-Service with instant 1-click demo switcher.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-bold text-center">
                <span className="p-1.5 rounded bg-sky-50 text-sky-800 border border-sky-200">Admin</span>
                <span className="p-1.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">Staff</span>
                <span className="p-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Customer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="py-20 bg-[#0B1426] text-white relative overflow-hidden">
        <div
          className="absolute -top-20 right-0 w-[450px] h-[350px] bg-[#1677F8]/20 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Ready to Automate Your Recurring Billing Lifecycle?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-normal">
            Experience how Brightloop unified subscription governance replaces spreadsheets with real-time financial accuracy.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleExploreDashboard}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-[#1677F8] hover:bg-[#0A5CD6] text-white shadow-lg shadow-[#1677F8]/30 transition-all active:scale-[0.98]"
            >
              Launch Interactive Demo
            </button>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer id="about" className="bg-[#070D18] text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1677F8] flex items-center justify-center text-white">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Brightloop Software</p>
              <p className="text-[11px] text-slate-500">Subscription & Revenue Management Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Preview</a>
            <Link to="/login" className="hover:text-white transition-colors">Demo Login</Link>
          </div>

          <p className="text-[11px] text-slate-500">
            © 2026 Brightloop Software Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

