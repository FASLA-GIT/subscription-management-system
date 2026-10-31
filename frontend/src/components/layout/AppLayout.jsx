import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main
          id="main-content"
          tabIndex="-1"
          role="main"
          className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

