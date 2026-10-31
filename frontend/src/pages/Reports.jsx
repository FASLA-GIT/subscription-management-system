import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  DollarSign, 
  Percent, 
  Calendar, 
  FileText 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { DashboardService, InvoiceService } from '../services/api';
import Card from '../components/common/Card';

export default function Reports() {
  const [revenueData, setRevenueData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rev, invs] = await Promise.all([
          DashboardService.getRevenueChart(),
          InvoiceService.getAll(),
        ]);
        setRevenueData(rev);
        setInvoices(invs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.final_amount || 0), 0);
  const totalTaxCollected = invoices.reduce((sum, i) => sum + Number(i.tax_amount || 0), 0);
  const totalDiscountGiven = invoices.reduce((sum, i) => sum + Number(i.discount_amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
            Financial & Invoicing Reports
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Audited financial breakdowns, tax obligations, and subscription recurring velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F5F7FB] text-[#111D35] shadow-xs edge-lighting"
          >
            <Download className="w-4 h-4 text-[#1677F8]" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-glow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Gross Invoiced Volume
          </p>
          <p className="text-2xl font-black text-[#111D35] mt-2">
            ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Across {invoices.length} generated cycles
          </p>
        </Card>

        <Card className="hover:shadow-glow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            GST Tax Pool (18%)
          </p>
          <p className="text-2xl font-black text-[#1677F8] mt-2">
            ₹{totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Audited GST input/output liability
          </p>
        </Card>

        <Card className="hover:shadow-glow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Promotional Discounts Absorbed
          </p>
          <p className="text-2xl font-black text-[#D97706] mt-2">
            ₹{totalDiscountGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Applied via active discount rules
          </p>
        </Card>
      </div>

      {/* Revenue and Billing Bar Chart */}
      <Card title="Monthly Invoicing Velocity" subtitle="Revenue vs invoice count trends">
        <div className="h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#64748B" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(val) => `₹${val / 1000}k`} 
              />
              <Tooltip 
                formatter={(val, name) => [name === 'revenue' ? `₹${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'Invoices']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '0.75rem' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" fill="#1677F8" name="Revenue (₹)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
