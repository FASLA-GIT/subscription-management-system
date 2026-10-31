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
  Volume2 
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
import { DashboardService, InvoiceService } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const { speak } = useAccessibility();
  const { isCustomer } = useAuth();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingNotice, setBillingNotice] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sum, rev, plans, invs] = await Promise.all([
          DashboardService.getSummary(),
          DashboardService.getRevenueChart(),
          DashboardService.getPlanDistribution(),
          InvoiceService.getAll(),
        ]);
        setSummary(sum);
        setRevenueData(rev);
        setPlanDistribution(plans);
        setRecentInvoices(invs.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerateInvoices = async () => {
    const res = await InvoiceService.generateDueInvoices();
    setBillingNotice(res.message);
    const [sum, invs] = await Promise.all([
      DashboardService.getSummary(),
      InvoiceService.getAll(),
    ]);
    setSummary(sum);
    setRecentInvoices(invs.slice(0, 5));
    setTimeout(() => setBillingNotice(''), 6000);
  };

  const handleReadSummaryAloud = () => {
    if (!summary) return;
    const text = `Brightloop Dashboard Summary: You have ${summary.active_subscriptions} active subscriptions. Total revenue received is ₹${summary.total_revenue.toLocaleString('en-IN')}. Outstanding balance is ₹${summary.outstanding_amount.toLocaleString('en-IN')}. There are ${summary.overdue_invoices} overdue invoices requiring immediate attention.`;
    speak(text);
  };

  const COLORS = ['#0284c7', '#6366f1', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isCustomer ? 'Customer Billing Dashboard' : 'Subscription & Financial Dashboard'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time subscription lifecycles, automated billing and revenue intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReadSummaryAloud}
            aria-label="Listen to dashboard summary statistics"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <Volume2 className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <span>Read Summary</span>
          </button>

          {!isCustomer && (
            <button
              type="button"
              onClick={handleGenerateInvoices}
              aria-label="Trigger automated invoice generation for all due subscriptions"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span>Generate Due Invoices</span>
            </button>
          )}
        </div>
      </div>

      {/* Billing Generation Alert / Notice */}
      {billingNotice && (
        <div 
          role="alert" 
          className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-sm flex items-center justify-between animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <p className="font-medium">{billingNotice}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setBillingNotice('')}
            className="text-xs font-semibold underline text-sky-700 hover:text-sky-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </p>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Repeat className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary?.active_subscriptions || 0}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recurring monthly cycles</span>
          </div>
        </Card>

        {/* Revenue Collected */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Revenue Received
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(summary?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total settled payments
          </p>
        </Card>

        {/* Outstanding Amount */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Amount
            </p>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(summary?.outstanding_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pending receivables
          </p>
        </Card>

        {/* Overdue Invoices */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overdue Invoices
            </p>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {summary?.overdue_invoices || 0}
          </p>
          <p className="text-xs text-rose-600/80 font-medium mt-1">
            Requires payment follow-up
          </p>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card 
          title="Revenue Growth & Invoicing Trends" 
          subtitle="Monthly revenue collection vs billing volume"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val / 1000}k`} 
                />
                <Tooltip 
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0284c7" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscription Plan Distribution Pie Chart */}
        <Card 
          title="Active Plan Distribution" 
          subtitle="Subscriptions broken down by billing tier"
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

      {/* Recent Invoices & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          title="Recent Invoices" 
          subtitle="Latest billing records generated" 
          className="lg:col-span-2"
          actions={
            <Link 
              to="/invoices" 
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View All Invoices
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Invoice #</th>
                  <th scope="col" className="px-3 py-2.5">Customer</th>
                  <th scope="col" className="px-3 py-2.5">Due Date</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Outstanding</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-3 font-semibold text-sky-700">
                      <Link to={`/invoices?id=${inv.id}`} className="hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">{inv.customer_name}</td>
                    <td className="px-3 py-3 text-slate-600">{inv.due_date}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      ₹{inv.final_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">
                      ₹{inv.outstanding_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

        {/* Quick Operations Guide */}
        <Card title="Quick Actions & Workflow" subtitle="Perform core subscription operations">
          <div className="space-y-3">
            <Link
              to="/subscriptions"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Create New Subscription</p>
                  <p className="text-[11px] text-slate-500">Assign customer, plan, and products</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </Link>

            <Link
              to="/payments"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Record Customer Payment</p>
                  <p className="text-[11px] text-slate-500">Settle full or partial invoice balance</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </Link>

            <Link
              to="/products"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Manage Products & Variants</p>
                  <p className="text-[11px] text-slate-500">Configure catalog and add-on pricing</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

