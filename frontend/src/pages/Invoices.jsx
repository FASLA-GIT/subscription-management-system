import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Receipt, 
  Zap, 
  Search, 
  Filter, 
  Printer, 
  Volume2, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText 
} from 'lucide-react';
import { InvoiceService, PaymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';

export default function Invoices() {
  const { isCustomer, user } = useAuth();
  const { speak, announce } = useAccessibility();
  const [searchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [billingNotice, setBillingNotice] = useState('');

  // Payment Recording Modal from Invoice
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer (NEFT)');
  const [payNote, setPayNote] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const data = await InvoiceService.getAll();
      setInvoices(data);

      // Check if URL has ?id=...
      const invoiceIdParam = searchParams.get('id');
      if (invoiceIdParam) {
        const found = data.find(i => i.id === Number(invoiceIdParam));
        if (found) setSelectedInvoice(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateDue = async () => {
    const res = await InvoiceService.generateDueInvoices();
    setBillingNotice(res.message);
    announce(res.message);
    loadInvoices();
  };

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.outstanding_amount || inv.final_amount);
    setIsPayModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !payAmount) return;

    await PaymentService.recordPayment({
      invoice_id: selectedInvoice.id,
      amount: Number(payAmount),
      payment_method: payMethod,
      note: payNote || 'Payment recorded via Invoices module',
      payment_date: new Date().toISOString().split('T')[0],
    });

    announce(`Payment of ₹${payAmount} recorded successfully`);
    setIsPayModalOpen(false);
    loadInvoices();
    // Update active invoice preview if open
    const updated = await InvoiceService.getById(selectedInvoice.id);
    if (updated) setSelectedInvoice(updated);
  };

  const handleReadInvoiceAloud = (inv) => {
    if (!inv) return;
    const text = `Invoice ${inv.invoice_number} for customer ${inv.customer_name}. Total amount is ₹${inv.final_amount.toLocaleString('en-IN')}. Paid amount is ₹${inv.paid_amount.toLocaleString('en-IN')}. Outstanding balance is ₹${inv.outstanding_amount.toLocaleString('en-IN')}. Due date is ${inv.due_date}. Status is ${inv.status}.`;
    speak(text);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (isCustomer && user?.customerId && inv.customer_id !== user.customerId) {
      return false;
    }
    const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                          inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                          inv.subscription_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isCustomer ? 'My Invoices & Billing Statements' : 'Invoices & Automated Billing Engine'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated recurring invoice generation, duplicate prevention, and balance tracking.
          </p>
        </div>

        {!isCustomer && (
          <button
            type="button"
            onClick={handleGenerateDue}
            aria-label="Generate invoices for all due subscriptions with duplicate prevention"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span>⚡ Generate Due Invoices</span>
          </button>
        )}
      </div>

      {/* Notice Banner */}
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name or subscription #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search invoices"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="inv-status-filter" className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Status:
          </label>
          <select
            id="inv-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <option value="all">All Invoices</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Invoice #</th>
                <th scope="col" className="px-4 py-3">Customer</th>
                <th scope="col" className="px-4 py-3">Billing Period</th>
                <th scope="col" className="px-4 py-3">Due Date</th>
                <th scope="col" className="px-4 py-3 text-right">Final Amount</th>
                <th scope="col" className="px-4 py-3 text-right">Outstanding</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-sky-700">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="hover:underline text-left font-bold"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{inv.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{inv.subscription_number}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inv.billing_period_start} to {inv.billing_period_end}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {inv.due_date}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{Number(inv.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-black">
                      {inv.outstanding_amount > 0 ? (
                        <span className="text-amber-700">
                          ₹{Number(inv.outstanding_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-200"
                        >
                          View
                        </button>
                        {inv.outstanding_amount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Details & Printable View Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoice_number}`}
          subtitle={`Billing cycle statement for ${selectedInvoice.customer_name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5 text-xs">
            {/* Action Bar for Modal */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedInvoice.status} />
                <span className="text-slate-500 font-medium">
                  Linked: <strong className="text-slate-800">{selectedInvoice.subscription_number}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReadInvoiceAloud(selectedInvoice)}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                  Read Aloud
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Print
                </button>
                {selectedInvoice.outstanding_amount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPayModalOpen(true);
                      setPayAmount(selectedInvoice.outstanding_amount);
                    }}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-semibold"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                )}
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5">
              {/* Company & Invoice Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Brightloop Software</h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Automated SaaS & Enterprise Billing Solutions</p>
                  <p className="text-slate-500 text-[11px]">GSTIN: 07AAACB9999F1Z0 | support@brightloop.com</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black text-sky-700">{selectedInvoice.invoice_number}</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Due Date: <strong className="text-slate-800">{selectedInvoice.due_date}</strong></p>
                  <p className="text-slate-500 text-[11px]">Period: {selectedInvoice.billing_period_start} to {selectedInvoice.billing_period_end}</p>
                </div>
              </div>

              {/* Billed To */}
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Billed To Customer:</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedInvoice.customer_name}</p>
                <p className="text-slate-500">{selectedInvoice.customer_email || 'billing@customer.com'}</p>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Item / Service Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          {item.description || item.product_name}
                        </td>
                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right">
                          ₹{Number(item.unit_price).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Calculations & Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(selectedInvoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST 18%):</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(selectedInvoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Applied Discount:</span>
                      <span className="font-semibold">
                        -₹{Number(selectedInvoice.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Final Amount:</span>
                    <span className="text-sky-700 font-black">
                      ₹{Number(selectedInvoice.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Paid Amount:</span>
                    <span className="font-semibold">
                      ₹{Number(selectedInvoice.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900 text-sm">
                    <span>Outstanding Balance:</span>
                    <span className={selectedInvoice.outstanding_amount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      ₹{Number(selectedInvoice.outstanding_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Dialog */}
      {isPayModalOpen && selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Record Payment for ${selectedInvoice.invoice_number}`}
          subtitle={`Customer: ${selectedInvoice.customer_name}`}
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-slate-500">Invoice Total:</p>
                <p className="font-bold text-slate-900">₹{selectedInvoice.final_amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Current Outstanding:</p>
                <p className="font-black text-amber-700 text-sm">₹{selectedInvoice.outstanding_amount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div>
              <label htmlFor="pay-amount-input" className="block font-bold text-slate-700 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                id="pay-amount-input"
                type="number"
                min="1"
                max={selectedInvoice.outstanding_amount}
                step="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Supports partial settlements as well as full payment.</p>
            </div>

            <div>
              <label htmlFor="pay-method-select" className="block font-bold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                id="pay-method-select"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
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
              <label htmlFor="pay-note-input" className="block font-bold text-slate-700 mb-1">
                Transaction Reference / Bank UTR
              </label>
              <input
                id="pay-note-input"
                type="text"
                placeholder="e.g. UTR-AXIS-98237190"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Confirm & Record Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

