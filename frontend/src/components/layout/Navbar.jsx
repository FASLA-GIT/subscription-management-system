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
  Settings, 
  Volume2, 
  VolumeX,
  ChevronDown, 
  Menu, 
  X, 
  KeyRound, 
  SlidersHorizontal 
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import SwitchRoleModal from '../common/SwitchRoleModal';

export default function Navbar({ onToggleMobileSidebar }) {
  const { 
    highContrast, 
    toggleHighContrast, 
    textSize, 
    changeTextSize, 
    hoverToSpeech, 
    toggleHoverToSpeech, 
    speechRate, 
    setSpeechRate, 
    isSpeechSupported 
  } = useAccessibility();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showA11yModal, setShowA11yModal] = useState(false);
  const [showSwitchRoleModal, setShowSwitchRoleModal] = useState(false);

  const roleMenuRef = useRef(null);
  const a11yMenuRef = useRef(null);

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
              <div className="w-8 h-8 rounded-xl bg-[#0B1426] flex items-center justify-center text-white border border-slate-700 shadow-xs transition-transform group-hover:scale-105">
                <RefreshCw className="w-4 h-4 text-[#1677F8] animate-[spin_12s_linear_infinite]" aria-hidden="true" />
              </div>
              <div className="leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-[#0B1426]">
                    BRIGHTLOOP
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] uppercase font-black tracking-widest bg-[#EAF3FF] text-[#1677F8] rounded border border-[#1677F8]/20">
                    SMS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
                  Subscription Management System
                </span>
              </div>
            </Link>
          </div>

          {/* Right Controls: Audio Reader Toggle, Accessibility & Authenticated User */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Top Bar Dedicated Audio / Text Reader Option */}
            <button
              type="button"
              onClick={toggleHoverToSpeech}
              aria-pressed={hoverToSpeech}
              title={hoverToSpeech ? "Audio Text Reader is ON (Click to turn OFF)" : "Audio Text Reader is OFF (Click to turn ON)"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                hoverToSpeech 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400 shadow-xs' 
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {hoverToSpeech ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="hidden sm:inline">Text Reader:</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                    ON
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Text Reader:</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    OFF
                  </span>
                </>
              )}
            </button>

            {/* Accessibility Quick Controls (Text Size & Contrast) */}
            <div 
              role="toolbar" 
              aria-label="Accessibility display options" 
              className="hidden md:flex items-center gap-1 bg-[#F5F7FB] p-1 rounded-xl border border-[#E2E8F0]"
            >
              {/* Font Size Scaling */}
              <div className="flex items-center" title="Adjust workspace text size">
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
                <span className="hidden xl:inline text-xs">Contrast</span>
              </button>

              {/* Speech Rate & Accessibility Settings */}
              <div className="relative" ref={a11yMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowA11yModal(prev => !prev)}
                  aria-expanded={showA11yModal}
                  aria-haspopup="dialog"
                  aria-label="Speech rate settings"
                  title="Speech rate & audio settings"
                  className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    showA11yModal 
                      ? 'bg-[#EAF3FF] text-[#1677F8]' 
                      : 'text-[#64748B] hover:bg-white hover:text-[#111D35]'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                </button>

                {showA11yModal && (
                  <div 
                    role="dialog"
                    aria-label="Audio reader settings"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-50 text-xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#1677F8]" />
                        <h3 className="font-bold text-[#111D35]">Audio Reader Settings</h3>
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

                    <div className="space-y-1">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-[#111D35]">Audio Narration</span>
                        <input
                          type="checkbox"
                          checked={hoverToSpeech}
                          onChange={toggleHoverToSpeech}
                          className="w-4 h-4 text-[#1677F8] rounded border-[#CBD5E1]"
                        />
                      </label>
                      <p className="text-[11px] text-[#64748B]">
                        Reads items when hovering mouse or pressing <strong>Alt+S</strong>.
                      </p>
                    </div>

                    {isSpeechSupported && (
                      <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#111D35]">Speech Playback Rate</span>
                          <span className="font-mono text-[#1677F8] font-bold">{speechRate}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.75"
                          max="1.4"
                          step="0.05"
                          value={speechRate}
                          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                          aria-label="Speech playback rate"
                          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#1677F8]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Authenticated User Profile & Protected Switch Role Menu */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={showRoleMenu}
                aria-label={`Logged in as ${user?.name || 'User'} (${user?.roleLabel || 'Member'}).`}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#1677F8]/40 bg-[#F8FAFC] hover:bg-white transition-all text-left shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0B1426] text-white flex items-center justify-center font-bold text-xs border border-slate-700">
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

              {/* Secure User Menu with Password-Protected Role Switch */}
              {showRoleMenu && (
                <div 
                  role="menu" 
                  aria-label="User Account Menu"
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* Account Header */}
                  <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]/80">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        Authenticated Session
                      </span>
                    </div>
                    <p className="text-xs font-black text-[#111D35]">{user?.name}</p>
                    <p className="text-[11px] text-[#64748B] font-mono truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] text-[#1677F8]">
                      {user?.role === 'admin' ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : user?.role === 'internal_staff' ? (
                        <UserCheck className="w-3 h-3" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      <span>{user?.roleLabel || user?.role}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2 space-y-1">
                    <Link
                      to="/app/settings"
                      role="menuitem"
                      onClick={() => setShowRoleMenu(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-slate-700 hover:bg-[#F5F7FB] transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Workspace Settings</span>
                    </Link>

                    {/* Secure Role Switch with Password Gate */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowSwitchRoleModal(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-slate-700 hover:bg-[#EAF3FF] hover:text-[#1677F8] transition-colors font-medium"
                    >
                      <span className="flex items-center gap-2.5">
                        <KeyRound className="w-4 h-4 text-[#1677F8]" />
                        <span>Switch Account / Role...</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100">
                        Auth Required
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] px-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out (Terminate Session)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Re-Authentication Gate for Switching Roles */}
      <SwitchRoleModal 
        isOpen={showSwitchRoleModal} 
        onClose={() => setShowSwitchRoleModal(false)} 
      />
    </>
  );
}
