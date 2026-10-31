import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  SunMoon, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Shield, 
  UserCheck, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth, DEFAULT_USERS } from '../../context/AuthContext';
import { checkBackendHealth } from '../../services/api';

export default function Navbar() {
  const { 
    highContrast, 
    toggleHighContrast, 
    textSize, 
    changeTextSize, 
    speak, 
    stopSpeaking, 
    isSpeaking 
  } = useAccessibility();

  const { user, switchRole, logout } = useAuth();
  const [backendStatus, setBackendStatus] = useState({ isLive: false, checking: true });
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function testBackend() {
      setBackendStatus(prev => ({ ...prev, checking: true }));
      const res = await checkBackendHealth();
      if (mounted) {
        setBackendStatus({ isLive: res.isLive, checking: false });
      }
    }
    testBackend();
    const interval = setInterval(testBackend, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleReadAloudToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const mainContent = document.getElementById('main-content');
      const textToRead = mainContent 
        ? mainContent.innerText.slice(0, 500) 
        : 'Welcome to Brightloop Subscription Management System.';
      speak(textToRead);
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header 
        role="banner" 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <RefreshCw className="w-5 h-5 animate-[spin_10s_linear_infinite]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Brightloop
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-sky-100 text-sky-800 rounded">
                  SubSync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Unified Subscription & Billing Engine
              </p>
            </div>
          </div>

          {/* Accessibility & Connection Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend status indicator */}
            <div 
              title={backendStatus.isLive ? 'Connected to FastAPI Backend' : 'Running in Offline / Demo Mock Mode'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-slate-200 bg-slate-50 text-slate-700"
            >
              {backendStatus.isLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium text-emerald-800">API Live</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-600">Demo Mode</span>
                </>
              )}
            </div>

            {/* Accessibility Toolbar */}
            <div 
              role="toolbar" 
              aria-label="Accessibility options" 
              className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200"
            >
              {/* Font Size Scaling */}
              <div className="flex items-center" title="Adjust text size">
                <button
                  type="button"
                  onClick={() => changeTextSize('normal')}
                  aria-label="Normal text size"
                  aria-pressed={textSize === 'normal'}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    textSize === 'normal' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => changeTextSize('large')}
                  aria-label="Large text size"
                  aria-pressed={textSize === 'large'}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    textSize === 'large' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => changeTextSize('xlarge')}
                  aria-label="Extra large text size"
                  aria-pressed={textSize === 'xlarge'}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    textSize === 'xlarge' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A++
                </button>
              </div>

              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

              {/* High Contrast Toggle */}
              <button
                type="button"
                onClick={toggleHighContrast}
                aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
                aria-pressed={highContrast}
                title="Toggle High Contrast Mode"
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
                  highContrast 
                    ? 'bg-black text-white font-bold ring-2 ring-black' 
                    : 'text-slate-700 hover:bg-white hover:shadow-xs'
                }`}
              >
                <SunMoon className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline text-xs">Contrast</span>
              </button>

              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

              {/* Read Aloud Button */}
              <button
                type="button"
                onClick={handleReadAloudToggle}
                aria-label={isSpeaking ? 'Stop read aloud' : 'Read screen text aloud'}
                aria-pressed={isSpeaking}
                title="Read Screen Aloud (Text-to-Speech)"
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${
                  isSpeaking 
                    ? 'bg-sky-600 text-white animate-pulse' 
                    : 'text-slate-700 hover:bg-white hover:shadow-xs'
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-white" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline text-xs">
                  {isSpeaking ? 'Stop' : 'Listen'}
                </span>
              </button>
            </div>

            {/* Role Switcher & User Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={showRoleMenu}
                aria-label={`Logged in as ${user?.name || 'User'}. Click to switch role.`}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.avatar || 'U'}
                </div>
                <div className="hidden md:block leading-tight pr-1">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{user?.name}</p>
                  <p className="text-[10px] text-sky-700 font-medium capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </button>

              {/* Role Switcher Menu */}
              {showRoleMenu && (
                <div 
                  role="menu" 
                  aria-label="Switch User Role for Hackathon Demo"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Demo Role Switcher
                    </p>
                    <p className="text-xs text-slate-600">
                      Switch personas to test role-based permissions:
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { switchRole('admin'); setShowRoleMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left ${
                        user?.role === 'admin' ? 'bg-sky-50 text-sky-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-sky-600" />
                        Admin (Full Control)
                      </span>
                      {user?.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { switchRole('staff'); setShowRoleMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left ${
                        user?.role === 'internal_staff' ? 'bg-sky-50 text-sky-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        Staff (Operations)
                      </span>
                      {user?.role === 'internal_staff' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { switchRole('customer'); setShowRoleMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left ${
                        user?.role === 'customer' ? 'bg-sky-50 text-sky-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Customer (Self-service)
                      </span>
                      {user?.role === 'customer' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
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

