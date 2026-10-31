import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Calendar,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Hash,
  Tag
} from 'lucide-react';
import { DiscountService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function Discounts() {
  const { isAdmin } = useAuth();
  const { announce } = useAccessibility();

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    min_purchase: '',
    min_quantity: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2027-12-31',
    usage_limit: 50,
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  async function loadDiscounts() {
    try {
      setLoading(true);
      const data = await DiscountService.getAll();
      setDiscounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;

    await DiscountService.create({
      ...formData,
      code: formData.code.toUpperCase().trim(),
      value: Number(formData.value),
      min_purchase: Number(formData.min_purchase || 0),
      min_quantity: Number(formData.min_quantity || 1),
      usage_limit: Number(formData.usage_limit || 100),
    });

    announce(`Discount ${formData.code} created`);
    setIsModalOpen(false);
    setFormData({
      code: '',
      name: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      min_quantity: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '2027-12-31',
      usage_limit: 50,
    });
    loadDiscounts();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
            Discount & Promotional Rules
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Configure percentage or fixed amount discounts with minimum thresholds and usage caps.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Create a new discount rule"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#1677F8] hover:bg-[#0A5CD6] text-white shadow-sm hover:shadow-[#1677F8]/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create Discount Rule</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[#D97706] text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Admin-only configuration area</span>
          </div>
        )}
      </div>

      {/* Discounts Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs font-semibold text-[#64748B]">Loading discount rules...</div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E2E8F0] p-8">
          <Percent className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#111D35]">No discount rules configured</p>
          <p className="text-xs text-[#64748B] mt-1">Admin can add discounts applicable to recurring invoices.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {discounts.map((disc) => {
            const isExpired = new Date(disc.end_date) < new Date();
            const isLimitReached = disc.times_used >= disc.usage_limit;
            const isActive = disc.is_active && !isExpired && !isLimitReached;

            return (
              <Card key={disc.id} className="flex flex-col justify-between hover:shadow-glow-sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-[#0B1426] text-white tracking-wider">
                        {disc.code}
                      </span>
                      <h2 className="text-sm font-bold text-[#111D35] mt-2">{disc.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#1677F8]">
                        {disc.type === 'percentage' ? `${disc.value}% OFF` : `₹${disc.value} OFF`}
                      </p>
                      <p className="text-[10px] text-[#64748B]">
                        {disc.type === 'percentage' ? 'Percentage rule' : 'Fixed deduction'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-[#64748B] bg-[#F5F7FB] p-3 rounded-xl border border-[#E2E8F0]">
                    <p>Min Purchase: <strong className="text-[#111D35]">₹{disc.min_purchase}</strong></p>
                    <p>Min Quantity: <strong className="text-[#111D35]">{disc.min_quantity} unit(s)</strong></p>
                    <p className="flex items-center gap-1 text-[11px] text-[#64748B] pt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#1677F8]" />
                      Valid: {disc.start_date} to {disc.end_date}
                    </p>
                  </div>

                  {/* Usage tracker */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-[#64748B] mb-1">
                      <span>Redemptions</span>
                      <span>{disc.times_used} / {disc.usage_limit} used</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className={`h-full ${isLimitReached ? 'bg-[#DC2626]' : 'bg-[#1677F8]'}`}
                        style={{ width: `${Math.min(100, (disc.times_used / disc.usage_limit) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Status:</span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active & Applying
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-[#DC2626] bg-rose-50 px-2 py-0.5 rounded-md">
                      <XCircle className="w-3.5 h-3.5" />
                      {isLimitReached ? 'Limit Reached' : isExpired ? 'Expired' : 'Inactive'}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Discount Rule"
        subtitle="Only admins can author promotional discount policies"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disc-code" className="block font-bold text-slate-700 mb-1">
                Coupon / Rule Code *
              </label>
              <input
                id="disc-code"
                type="text"
                required
                placeholder="e.g. FESTIVE15"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
            <div>
              <label htmlFor="disc-name" className="block font-bold text-slate-700 mb-1">
                Rule Name *
              </label>
              <input
                id="disc-name"
                type="text"
                required
                placeholder="e.g. Diwali Corporate Special"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disc-type" className="block font-bold text-slate-700 mb-1">
                Discount Type *
              </label>
              <select
                id="disc-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Deduction (₹)</option>
              </select>
            </div>
            <div>
              <label htmlFor="disc-val" className="block font-bold text-slate-700 mb-1">
                Discount Value *
              </label>
              <input
                id="disc-val"
                type="number"
                min="1"
                step="0.01"
                required
                placeholder={formData.type === 'percentage' ? '15 (for 15%)' : '2000'}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disc-min-amt" className="block font-bold text-slate-700 mb-1">
                Min Purchase Amount (₹)
              </label>
              <input
                id="disc-min-amt"
                type="number"
                min="0"
                placeholder="5000"
                value={formData.min_purchase}
                onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="disc-limit" className="block font-bold text-slate-700 mb-1">
                Max Usage Limit
              </label>
              <input
                id="disc-limit"
                type="number"
                min="1"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="disc-start" className="block font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                id="disc-start"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="disc-end" className="block font-bold text-slate-700 mb-1">
                End Date
              </label>
              <input
                id="disc-end"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
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
              className="px-4 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


