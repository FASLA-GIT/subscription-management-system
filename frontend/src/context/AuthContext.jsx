import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_USERS = {
  admin: {
    id: 1,
    name: 'Aarav Sharma (Admin)',
    email: 'admin@brightloop.com',
    role: 'admin',
    avatar: 'A',
  },
  staff: {
    id: 2,
    name: 'Priya Patel (Staff)',
    email: 'priya.staff@brightloop.com',
    role: 'internal_staff',
    avatar: 'P',
  },
  customer: {
    id: 3,
    name: 'Rahul Verma (Acme Corp)',
    email: 'rahul@acmecorp.in',
    role: 'customer',
    customerId: 1,
    avatar: 'R',
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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default to admin for seamless hackathon development and testing
    return DEFAULT_USERS.admin;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('brightloop_token') || 'dummy-jwt-token-demo';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('brightloop_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('brightloop_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('brightloop_token', token);
    } else {
      localStorage.removeItem('brightloop_token');
    }
  }, [token]);

  const login = async (email, password) => {
    // In a full run, calls Haaniah's backend POST /api/auth/login
    // Here we support realistic auth with fallback
    let matched = Object.values(DEFAULT_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      // Create dynamically as customer or admin
      matched = {
        id: Date.now(),
        name: email.split('@')[0],
        email,
        role: email.includes('admin') ? 'admin' : (email.includes('staff') ? 'internal_staff' : 'customer'),
        avatar: email.charAt(0).toUpperCase(),
      };
    }
    setUser(matched);
    const mockToken = `jwt-${matched.role}-${Date.now()}`;
    setToken(mockToken);
    return { success: true, user: matched };
  };

  const register = async (name, email, password, role = 'customer') => {
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      role: role === 'admin' ? 'admin' : (role === 'internal_staff' ? 'internal_staff' : 'customer'),
      avatar: name.charAt(0).toUpperCase(),
    };
    setUser(newUser);
    const mockToken = `jwt-${newUser.role}-${Date.now()}`;
    setToken(mockToken);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('brightloop_user');
    localStorage.removeItem('brightloop_token');
  };

  const switchRole = (roleKey) => {
    if (DEFAULT_USERS[roleKey]) {
      setUser(DEFAULT_USERS[roleKey]);
      setToken(`jwt-${roleKey}-token`);
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
        register,
        logout,
        switchRole,
        isAdmin,
        isStaff,
        isCustomer,
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

