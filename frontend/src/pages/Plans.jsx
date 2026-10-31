import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Calendar, 
  Check, 
  X, 
  Clock, 
  Tag, 
  ShieldCheck, 
  PauseCircle, 
  RefreshCw 
} from 'lucide-react';
import { PlanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function Plans() {
  const { isStaff } = useAuth();
  const { announce } = useAccessibility();
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billing_frequency: 'monthly',
    min_quantity: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2027-12-31',
    auto_closure: false,
    early_closure_allowed: true,
    pause_allowed: true,
    renewal_allowed: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      const data = await PlanService.getAll();
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    await PlanService.create({
      ...formData,
      price: Number(formData.price),
      min_quantity: Number(formData.min_quantity || 1),
    });

    setIsModalOpen(false);
    announce(`Created plan ${formData.name}`);
    setFormData({
      name: '',
      price: '',
      billing_frequency: 'monthly',
      min_quantity: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '2027-12-31',
      auto_closure: false,
      early_closure_allowed: true,
      pause_allowed: true,
      renewal_allowed: true,
    });
    loadPlans();
  };

  const frequencyBadges = {
    daily: 'bg-indigo-100 text-indigo-800',
    weekly: 'bg-cyan-100 text-cyan-800',
    monthly: 'bg-emerald-100 text-emerald-800',
    yearly: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription Plan Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure recurring billing cadences, pause/renewal policies, and lifecycle rules.
          </p>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Create a new subscription plan"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No subscription plans available</p>
          <p className="text-xs text-slate-500 mt-1">Click 'Create New Plan' to define billing frequencies.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${frequencyBadges[plan.billing_frequency] || 'bg-slate-100 text-slate-800'}`}>
                    {plan.billing_frequency}
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">per {plan.billing_frequency}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Min Quantity: <span className="font-semibold text-slate-700">{plan.min_quantity} seat(s)</span>
                  </p>
                </div>

                {/* Validity Period */}
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <Calendar className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>Valid: {plan.start_date} to {plan.end_date}</span>
                </div>

                {/* Configurable Lifecycle Rules */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Configured Lifecycle Rules:
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {plan.renewal_allowed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={plan.renewal_allowed ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Auto-Renewal
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.pause_allowed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={plan.pause_allowed ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Pause Allowed
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.early_closure_allowed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={plan.early_closure_allowed ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                        Early Closure
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.auto_closure ? (
                        <Check className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={plan.auto_closure ? 'text-amber-800 font-medium' : 'text-slate-400'}>
                        Auto Close on End
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Plan"
        subtitle="Define recurring billing frequency, price and lifecycle constraints"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="plan-name" className="block text-xs font-bold text-slate-700 mb-1">
              Plan Name *
            </label>
            <input
              id="plan-name"
              type="text"
              required
              placeholder="e.g. Enterprise Annual Plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="plan-price" className="block text-xs font-bold text-slate-700 mb-1">
                Plan Price (₹) *
              </label>
              <input
                id="plan-price"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="3000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="plan-frequency" className="block text-xs font-bold text-slate-700 mb-1">
                Billing Frequency *
              </label>
              <select
                id="plan-frequency"
                value={formData.billing_frequency}
                onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label htmlFor="plan-min-qty" className="block text-xs font-bold text-slate-700 mb-1">
                Min Quantity
              </label>
              <input
                id="plan-min-qty"
                type="number"
                min="1"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-start-date" className="block text-xs font-bold text-slate-700 mb-1">
                Availability Start Date
              </label>
              <input
                id="plan-start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
            <div>
              <label htmlFor="plan-end-date" className="block text-xs font-bold text-slate-700 mb-1">
                Availability End Date
              </label>
              <input
                id="plan-end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          {/* Lifecycle Toggles */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-800">Subscription Lifecycle Rules</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.renewal_allowed}
                  onChange={(e) => setFormData({ ...formData, renewal_allowed: e.target.checked })}
                  className="rounded text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500"
                />
                <span className="text-slate-700">Allow Renewal</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pause_allowed}
                  onChange={(e) => setFormData({ ...formData, pause_allowed: e.target.checked })}
                  className="rounded text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500"
                />
                <span className="text-slate-700">Allow Pause</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.early_closure_allowed}
                  onChange={(e) => setFormData({ ...formData, early_closure_allowed: e.target.checked })}
                  className="rounded text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500"
                />
                <span className="text-slate-700">Allow Early Closure</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_closure}
                  onChange={(e) => setFormData({ ...formData, auto_closure: e.target.checked })}
                  className="rounded text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500"
                />
                <span className="text-slate-700">Auto Close When Ended</span>
              </label>
            </div>
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
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

