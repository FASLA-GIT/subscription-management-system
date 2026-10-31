import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  ShieldCheck, 
  Building2, 
  Save, 
  Plus, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { announce } = useAccessibility();

  const [activeTab, setActiveTab] = useState('org');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Aarav Sharma', email: 'admin@brightloop.com', role: 'admin', status: 'Active' },
    { id: 2, name: 'Priya Patel', email: 'priya.staff@brightloop.com', role: 'internal_staff', status: 'Active' },
    { id: 3, name: 'Vikram Joshi', email: 'vikram.j@brightloop.com', role: 'internal_staff', status: 'Active' },
  ]);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('internal_staff');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveNotice(true);
    announce('Workspace configuration updated');
    setTimeout(() => setSaveNotice(false), 3000);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const newStaff = {
      id: Date.now(),
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      status: 'Active',
    };
    setStaffList(prev => [...prev, newStaff]);
    setIsStaffModalOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    announce(`Added staff member ${newStaff.name}`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-black text-[#111D35] tracking-tight">
          Workspace & System Settings
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Configure default billing rules, currencies, team staff access, and security policies.
        </p>
      </div>

      {saveNotice && (
        <div role="alert" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('org')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            activeTab === 'org' 
              ? 'bg-[#1677F8] text-white shadow-xs' 
              : 'text-[#64748B] hover:text-[#111D35] hover:bg-white'
          }`}
        >
          Billing Defaults
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'staff' 
                ? 'bg-[#1677F8] text-white shadow-xs' 
                : 'text-[#64748B] hover:text-[#111D35] hover:bg-white'
            }`}
          >
            Staff Management
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-1.5 rounded-xl transition-all ${
            activeTab === 'security' 
              ? 'bg-[#1677F8] text-white shadow-xs' 
              : 'text-[#64748B] hover:text-[#111D35] hover:bg-white'
          }`}
        >
          Demo Security Notice
        </button>
      </div>

      {/* Tab 1: Organization & Billing Defaults */}
      {activeTab === 'org' && (
        <Card title="Company & Automated Invoicing Parameters">
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#111D35] mb-1">Company Legal Name</label>
                <input
                  type="text"
                  defaultValue="Brightloop Software Solutions Ltd"
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111D35] mb-1">Official GSTIN</label>
                <input
                  type="text"
                  defaultValue="07AAACB9999F1Z0"
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35] uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#111D35] mb-1">Operating Currency</label>
                <select className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35]">
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="USD">USD ($) US Dollar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#111D35] mb-1">Standard Tax Rate</label>
                <input
                  type="text"
                  defaultValue="18% (GST)"
                  className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111D35] mb-1">Default Terms</label>
                <select className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#E2E8F0] rounded-xl text-[#111D35]">
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Immediate">Due Upon Receipt</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6] shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Parameters</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Staff Management (Admin Only) */}
      {activeTab === 'staff' && isAdmin && (
        <Card 
          title="Internal Staff & Role Assignments" 
          subtitle="Only administrators can invite and manage staff members"
          actions={
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#1677F8] hover:bg-[#0A5CD6]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {staffList.map(s => (
                  <tr key={s.id} className="interactive-row">
                    <td className="px-3 py-2.5 font-bold text-[#111D35]">{s.name}</td>
                    <td className="px-3 py-2.5 text-[#64748B]">{s.email}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#1677F8] capitalize">
                      {s.role.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#059669]">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Security & Demo Notice */}
      {activeTab === 'security' && (
        <Card title="Architecture & Demonstration Security Scope">
          <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E2E8F0] space-y-3 text-xs text-[#64748B] max-w-2xl">
            <div className="flex items-center gap-2 text-[#111D35] font-bold">
              <Info className="w-4 h-4 text-[#1677F8]" />
              <span>Frontend-Only Demonstration Architecture</span>
            </div>
            <p>
              This application is configured for hackathon demonstration. User role switching, mock tokens, and session states are managed in client <code className="font-mono text-[#111D35]">sessionStorage</code>.
            </p>
            <p>
              Client-side route guards provide presentation safety and UI partitioning, but production deployments require an authenticated backend server, real JWT verification, and database-level row access control (RLAC).
            </p>
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <Modal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          title="Add Internal Staff Member"
          subtitle="Assign operational roles to team members"
        >
          <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#111D35] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="e.g. Vikram Joshi"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111D35] mb-1">Company Email *</label>
              <input
                type="email"
                required
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                placeholder="vikram@brightloop.com"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111D35] mb-1">Assigned Role</label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl"
              >
                <option value="internal_staff">Internal Staff (Operations & Billing)</option>
                <option value="admin">Administrator (Full System Control)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="px-3 py-1.5 text-[#64748B] hover:bg-[#F5F7FB] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#1677F8] hover:bg-[#0A5CD6] text-white font-bold rounded-xl shadow-xs"
              >
                Add Staff
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
