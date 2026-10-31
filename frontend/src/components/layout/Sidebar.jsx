import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Repeat, 
  Receipt, 
  CreditCard, 
  Percent, 
  Users, 
  BarChart3, 
  Settings, 
  X, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();

  const allNavItems = [
    {
      to: '/app',
      label: isCustomer ? 'My Dashboard' : 'Overview Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'internal_staff', 'customer'],
      end: true,
    },
    {
      to: '/app/subscriptions',
      label: isCustomer ? 'My Subscriptions' : 'Subscriptions',
      icon: Repeat,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/app/invoices',
      label: isCustomer ? 'My Invoices' : 'Invoices & Billing',
      icon: Receipt,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/app/payments',
      label: isCustomer ? 'Make Payment' : 'Payments',
      icon: CreditCard,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/app/products',
      label: 'Products & Variants',
      icon: Package,
      roles: ['admin', 'internal_staff'],
    },
    {
      to: '/app/plans',
      label: 'Subscription Plans',
      icon: Layers,
      roles: ['admin', 'internal_staff'],
    },
    {
      to: '/app/discounts',
      label: 'Discounts & Offers',
      icon: Percent,
      roles: ['admin'],
    },
    {
      to: '/app/customers',
      label: 'Customer Directory',
      icon: Users,
      roles: ['admin', 'internal_staff'],
    },
    {
      to: '/app/reports',
      label: 'Financial Reports',
      icon: BarChart3,
      roles: ['admin', 'internal_staff'],
    },
    {
      to: '/app/settings',
      label: 'Workspace Settings',
      icon: Settings,
      roles: ['admin', 'customer'],
    },
  ];

  const filteredNavItems = allNavItems.filter(item => 
    item.roles.includes(user?.role || 'customer')
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B1426] text-slate-200 select-none">
      {/* Mobile Header */}
      <div className="p-4 md:hidden flex items-center justify-between border-b border-slate-800">
        <span className="text-sm font-bold text-white tracking-tight">Navigation Menu</span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation sidebar"
          className="p-1 text-slate-400 hover:text-white rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3.5 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 pt-1 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            {isCustomer ? 'Subscriber Portal' : 'Workspace Operations'}
          </p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
            {user?.role === 'admin' ? 'Admin' : user?.role === 'internal_staff' ? 'Staff' : 'Client'}
          </span>
        </div>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold sidebar-item border border-transparent transition-all ${
                    isActive
                      ? 'bg-[#1677F8] text-white shadow-md shadow-[#1677F8]/25 !border-[#1677F8]'
                      : 'text-slate-300 hover:text-white hover:bg-[#111D35]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Footer Card */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#070D18]/70">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Session Role</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1677F8]/20 text-[#1677F8] capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-slate-400 truncate">{user?.title || user?.email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        role="navigation" 
        aria-label="Main Navigation"
        className="hidden md:flex flex-col w-64 flex-shrink-0 min-h-[calc(100vh-57px)] border-r border-[#E2E8F0] z-20"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex"
          role="dialog"
          aria-modal="true"
          onClick={onCloseMobile}
        >
          <div 
            className="w-64 h-full bg-[#0B1426] shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
