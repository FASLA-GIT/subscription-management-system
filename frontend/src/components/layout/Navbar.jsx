import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  SunMoon, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  CheckCircle2, 
  LogOut, 
  Sliders, 
  Settings, 
  Volume2, 
  ChevronDown, 
  Menu, 
  X, 
  Sparkles, 
  SlidersHorizontal 
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';
import { checkBackendHealth } from '../../services/api';

export default function Navbar({ onToggleMobileSidebar }) {
  const { 
    highContrast, 
    toggleHighContrast, 
    textSize, 
    changeTextSize, 
    hoverToSpeech, 
    setHoverToSpeech, 
    speechRate, 
    setSpeechRate, 
    isSpeechSupported 
  } = useAccessibility();

  const { user, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  const [backendStatus, setBackendStatus] = useState({ isLive: false });
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showA11yModal, setShowA11yModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roleMenuRef = useRef(null);
  const a11yMenuRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function testBackend() {
      const res = await checkBackendHealth();
      if (mounted) setBackendStatus({ isLive: res.isLive });
    }
    testBackend();
    return () => { mounted = false; };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
      if (a11yMenuRef.current && !a11yMenuRef.current.contains(e.target)) {
        setShowA11yModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header 
        role="banner" 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              aria-label="Toggle navigation menu"
              className="md:hidden p-1.5 text-[#64748B] hover:text-[#111D35] hover:bg-[#F5F7FB] rounded-lg focus-visible:ring-2 focus-visible:ring-[#1677F8]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/app" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1677F8] to-[#0A5CD6] flex items-center justify-center text-white shadow-md shadow-[#1677F8]/20 transition-transform group-hover:scale-105">
                <RefreshCw className="w-4 h-4 animate-[spin_12s_linear_infinite]" aria-hidden="true" />
              </div>
              <div className="leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-[#111D35]">
                    Brightloop
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-[#EAF3FF] text-[#1677F8] rounded">
                    SubSync
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Controls: Demo Badge, Accessibility & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Mode Badge */}
            <div 
              title="Interactive Frontend Demonstration Workspace"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-[#E2E8F0] bg-[#F5F7FB] text-[#64748B]"
            >
              <span className="w-2 h-2 rounded-full bg-[#1677F8]" />
              <span className="font-semibold text-[#111D35] text-[11px]">Demo Mode</span>
            </div>

            {/* Accessibility Quick Controls & Settings Button */}
            <div 
              role="toolbar" 
              aria-label="Accessibility options" 
              className="flex items-center gap-1 bg-[#F5F7FB] p-1 rounded-xl border border-[#E2E8F0]"
            >
              {/* Font Size Scaling */}
              <div className="flex items-center" title="Adjust text size">
                <button
                  type="button"
                  onClick={() => changeTextSize('normal')}
                  aria-label="Normal text size"
                  aria-pressed={textSize === 'normal'}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                    textSize === 'normal' 
                      ? 'bg-white text-[#1677F8] shadow-xs' 
                      : 'text-[#64748B] hover:text-[#111D35]'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => changeTextSize('large')}
                  aria-label="Large text size"
                  aria-pressed={textSize === 'large'}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                    textSize === 'large' 
                      ? 'bg-white text-[#1677F8] shadow-xs' 
                      : 'text-[#64748B] hover:text-[#111D35]'
                  }`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => changeTextSize('xlarge')}
                  aria-label="Extra large text size"
                  aria-pressed={textSize === 'xlarge'}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                    textSize === 'xlarge' 
                      ? 'bg-white text-[#1677F8] shadow-xs' 
                      : 'text-[#64748B] hover:text-[#111D35]'
                  }`}
                >
                  A++
                </button>
              </div>

              <div className="w-[1px] h-4 bg-[#E2E8F0] mx-0.5" />

              {/* High Contrast Toggle */}
              <button
                type="button"
                onClick={toggleHighContrast}
                aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
                aria-pressed={highContrast}
                title="Toggle High Contrast Mode"
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  highContrast 
                    ? 'bg-black text-white font-bold ring-2 ring-black' 
                    : 'text-[#64748B] hover:bg-white hover:text-[#111D35] hover:shadow-xs'
                }`}
              >
                <SunMoon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline text-xs">Contrast</span>
              </button>

              <div className="w-[1px] h-4 bg-[#E2E8F0] mx-0.5" />

              {/* Unobtrusive Accessibility Settings Control (Replaces old Listen button) */}
              <div className="relative" ref={a11yMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowA11yModal(prev => !prev)}
                  aria-expanded={showA11yModal}
                  aria-haspopup="dialog"
                  aria-label="Open Accessibility & Speech Settings"
                  title="Accessibility & Speech Settings"
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    showA11yModal || hoverToSpeech 
                      ? 'bg-[#EAF3FF] text-[#1677F8]' 
                      : 'text-[#64748B] hover:bg-white hover:text-[#111D35] hover:shadow-xs'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden md:inline text-xs">A11y</span>
                </button>

                {/* Accessibility Settings Popover */}
                {showA11yModal && (
                  <div 
                    role="dialog"
                    aria-label="Accessibility Settings"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#1677F8]" />
                        <h3 className="font-bold text-[#111D35]">Accessibility Settings</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowA11yModal(false)}
                        aria-label="Close settings"
                        className="text-[#64748B] hover:text-[#111D35] p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Hover to Speech Toggle */}
                    <div className="space-y-1">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-[#111D35]">Hover-to-Speech</span>
                        <input
                          type="checkbox"
                          checked={hoverToSpeech}
                          onChange={(e) => setHoverToSpeech(e.target.checked)}
                          className="w-4 h-4 text-[#1677F8] rounded border-[#CBD5E1] focus-visible:ring-[#1677F8]"
                        />
                      </label>
                      <p className="text-[11px] text-[#64748B]">
                        Reads text aloud when hovering mouse for ~600ms. Press <strong>Alt+S</strong> to read focused item.
                      </p>
                    </div>

                    {/* Speech Rate Slider */}
                    {isSpeechSupported && (
                      <div className="space-y-1 pt-1 border-t border-[#E2E8F0]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#111D35]">Speech Rate</span>
                          <span className="font-mono text-[#1677F8]">{speechRate}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.75"
                          max="1.3"
                          step="0.05"
                          value={speechRate}
                          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                          aria-label="Speech playback rate"
                          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1677F8]"
                        />
                      </div>
                    )}

                    {/* High Contrast info */}
                    <div className="pt-1 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                      <p>
                        High contrast mode uses pure contrast borders and black/white high-visibility text.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Role Switcher & User Profile Dropdown */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={showRoleMenu}
                aria-label={`Logged in as ${user?.name || 'User'} (${user?.roleLabel || 'Demo'}). Click to switch role or sign out.`}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#1677F8]/40 bg-[#F5F7FB] hover:bg-white transition-all text-left edge-lighting"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1677F8] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.avatar || 'U'}
                </div>
                <div className="hidden md:block leading-tight pr-1">
                  <p className="text-xs font-bold text-[#111D35] line-clamp-1">{user?.name}</p>
                  <p className="text-[10px] text-[#1677F8] font-semibold">
                    {user?.roleLabel || user?.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
              </button>

              {/* Role Switcher Menu */}
              {showRoleMenu && (
                <div 
                  role="menu" 
                  aria-label="Demo Persona Switcher"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1.5 border-b border-[#E2E8F0]">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Demo Role Switcher
                    </p>
                    <p className="text-[11px] text-[#111D35]">
                      Switch personas to test role-specific workflows:
                    </p>
                  </div>

                  <div className="p-1.5 space-y-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { switchRole('admin'); setShowRoleMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-all ${
                        user?.role === 'admin' 
                          ? 'bg-[#EAF3FF] text-[#1677F8] font-bold' 
                          : 'hover:bg-[#F5F7FB] text-[#111D35]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#1677F8]" />
                        <span>Admin (Full Access)</span>
                      </span>
                      {user?.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-[#1677F8]" />}
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { switchRole('staff'); setShowRoleMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-all ${
                        user?.role === 'internal_staff' 
                          ? 'bg-[#EAF3FF] text-[#1677F8] font-bold' 
                          : 'hover:bg-[#F5F7FB] text-[#111D35]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span>Staff (Operations)</span>
                      </span>
                      {user?.role === 'internal_staff' && <CheckCircle2 className="w-3.5 h-3.5 text-[#1677F8]" />}
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { switchRole('customer'); setShowRoleMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-all ${
                        user?.role === 'customer' 
                          ? 'bg-[#EAF3FF] text-[#1677F8] font-bold' 
                          : 'hover:bg-[#F5F7FB] text-[#111D35]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Customer (Portal)</span>
                      </span>
                      {user?.role === 'customer' && <CheckCircle2 className="w-3.5 h-3.5 text-[#1677F8]" />}
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-[#E2E8F0] px-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out (Clear Session)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
