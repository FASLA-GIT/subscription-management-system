import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#111D35] transition-colors font-sans">
      <Navbar onToggleMobileSidebar={() => setIsMobileOpen(prev => !prev)} />
      <div className="flex flex-1">
        <Sidebar
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
        <main
          id="main-content"
          tabIndex="-1"
          role="main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

