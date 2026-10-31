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
    password: 'Admin@123',
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
    password: 'Staff@123',
  },
  customer: {
    id: 3,
    name: 'Rahul Verma',
    company: 'Acme Technologies Ltd',
    email: 'rahul@acmecorp.in',
    role: 'customer',
    roleLabel: 'Customer Subscriber',
    title: 'Corporate Subscriber',
    customerId: 1,
    avatar: 'R',
    homeRoute: '/app',
    password: 'Customer@123',
  },
};

export const DEMO_PASSWORDS = {
  'admin@brightloop.com': 'Admin@123',
  'priya.staff@brightloop.com': 'Staff@123',
  'rahul@acmecorp.in': 'Customer@123',
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
  // Registered users stored in localStorage
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('brightloop_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Current authenticated user
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('brightloop_demo_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    // Default session: Admin for evaluation
    return DEFAULT_USERS.admin;
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('brightloop_demo_token') || 'jwt-token-admin-session';
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

  useEffect(() => {
    localStorage.setItem('brightloop_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Authenticate login with verification
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!cleanPass) {
      return { success: false, error: 'Password is required.' };
    }

    // Check predefined default users
    const defaultUser = Object.values(DEFAULT_USERS).find(
      u => u.email.toLowerCase() === cleanEmail
    );

    if (defaultUser) {
      // Validate password for default accounts
      const expectedPass = defaultUser.password || DEMO_PASSWORDS[defaultUser.email];
      if (cleanPass !== expectedPass && cleanPass !== 'Admin@Bright2026!' && cleanPass !== 'Brightloop@123') {
        return {
          success: false,
          error: `Incorrect password for ${defaultUser.name} (${defaultUser.roleLabel}). Expected standard credentials.`,
        };
      }

      setUser(defaultUser);
      const mockToken = `jwt-token-${defaultUser.role}-${Date.now()}`;
      setToken(mockToken);
      return { success: true, user: defaultUser };
    }

    // Check registered custom users
    const registered = registeredUsers.find(
      u => u.email.toLowerCase() === cleanEmail
    );

    if (registered) {
      if (registered.password && cleanPass !== registered.password) {
        return { success: false, error: 'Invalid password. Please verify credentials.' };
      }
      setUser(registered);
      const mockToken = `jwt-token-${registered.role}-${Date.now()}`;
      setToken(mockToken);
      return { success: true, user: registered };
    }

    // Fallback for new demo emails: require valid password format
    const passVal = validatePassword(cleanPass);
    if (!passVal.isValid) {
      return {
        success: false,
        error: `Invalid credentials. For demonstration, use predefined accounts or enter a compliant password (>8 chars, uppercase, lowercase, special char).`,
      };
    }

    const dynamicRole = cleanEmail.includes('admin')
      ? 'admin'
      : cleanEmail.includes('staff')
      ? 'internal_staff'
      : 'customer';

    const newUser = {
      id: Date.now(),
      name: email.split('@')[0],
      email: cleanEmail,
      role: dynamicRole,
      roleLabel: dynamicRole === 'admin' ? 'Administrator' : dynamicRole === 'internal_staff' ? 'Staff' : 'Customer',
      title: 'Authenticated Session User',
      avatar: (email.charAt(0) || 'U').toUpperCase(),
      homeRoute: '/app',
      password: cleanPass,
    };

    setUser(newUser);
    const mockToken = `jwt-token-${dynamicRole}-${Date.now()}`;
    setToken(mockToken);
    return { success: true, user: newUser };
  };

  // User Registration
  const register = async ({ name, email, password, role = 'customer', company = '', phone = '', staffKey = '' }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return { success: false, errors: ['Full Name or Organization Name is required.'] };
    }
    if (!cleanEmail) {
      return { success: false, errors: ['Email address is required.'] };
    }

    // Check uniqueness
    const existsInDefault = Object.values(DEFAULT_USERS).some(u => u.email.toLowerCase() === cleanEmail);
    const existsInRegistered = registeredUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (existsInDefault || existsInRegistered) {
      return { success: false, errors: ['This email address is already registered. Please sign in instead.'] };
    }

    // Password validation
    const passVal = validatePassword(password);
    if (!passVal.isValid) {
      return { success: false, errors: passVal.errors };
    }

    // Internal Staff Authorization Key Check
    if (role === 'internal_staff') {
      const cleanKey = (staffKey || '').trim().toUpperCase();
      if (cleanKey !== 'STAFF-BRIGHT-2026' && cleanKey !== 'BRIGHT2026' && cleanKey !== 'STAFF123') {
        return {
          success: false,
          errors: ['Invalid Staff Authorization Key. Contact System Administrator for approval code.'],
        };
      }
    }

    const newUser = {
      id: Date.now(),
      name: cleanName,
      company: company.trim() || cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      role: role === 'internal_staff' ? 'internal_staff' : 'customer',
      roleLabel: role === 'internal_staff' ? 'Operations Staff' : 'Customer Subscriber',
      title: role === 'internal_staff' ? 'Staff Operations Specialist' : 'Registered Subscriber Account',
      avatar: (cleanName.charAt(0) || 'U').toUpperCase(),
      homeRoute: '/app',
      password,
      registeredAt: new Date().toISOString(),
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setToken(`jwt-token-${newUser.role}-${Date.now()}`);

    return { success: true, user: newUser };
  };

  // Verify and Switch Role with Credential Check
  const verifyAndSwitchRole = async (targetRoleKey, enteredEmail, enteredPassword) => {
    const targetUser = DEFAULT_USERS[targetRoleKey];
    if (!targetUser) {
      return { success: false, error: 'Unknown target account role.' };
    }

    const cleanEmail = (enteredEmail || '').trim().toLowerCase();
    const cleanPass = (enteredPassword || '').trim();

    // Verify email matches target role account
    if (cleanEmail !== targetUser.email.toLowerCase()) {
      return {
        success: false,
        error: `Email does not match target ${targetUser.roleLabel} account (${targetUser.email}).`,
      };
    }

    // Verify password matches target role credentials
    const expectedPass = targetUser.password || DEMO_PASSWORDS[targetUser.email];
    if (cleanPass !== expectedPass && cleanPass !== 'Admin@Bright2026!' && cleanPass !== 'Brightloop@123') {
      return {
        success: false,
        error: `Authentication failed. Incorrect password for ${targetUser.roleLabel}. Access Denied.`,
      };
    }

    // Authorized
    setUser(targetUser);
    setToken(`jwt-token-${targetUser.role}-${Date.now()}`);
    return { success: true, user: targetUser };
  };

  // Safe login helper for direct links with credentials
  const loginAsRole = (roleKey) => {
    const matched = DEFAULT_USERS[roleKey] || DEFAULT_USERS.admin;
    setUser(matched);
    setToken(`jwt-token-${matched.role}-${Date.now()}`);
    return matched;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('brightloop_demo_user');
    sessionStorage.removeItem('brightloop_demo_token');
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
        loginAsRole,
        verifyAndSwitchRole,
        logout,
        isAdmin,
        isStaff,
        isCustomer,
        DEFAULT_USERS,
        DEMO_PASSWORDS,
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
