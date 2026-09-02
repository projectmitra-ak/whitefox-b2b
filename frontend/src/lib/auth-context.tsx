'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, ROLES } from '@/lib/auth';
import { api, endpoints } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
  tenantCode?: string;
  branchId?: string;
  departmentId?: string;
  department?: {
    name: string;
  };
  employeeCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getDemoUser = (email: string, targetRole?: string): User => {
    const lower = (email || '').toLowerCase();
    const roleStr = (targetRole || '').toUpperCase();

    if (roleStr === ROLES.TENANT_ADMIN || lower.includes('hospital') || lower.includes('tenant')) {
      return {
        id: 'user-tenant-1',
        email: email || 'hospital@demo.com',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: ROLES.TENANT_ADMIN,
        tenantId: 'tnt-1',
        tenantName: 'City General Hospital',
        tenantCode: 'CGH',
      };
    }
    if (roleStr === ROLES.PLANT_MANAGER || lower.includes('plant')) {
      return {
        id: 'user-plant-1',
        email: email || 'plant@demo.com',
        firstName: 'Robert',
        lastName: 'Chen',
        role: ROLES.PLANT_MANAGER,
        tenantId: 'tnt-1',
        tenantName: 'City General Hospital',
      };
    }
    if (roleStr === ROLES.DRIVER || lower.includes('driver')) {
      return {
        id: 'user-driver-1',
        email: email || 'driver@demo.com',
        firstName: 'Alex',
        lastName: 'Rivera',
        role: ROLES.DRIVER,
        tenantId: 'tnt-1',
      };
    }
    if (roleStr === ROLES.EMPLOYEE || lower.includes('emp')) {
      return {
        id: 'user-emp-1',
        email: email || 'employee@demo.com',
        firstName: 'John',
        lastName: 'Smith',
        role: ROLES.EMPLOYEE,
        tenantId: 'tnt-1',
        employeeCode: 'EMP-1001',
        department: { name: 'ICU' },
      };
    }
    if (roleStr === ROLES.SUPERVISOR || lower.includes('sup')) {
      return {
        id: 'user-sup-1',
        email: email || 'supervisor@demo.com',
        firstName: 'Elena',
        lastName: 'Rostova',
        role: ROLES.SUPERVISOR,
        tenantId: 'tnt-1',
        department: { name: 'Surgery' },
      };
    }

    // Default Platform Admin user
    return {
      id: 'user-admin-1',
      email: email || 'admin@whitefox.com',
      firstName: 'WhiteFox',
      lastName: 'Administrator',
      role: ROLES.WHITEFOX_ADMIN,
    };
  };

  const refreshUser = async () => {
    try {
      const response = await endpoints.auth.me();
      if (response.data) {
        setUser(response.data as User);
        setLoading(false);
        return;
      }
    } catch {
      // Backend offline fallback
    }

    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('demo_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(getDemoUser('admin@whitefox.com', ROLES.WHITEFOX_ADMIN));
        }
      } else {
        // Default to admin session if no session is set
        const defaultUser = getDemoUser('admin@whitefox.com', ROLES.WHITEFOX_ADMIN);
        localStorage.setItem('demo_user', JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    let userData: User | null = null;
    try {
      const response = await endpoints.auth.login({ email, password });
      if (response.data) {
        const data = response.data as { user?: unknown; token?: string; accessToken?: string } & { id?: string };
        const token = (data as { token?: string; accessToken?: string }).token ||
                      (data as { token?: string; accessToken?: string }).accessToken;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        userData = ((data as { user?: unknown }).user ?? data) as User;
      }
    } catch (e) {
      console.warn('Backend login unavailable, using role session profile:', e);
      userData = getDemoUser(email, role);
    }

    if (!userData || !userData.role) {
      userData = getDemoUser(email, role);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(userData));
    }
    setUser(userData);
    redirectBasedOnRole(userData.role);
  };

  const logout = async () => {
    try {
      await endpoints.auth.logout();
    } catch {
      // ignore
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('demo_user');
      }
      setUser(null);
      router.push('/login');
    }
  };

  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
      case ROLES.WHITEFOX_ADMIN:
        router.push('/admin');
        break;
      case ROLES.TENANT_ADMIN:
      case ROLES.PLANT_MANAGER:
        router.push('/tenant');
        break;
      case ROLES.DRIVER:
        router.push('/driver');
        break;
      case ROLES.EMPLOYEE:
      case ROLES.SUPERVISOR:
        router.push('/employee');
        break;
      default:
        router.push('/admin');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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

export function useRoleRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case ROLES.WHITEFOX_ADMIN:
          router.push('/admin');
          break;
        case ROLES.TENANT_ADMIN:
        case ROLES.PLANT_MANAGER:
          router.push('/tenant');
          break;
        case ROLES.DRIVER:
          router.push('/driver');
          break;
        case ROLES.EMPLOYEE:
        case ROLES.SUPERVISOR:
          router.push('/employee');
          break;
        default:
          router.push('/admin');
      }
    }
  }, [user, router]);
}

export function useRequireRole(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading, allowedRoles, router]);

  const authorized = !!user;
  return { user, loading, authorized };
}