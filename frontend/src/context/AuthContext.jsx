import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_USERS = {
  admin: {
    id: 1,
    name: 'Aarav Sharma',
    email: 'admin@brightloop.com',
    role: 'admin',
    roleLabel: 'System Administrator',
    title: 'Enterprise Billing Administrator',
    avatar: 'A',
    homeRoute: '/app',
  },
  staff: {
    id: 2,
    name: 'Priya Patel',
    email: 'priya.staff@brightloop.com',
    role: 'internal_staff',
    roleLabel: 'Operations Staff',
    title: 'Customer & Billing Specialist',
    avatar: 'P',
    homeRoute: '/app',
  },
  customer: {
    id: 3,
    name: 'Rahul Verma',
    company: 'Acme Technologies Ltd',
    email: 'rahul@acmecorp.in',
    role: 'customer',
    roleLabel: 'Customer Client',
    title: 'Corporate Subscriber',
    customerId: 1,
    avatar: 'R',
    homeRoute: '/app',
  },
};

export function validatePassword(password) {
  const errors = [];
  if (!password || password.length <= 8) {
    errors.push('Password must be more than 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter (a-z).');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Must contain at least one special character (!@#$%...).');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function AuthProvider({ children }) {
  // Use sessionStorage for demo mode session state
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('brightloop_demo_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    // Default to admin for immediate convenience in demo evaluations
    return DEFAULT_USERS.admin;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('brightloop_demo_token') || 'demo-jwt-token';
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('brightloop_demo_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('brightloop_demo_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('brightloop_demo_token', token);
    } else {
      sessionStorage.removeItem('brightloop_demo_token');
    }
  }, [token]);

  // Demo Sign-In
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check matched predefined demo role
    let matched = Object.values(DEFAULT_USERS).find(
      u => u.email.toLowerCase() === cleanEmail
    );

    if (!matched) {
      // Dynamic fallback for custom email demo
      const role = cleanEmail.includes('admin')
        ? 'admin'
        : cleanEmail.includes('staff')
        ? 'internal_staff'
        : 'customer';

      matched = {
        id: Date.now(),
        name: email.split('@')[0],
        email: cleanEmail,
        role,
        roleLabel: role === 'admin' ? 'Administrator' : role === 'internal_staff' ? 'Staff' : 'Customer',
        title: 'Demo Session User',
        avatar: (email.charAt(0) || 'U').toUpperCase(),
        homeRoute: '/app',
      };
    }

    setUser(matched);
    const mockToken = `demo-token-${matched.role}-${Date.now()}`;
    setToken(mockToken);
    return { success: true, user: matched };
  };

  const loginAsRole = (roleKey) => {
    const matched = DEFAULT_USERS[roleKey] || DEFAULT_USERS.admin;
    setUser(matched);
    setToken(`demo-token-${matched.role}-${Date.now()}`);
    return matched;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('brightloop_demo_user');
    sessionStorage.removeItem('brightloop_demo_token');
  };

  const switchRole = (roleKey) => {
    if (DEFAULT_USERS[roleKey]) {
      const newUser = DEFAULT_USERS[roleKey];
      setUser(newUser);
      setToken(`demo-token-${roleKey}-${Date.now()}`);
      sessionStorage.setItem('brightloop_demo_user', JSON.stringify(newUser));
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'internal_staff' || user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginAsRole,
        logout,
        switchRole,
        isAdmin,
        isStaff,
        isCustomer,
        DEFAULT_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
