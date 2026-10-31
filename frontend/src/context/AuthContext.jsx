import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';

const AuthContext = createContext(null);

export function validatePassword(password) {
  const errors = [];
  if (!password || password.length <= 8) errors.push('Password must be more than 8 characters long.');
  if (!/[A-Z]/.test(password || '')) errors.push('Must contain at least one uppercase letter (A-Z).');
  if (!/[a-z]/.test(password || '')) errors.push('Must contain at least one lowercase letter (a-z).');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password || '')) errors.push('Must contain at least one special character (!@#$%...).');
  return { isValid: errors.length === 0, errors };
}

function normalizeUser(profile) {
  const role = profile.role === 'staff' ? 'internal_staff' : profile.role;
  const name = profile.name || profile.email.split('@')[0];
  const labels = { admin: 'System Administrator', internal_staff: 'Operations Staff', customer: 'Customer' };
  return {
    ...profile,
    name,
    company: profile.company_name || profile.company,
    customerId: profile.customer_id ?? profile.customerId,
    role,
    roleLabel: labels[role] || role,
    avatar: name.charAt(0).toUpperCase(),
    homeRoute: '/app',
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null'); } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearSession = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem('brightloop_demo_token');
    sessionStorage.removeItem('brightloop_demo_user');
    setToken(null);
    setUser(null);
  };

  const acceptProfile = (profile) => {
    const normalized = normalizeUser(profile);
    setUser(normalized);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  };

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await AuthService.me();
        if (mounted) acceptProfile(profile);
      } catch (error) {
        if (mounted && error.response?.status === 401) clearSession();
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    restore();
    const onUnauthorized = () => clearSession();
    window.addEventListener('brightloop:unauthorized', onUnauthorized);
    return () => {
      mounted = false;
      window.removeEventListener('brightloop:unauthorized', onUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const result = await AuthService.login(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token);
    setToken(result.access_token);
    try {
      const profile = await AuthService.me();
      return { success: true, user: acceptProfile(profile) };
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const result = await AuthService.register({ name, email: email.trim().toLowerCase(), password });
      localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token);
      setToken(result.access_token);
      const profile = await AuthService.me();
      return { success: true, user: acceptProfile(profile) };
    } catch (error) {
      return { success: false, errors: [error.response?.data?.detail || error.message || 'Registration failed.'] };
    }
  };

  const logout = clearSession;
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'internal_staff' || user?.role === 'staff' || isAdmin;
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, isAdmin, isStaff, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
