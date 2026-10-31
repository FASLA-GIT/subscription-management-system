import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  ChevronRight,
  FileText,
  Trash2,
  Layers
} from 'lucide-react';
import {
  SubscriptionService,
  CustomerService,
  PlanService,
  ProductService
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';

export default function Subscriptions() {
  const { isStaff, isCustomer, user } = useAuth();
  const { announce } = useAccessibility();

  const [subscriptions, setSubscriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  // New Subscription Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    payment_terms: 'Net 15',
    status: 'draft',
    items: [],
  });

  // Current item builder
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setLoadError('');
      const [subs, custs, pls, prods] = await Promise.all([
        SubscriptionService.getAll(),
        CustomerService.getAll(),
        PlanService.getAll(),
        ProductService.getAll(),
      ]);
      setSubscriptions(subs);
      setCustomers(custs);
      setPlans(pls);
      setProducts(prods);
      if (custs.length > 0 && !formData.customer_id) {
        setFormData(prev => ({ ...prev, customer_id: custs[0].id }));
      }
      if (pls.length > 0 && !formData.plan_id) {
        setFormData(prev => ({ ...prev, plan_id: pls[0].id }));
      }
    } catch (err) {
      setLoadError(err.response?.data?.detail || err.message || 'Subscriptions could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === Number(selectedProduct));
    if (!prod) return;

    let variantObj = null;
    let addPrice = 0;
    if (selectedVariant) {
      variantObj = prod.variants?.find(v => v.id === Number(selectedVariant));
      if (variantObj) addPrice = Number(variantObj.additional_price || 0);
    }

    const unitPrice = Number(prod.sales_price) + addPrice;
    const qty = Number(itemQuantity) || 1;
    const totalAmount = unitPrice * qty;

    const newItem = {
      product_id: prod.id,
      product_name: prod.name,
      variant_id: variantObj ? variantObj.id : null,
      variant_name: variantObj ? variantObj.name : null,
      quantity: qty,
      unit_price: unitPrice,
      amount: totalAmount,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProduct('');
    setSelectedVariant('');
    setItemQuantity(1);
    announce(`Added ${prod.name} to subscription items`);
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    announce('Item removed');
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    return { subtotal, tax, total };
  };

  const handleSubmitSubscription = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one product item to the subscription.');
      return;
    }

    const cust = customers.find(c => c.id === Number(formData.customer_id));
    const plan = plans.find(p => p.id === Number(formData.plan_id));
    const { subtotal, tax, total } = calculateTotals();

    const newSubData = {
      ...formData,
      customer_id: Number(formData.customer_id),
      customer_name: cust ? cust.name : 'Unknown Customer',
      plan_id: Number(formData.plan_id),
      plan_name: plan ? plan.name : 'Standard Plan',
      quantity: formData.items.reduce((sum, i) => sum + i.quantity, 0),
      unit_price: plan ? plan.price : subtotal,
      taxes: tax,
      total_amount: total,
    };

    await SubscriptionService.create(newSubData);
    setIsModalOpen(false);
    announce('Created new subscription successfully');
    setFormData({
      customer_id: customers[0]?.id || '',
      plan_id: plans[0]?.id || '',
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      payment_terms: 'Net 15',
      status: 'draft',
      items: [],
    });
    loadAllData();
  };

  const handleStatusChange = async (subId, newStatus) => {
    await SubscriptionService.updateStatus(subId, newStatus);
    announce(`Subscription marked as ${newStatus}`);
    loadAllData();
    if (selectedSub && selectedSub.id === subId) {
      setSelectedSub(prev => ({ ...prev, status: newStatus }));
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    // Role filter for customer
    if (isCustomer && user?.customerId && s.customer_id !== user.customerId) {
      return false;
    }
    const matchesSearch = s.subscription_number.toLowerCase().includes(search.toLowerCase()) ||
                          s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                          s.plan_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
            {isCustomer ? 'My Subscriptions' : 'Customer Subscriptions'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Track subscription lifecycles from Draft and Quotation to Active renewal.
          </p>
        </div>

        {!isCustomer && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Create a new subscription"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#1677F8] hover:bg-[#0A5CD6] text-white shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Subscription</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-card edge-lighting">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by subscription #, customer or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search subscriptions"
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="status-filter" className="text-xs font-semibold text-[#64748B] whitespace-nowrap">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl px-3 py-2 font-semibold text-[#111D35] focus-visible:ring-2 focus-visible:ring-[#1677F8]"
          >
            <option value="all">All Lifecycles</option>
            <option value="draft">Draft</option>
            <option value="quotation">Quotation</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th scope="col" className="px-4 py-3">Subscription #</th>
                <th scope="col" className="px-4 py-3">Customer</th>
                <th scope="col" className="px-4 py-3">Plan</th>
                <th scope="col" className="px-4 py-3">Next Billing</th>
                <th scope="col" className="px-4 py-3 text-right">Total Amount</th>
                <th scope="col" className="px-4 py-3 text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : loadError ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-rose-700" role="alert">Unable to load subscriptions: {loadError} <button type="button" onClick={loadAllData} className="font-bold underline">Retry</button></td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                    No subscriptions matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="interactive-row transition-colors">
                    <td className="px-4 py-3 font-bold text-[#1677F8]">
                      <button
                        type="button"
                        onClick={() => setSelectedSub(sub)}
                        className="hover:underline text-left font-bold"
                      >
                        {sub.subscription_number}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#111D35]">
                      {sub.customer_name}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      <span className="font-semibold text-[#111D35]">{sub.plan_name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#1677F8]" />
                        {sub.next_billing_date}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#111D35]">
                      ₹{Number(sub.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSub(sub)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#111D35] hover:bg-[#F5F7FB] rounded-lg border border-[#E2E8F0] edge-lighting"
                        >
                          View Details
                        </button>

                        {!isCustomer && (
                          <>
                            {sub.status === 'draft' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(sub.id, 'quotation')}
                                className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 rounded-lg border border-purple-200"
                              >
                                Send Quote
                              </button>
                            )}

                            {(sub.status === 'draft' || sub.status === 'quotation') && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(sub.id, 'confirmed')}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#1677F8] hover:bg-[#EAF3FF] rounded-lg border border-[#1677F8]/30"
                              >
                                Confirm
                              </button>
                            )}

                            {sub.status === 'confirmed' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(sub.id, 'active')}
                                className="px-2.5 py-1 text-[11px] font-bold text-[#059669] hover:bg-emerald-50 rounded-lg border border-emerald-300"
                              >
                                Activate
                              </button>
                            )}

                            {sub.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(sub.id, 'paused')}
                                title="Pause subscription"
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </button>
                            )}

                            {sub.status === 'paused' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(sub.id, 'active')}
                                title="Resume subscription"
                                className="p-1 text-[#059669] hover:bg-emerald-50 rounded"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}

                            {sub.status !== 'closed' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(sub.id, 'closed')}
                                title="Close subscription"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
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

      {/* Subscription Details Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription Details — ${selectedSub.subscription_number}`}
          subtitle={`Customer: ${selectedSub.customer_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 font-medium">Lifecycle Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedSub.status} />
                </div>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Selected Plan</p>
                <p className="font-bold text-slate-900 mt-1">{selectedSub.plan_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Payment Terms</p>
                <p className="font-bold text-slate-900 mt-1">{selectedSub.payment_terms || 'Net 15'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Next Billing Date</p>
                <p className="font-bold text-sky-700 mt-1">{selectedSub.next_billing_date}</p>
              </div>
            </div>

            {/* Product Items Breakdown */}
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Attached Product Lines & Variants</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSub.items && selectedSub.items.length > 0 ? (
                      selectedSub.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-slate-800">{it.product_name}</p>
                            {it.variant_name && (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-sky-50 text-sky-700 font-medium">
                                Variant: {it.variant_name}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-medium">{it.quantity}</td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            ₹{Number(it.unit_price).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                            ₹{Number(it.amount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                          Standard single-product subscription.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedSub.total_amount - (selectedSub.taxes || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (GST 18%):</span>
                  <span className="font-semibold text-slate-900">
                    ₹{Number(selectedSub.taxes || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-slate-900 text-sm">
                  <span>Total Recurring:</span>
                  <span className="text-sky-700">
                    ₹{Number(selectedSub.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription"
        subtitle="Assign customer, billing plan and add product lines with variants"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitSubscription} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sub-customer" className="block text-xs font-bold text-slate-700 mb-1">
                Select Customer *
              </label>
              <select
                id="sub-customer"
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.contact_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sub-plan" className="block text-xs font-bold text-slate-700 mb-1">
                Select Billing Plan *
              </label>
              <select
                id="sub-plan"
                required
                value={formData.plan_id}
                onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — ₹{p.price} / {p.billing_frequency}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="sub-start" className="block text-xs font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                id="sub-start"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="sub-next" className="block text-xs font-bold text-slate-700 mb-1">
                Next Billing Date
              </label>
              <input
                id="sub-next"
                type="date"
                value={formData.next_billing_date}
                onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="sub-terms" className="block text-xs font-bold text-slate-700 mb-1">
                Payment Terms
              </label>
              <select
                id="sub-terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="Immediate">Due Upon Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
              </select>
            </div>
          </div>

          {/* Add Product Items Builder */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-800">Add Product Line Items & Variants</p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSelectedVariant('');
                  }}
                  aria-label="Choose product"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Base ₹{p.sales_price})</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  disabled={!selectedProduct}
                  aria-label="Choose variant"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg disabled:opacity-50"
                >
                  <option value="">Standard (No Variant)</option>
                  {selectedProduct && products.find(p => p.id === Number(selectedProduct))?.variants?.map(v => (
                    <option key={v.id} value={v.id}>{v.name} (+₹{v.additional_price})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  aria-label="Item quantity"
                  className="w-16 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current Added Items List */}
            {formData.items.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{item.product_name}</span>
                      {item.variant_name && (
                        <span className="ml-1 text-[11px] text-sky-700 bg-sky-50 px-1 rounded">
                          ({item.variant_name})
                        </span>
                      )}
                      <span className="text-slate-500 ml-2">Qty: {item.quantity} × ₹{item.unit_price}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        aria-label="Remove item"
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Live Totals Box */}
                {(() => {
                  const { subtotal, tax, total } = calculateTotals();
                  return (
                    <div className="text-right pt-2 text-xs space-y-1 text-slate-600">
                      <p>Subtotal: <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span></p>
                      <p>GST (18%): <span className="font-semibold text-slate-900">₹{tax.toLocaleString('en-IN')}</span></p>
                      <p className="text-sm font-black text-sky-800">Total: ₹{total.toLocaleString('en-IN')}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
            >
              Confirm Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


