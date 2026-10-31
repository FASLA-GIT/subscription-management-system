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
  SlidersHorizontal 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();

  const allNavItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/subscriptions',
      label: isCustomer ? 'My Subscriptions' : 'Subscriptions',
      icon: Repeat,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/invoices',
      label: isCustomer ? 'My Invoices' : 'Invoices & Billing',
      icon: Receipt,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/payments',
      label: isCustomer ? 'Make Payment' : 'Payments',
      icon: CreditCard,
      roles: ['admin', 'internal_staff', 'customer'],
    },
    {
      to: '/products',
      label: 'Products & Variants',
      icon: Package,
      roles: ['admin', 'internal_staff'],
    },
    {
      to: '/plans',
      label: 'Subscription Plans',
      icon: Layers,
      roles: ['admin', 'internal_staff'],
    },
    {
      to: '/discounts',
      label: 'Discounts & Offers',
      icon: Percent,
      roles: ['admin'],
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Users,
      roles: ['admin', 'internal_staff'],
    },
  ];

  const filteredNavItems = allNavItems.filter(item => 
    item.roles.includes(user?.role || 'customer')
  );

  return (
    <aside 
      role="navigation" 
      aria-label="Main Navigation"
      className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 min-h-[calc(100vh-61px)] select-none"
    >
      <div className="p-4">
        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-3 pb-2">
          {isCustomer ? 'Customer Portal' : 'Workspace Management'}
        </p>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role badge footer */}
      <div className="mt-auto p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Active Role:</span>
          <span className="font-semibold text-sky-400 capitalize">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {isAdmin && 'Full administrative access'}
          {user?.role === 'internal_staff' && 'Operations & customer support'}
          {isCustomer && 'Customer self-service portal'}
        </p>
      </div>
    </aside>
  );
}

