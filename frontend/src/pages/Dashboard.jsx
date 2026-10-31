import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Repeat,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Zap,
  CreditCard,
  ArrowUpRight,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DashboardService, InvoiceService, SubscriptionService, PaymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const { user, isCustomer, isAdmin, isStaff } = useAuth();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [billingNotice, setBillingNotice] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setLoadError('');
      const [sum, rev, plans, invs, subs] = await Promise.all([
        DashboardService.getSummary(),
        DashboardService.getRevenueChart(),
        DashboardService.getPlanDistribution(),
        InvoiceService.getAll(),
        SubscriptionService.getAll(),
      ]);
      setSummary(sum);
      setRevenueData(rev);
      setPlanDistribution(plans);
      setRecentInvoices(invs.slice(0, 5));
      setSubscriptions(subs);
    } catch (err) {
      setLoadError(err.response?.data?.detail || err.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const handleGenerateInvoices = async () => {
    try {
      const res = await InvoiceService.generateDueInvoices();
      setBillingNotice(res.message);
      await loadData();
      setTimeout(() => setBillingNotice(''), 6000);
    } catch (err) {
      setLoadError(err.response?.data?.detail || err.message || 'Invoice generation failed.');
    }
  };

  const COLORS = ['#1677F8', '#6366F1', '#059669', '#D97706'];

  // Upcoming renewals calculation
  const upcomingRenewals = subscriptions
    .filter(s => s.status === 'active')
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1677F8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#64748B]">Loading workspace intelligence...</p>
        </div>
      </div>
    );
  }

  if (loadError && !summary) {
    return (
      <div role="alert" className="mx-auto mt-12 max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
        <p>Dashboard data could not be loaded: {loadError}</p>
        <button type="button" onClick={loadData} className="mt-3 font-bold underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>Unable to load live dashboard data: {loadError}</span>
          <button type="button" onClick={loadData} className="font-bold underline">Retry</button>
        </div>
      )}
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
            {isCustomer ? 'Subscriber Financial Portal' : 'Subscription & Financial Dashboard'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {isCustomer
              ? `Welcome back, ${user?.name}. Manage your enterprise subscriptions, invoices, and settlements.`
              : 'Real-time subscription lifecycles, automated billing pipelines, and revenue velocity.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isCustomer ? (
            <>
              <Link
                to="/app/subscriptions"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F5F7FB] text-[#111D35] shadow-xs edge-lighting transition-all"
              >
                <Plus className="w-4 h-4 text-[#1677F8]" aria-hidden="true" />
                <span>New Subscription</span>
              </Link>
              <button
                type="button"
                onClick={handleGenerateInvoices}
                aria-label="Generate due invoices automatically"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#1677F8] hover:bg-[#0A5CD6] text-white shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98]"
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
                <span>⚡ Generate Due Invoices</span>
              </button>
            </>
          ) : (
            <Link
              to="/app/payments"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#059669] hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Settle Invoices</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Billing Generation Notice Banner */}
      {billingNotice && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#EAF3FF] border border-[#1677F8]/20 text-[#111D35] text-xs flex items-center justify-between animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#1677F8] flex-shrink-0" />
            <p className="font-semibold">{billingNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setBillingNotice('')}
            className="text-xs font-bold underline text-[#1677F8] hover:text-[#0A5CD6]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. KPI Cards Grid with Subtle Hover Edge Lighting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions */}
        <Card className="hover:shadow-glow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Active Subscriptions
            </p>
            <div className="w-8 h-8 rounded-lg bg-[#EAF3FF] text-[#1677F8] flex items-center justify-center">
              <Repeat className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111D35] mt-2">
            {summary?.active_subscriptions || 0}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#059669] font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recurring monthly cycles</span>
          </div>
        </Card>

        {/* Revenue Collected */}
        <Card className="hover:shadow-glow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Revenue Collected
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#059669] flex items-center justify-center">
              <DollarSign className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111D35] mt-2">
            ₹{Number(summary?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Audited settled payments
          </p>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="hover:shadow-glow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Outstanding Receivables
            </p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#111D35] mt-2">
            ₹{Number(summary?.outstanding_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Awaiting customer payment
          </p>
        </Card>

        {/* Overdue Invoices */}
        <Card className="hover:shadow-glow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Overdue Invoices
            </p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#DC2626] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#DC2626] mt-2">
            {summary?.overdue_invoices || 0}
          </p>
          <p className="text-[11px] text-[#DC2626]/80 font-medium mt-1">
            Requires payment follow-up
          </p>
        </Card>
      </div>

      {/* 4. Visual Analytics: Revenue Velocity & Active Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Area Chart */}
        <Card
          title="Revenue Growth & Billing Trends"
          subtitle="Monthly revenue collection trajectory across subscription accounts"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677F8" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#1677F8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 12px -2px rgba(11,20,38,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1677F8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Plan Distribution Donut Chart */}
        <Card
          title="Active Plan Distribution"
          subtitle="Customer subscription breakdown by tier"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} Subscriptions`, name]} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 5. Recent Invoices & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <Card
          title="Recent Invoices"
          subtitle="Latest automated billing statements generated"
          className="lg:col-span-2"
          actions={
            <Link
              to="/app/invoices"
              className="text-xs font-bold text-[#1677F8] hover:text-[#0A5CD6] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Invoice #</th>
                  <th scope="col" className="px-3 py-2.5">Customer</th>
                  <th scope="col" className="px-3 py-2.5">Due Date</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Outstanding</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="interactive-row transition-colors">
                    <td className="px-3 py-3 font-bold text-[#1677F8]">
                      <Link to={`/app/invoices?id=${inv.id}`} className="hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#111D35]">{inv.customer_name}</td>
                    <td className="px-3 py-3 text-[#64748B]">{inv.due_date}</td>
                    <td className="px-3 py-3 text-right font-bold text-[#111D35]">
                      ₹{Number(inv.final_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-700">
                      ₹{Number(inv.outstanding_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Upcoming Renewals Card */}
        <Card title="Upcoming Renewals" subtitle="Subscriptions approaching next billing cadence">
          <div className="space-y-3">
            {upcomingRenewals.map(sub => (
              <div
                key={sub.id}
                className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#1677F8]/40 hover:bg-[#EAF3FF]/30 transition-all edge-lighting text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[#111D35]">{sub.customer_name}</p>
                    <p className="text-[11px] text-[#64748B]">{sub.plan_name}</p>
                  </div>
                  <span className="font-bold text-[#1677F8]">
                    ₹{Number(sub.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[#E2E8F0]">
                  <Calendar className="w-3.5 h-3.5 text-[#1677F8]" />
                  <span>Next Billing: <strong className="text-[#111D35]">{sub.next_billing_date}</strong></span>
                </div>
              </div>
            ))}

            <Link
              to="/app/subscriptions"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#1677F8] hover:bg-[#EAF3FF] rounded-xl transition-colors border border-transparent hover:border-[#1677F8]/20"
            >
              <span>Manage Subscriptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

