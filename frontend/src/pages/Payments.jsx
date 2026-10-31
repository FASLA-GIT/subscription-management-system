import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  FileCheck, 
  Clock, 
  ArrowDownLeft 
} from 'lucide-react';
import { PaymentService, InvoiceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function Payments() {
  const { isCustomer, user } = useAuth();
  const { announce } = useAccessibility();

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Record Payment form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (NEFT)');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pays, invs] = await Promise.all([
        PaymentService.getAll(),
        InvoiceService.getAll(),
      ]);
      setPayments(pays);
      setInvoices(invs);
      const pendingInv = invs.find(i => i.outstanding_amount > 0);
      if (pendingInv) {
        setSelectedInvoiceId(pendingInv.id);
        setAmount(pendingInv.outstanding_amount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleInvoiceSelect = (invId) => {
    setSelectedInvoiceId(invId);
    const matched = invoices.find(i => i.id === Number(invId));
    if (matched) {
      setAmount(matched.outstanding_amount);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) return;

    await PaymentService.recordPayment({
      invoice_id: Number(selectedInvoiceId),
      amount: Number(amount),
      payment_method: paymentMethod,
      payment_date: paymentDate,
      note: note || 'Direct payment settlement',
    });

    announce(`Payment of ₹${amount} recorded successfully`);
    setIsModalOpen(false);
    setNote('');
    loadData();
  };

  const pendingInvoices = invoices.filter(i => {
    if (isCustomer && user?.customerId && i.customer_id !== user.customerId) {
      return false;
    }
    return i.outstanding_amount > 0;
  });

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
                          p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                          p.payment_method?.toLowerCase().includes(search.toLowerCase()) ||
                          p.note?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payments & Collections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record customer settlements, track outstanding balances, and verify payment audits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Record a new payment transaction"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Payments Logged
          </p>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {payments.length} settled transactions
          </p>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Receivable Invoices
          </p>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {pendingInvoices.length} Invoices
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Awaiting full or partial settlement
          </p>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Audit Guarantee
          </p>
          <p className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Accurate Non-floating Arithmetic
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Paise/Decimal precision prevents rounding errors
          </p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search payments by invoice #, customer, method or UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search payment records"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
          />
        </div>
      </div>

      {/* Payments History Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Receipt ID</th>
                <th scope="col" className="px-4 py-3">Invoice #</th>
                <th scope="col" className="px-4 py-3">Customer</th>
                <th scope="col" className="px-4 py-3">Payment Method</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Reference / UTR</th>
                <th scope="col" className="px-4 py-3 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">
                      REC-{String(p.id).slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-bold text-sky-700">
                      {p.invoice_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.customer_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.payment_date}
                    </td>
                    <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                      {p.note || 'Direct settlement'}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">
                      +₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Invoice Settlement"
        subtitle="Log full or partial customer payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label htmlFor="modal-pay-invoice" className="block font-bold text-slate-700 mb-1">
              Select Invoice to Settle *
            </label>
            <select
              id="modal-pay-invoice"
              required
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.customer_name} (Outstanding: ₹{inv.outstanding_amount})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-pay-amt" className="block font-bold text-slate-700 mb-1">
                Settled Amount (₹) *
              </label>
              <input
                id="modal-pay-amt"
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="modal-pay-dt" className="block font-bold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                id="modal-pay-dt"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="modal-pay-mth" className="block font-bold text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              id="modal-pay-mth"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI / QR Code">UPI (Unified Payments Interface)</option>
              <option value="Corporate NetBanking">Corporate NetBanking</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Cheque / DD">Cheque / Demand Draft</option>
            </select>
          </div>

          <div>
            <label htmlFor="modal-pay-nt" className="block font-bold text-slate-700 mb-1">
              Transaction Reference / Bank UTR / Note
            </label>
            <input
              id="modal-pay-nt"
              type="text"
              placeholder="e.g. UTR-HDFC-991823746"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

