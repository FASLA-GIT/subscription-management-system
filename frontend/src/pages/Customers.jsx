import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import { CustomerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function Customers() {
  const { isStaff } = useAuth();
  const { announce } = useAccessibility();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await CustomerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    // Check email uniqueness locally
    if (customers.some(c => c.email.toLowerCase() === formData.email.toLowerCase())) {
      alert('A customer with this email address is already registered.');
      return;
    }

    await CustomerService.create(formData);
    announce(`Customer ${formData.name} added successfully`);
    setIsModalOpen(false);
    setFormData({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
    });
    loadCustomers();
  };

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
           c.contact_name?.toLowerCase().includes(q) ||
           c.email?.toLowerCase().includes(q) ||
           c.tax_id?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Directory & Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage subscriber companies, primary contacts, billing addresses and GST details.
          </p>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Add new customer account"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Register Customer</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search customers by company name, contact, email or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search customers"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-500">Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No customer records found</p>
          <p className="text-xs text-slate-500 mt-1">Click 'Register Customer' to add a client profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => (
            <Card key={cust.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-black text-sm flex items-center justify-center">
                    {cust.name.substring(0, 2).toUpperCase()}
                  </div>
                  {cust.tax_id && (
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                      {cust.tax_id}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">{cust.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Contact: {cust.contact_name}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{cust.phone || 'Not provided'}</span>
                  </p>
                  <p className="flex items-start gap-2 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-[11px] text-slate-500">{cust.address || 'Address on file'}</span>
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer Account"
        subtitle="Customer records will be linked to subscription and billing records"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cust-name" className="block font-bold text-slate-700 mb-1">
                Company / Organization Name *
              </label>
              <input
                id="cust-name"
                type="text"
                required
                placeholder="e.g. Acme Technologies Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
            <div>
              <label htmlFor="cust-contact" className="block font-bold text-slate-700 mb-1">
                Primary Contact Person
              </label>
              <input
                id="cust-contact"
                type="text"
                placeholder="e.g. Rahul Verma"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cust-email" className="block font-bold text-slate-700 mb-1">
                Official Email (Unique) *
              </label>
              <input
                id="cust-email"
                type="email"
                required
                placeholder="billing@acmecorp.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
            <div>
              <label htmlFor="cust-phone" className="block font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                id="cust-phone"
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cust-tax" className="block font-bold text-slate-700 mb-1">
              GSTIN / Corporate Tax Identification Number
            </label>
            <input
              id="cust-tax"
              type="text"
              placeholder="e.g. GSTIN07AABCB1234F1Z5"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
            />
          </div>

          <div>
            <label htmlFor="cust-address" className="block font-bold text-slate-700 mb-1">
              Billing Address
            </label>
            <textarea
              id="cust-address"
              rows={2}
              placeholder="Office address, city, state, postal code..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              className="px-4 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

