'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  Shield,
  Building2,
  User,
  Truck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

/* ─────────────────── Role definitions ─────────────────── */
const ROLE_OPTIONS = [
  {
    id: ROLES.WHITEFOX_ADMIN,
    label: 'Platform Admin',
    subtitle: 'WhiteFox HQ',
    description: 'Manage multi-tenant contracts, drivers, billing statements & plant analytics',
    icon: Shield,
    defaultEmail: 'admin@whitefox.com',
    defaultPassword: 'admin123',
    gradient: 'from-violet-600 to-indigo-600',
    ring: 'ring-violet-500 border-violet-500 bg-violet-50/50',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    dot: 'bg-violet-600',
    accentText: 'text-violet-600',
    tag: 'Platform HQ',
    portalPath: '/admin',
  },
  {
    id: ROLES.TENANT_ADMIN,
    label: 'Tenant Admin',
    subtitle: 'Hospital / Hostel',
    description: 'Manage staff inventory, 3-set uniforms, driver pickups & commercial invoices',
    icon: Building2,
    defaultEmail: 'hospital@demo.com',
    defaultPassword: 'demo123',
    gradient: 'from-blue-600 to-cyan-600',
    ring: 'ring-blue-500 border-blue-500 bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    accentText: 'text-blue-600',
    tag: 'B2B Client',
    portalPath: '/tenant',
  },
  {
    id: ROLES.EMPLOYEE,
    label: 'Staff Member',
    subtitle: 'Nurse / Doctor / Worker',
    description: 'View personal Set A (In Use), Set B (In Locker), Set C (In Laundry) & wash counts',
    icon: User,
    defaultEmail: 'employee@demo.com',
    defaultPassword: 'demo123',
    gradient: 'from-emerald-600 to-teal-600',
    ring: 'ring-emerald-500 border-emerald-500 bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    accentText: 'text-emerald-600',
    tag: 'Hospital Staff',
    portalPath: '/employee',
  },
  {
    id: ROLES.DRIVER,
    label: 'Logistics Driver',
    subtitle: 'Field Operations',
    description: 'Update live route status (En Route, Picked Up, Delivered) & route allocations',
    icon: Truck,
    defaultEmail: 'driver@demo.com',
    defaultPassword: 'demo123',
    gradient: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-500 border-amber-500 bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    accentText: 'text-amber-600',
    tag: 'Logistics Fleet',
    portalPath: '/driver',
  },
] as const;

type RoleOption = (typeof ROLE_OPTIONS)[number];

/* ─────────────────── Light Background Accents ─────────────────── */
function LightBackgroundAccents() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-violet-100/60 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-emerald-50/80 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

/* ─────────────────── Role Card Component ─────────────────── */
function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: RoleOption;
  selected: boolean;
  onSelect: (role: RoleOption) => void;
}) {
  const Icon = role.icon;
  return (
    <button
      id={`role-card-${role.id.toLowerCase()}`}
      type="button"
      onClick={() => onSelect(role)}
      className={cn(
        'group relative w-full text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer overflow-hidden',
        selected
          ? `ring-2 ${role.ring} shadow-md`
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      )}
    >
      <span
        className={cn(
          'absolute top-3.5 right-3.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
          role.badge
        )}
      >
        {role.tag}
      </span>

      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 bg-gradient-to-br shadow-sm',
          role.gradient
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="flex items-center gap-1.5">
        <p className="text-slate-900 font-bold text-base leading-tight">{role.label}</p>
        {selected && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
      </div>
      <p className="text-slate-500 text-xs font-medium mt-0.5">{role.subtitle}</p>

      <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-2">
        {role.description}
      </p>

      <div className="flex items-center mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-semibold">
        <span className={cn(selected ? role.accentText : 'text-slate-400 group-hover:text-slate-600', 'flex items-center gap-1')}>
          {selected ? 'Portal Selected' : 'Click to select'}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

/* ─────────────────── Main Login Page ─────────────────── */
export default function LoginPage() {
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleOption>(ROLE_OPTIONS[0]);
  const [email, setEmail] = useState<string>(ROLE_OPTIONS[0].defaultEmail);
  const [password, setPassword] = useState<string>(ROLE_OPTIONS[0].defaultPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setEmail(role.defaultEmail);
    setPassword(role.defaultPassword);
    setError('');
  };

  const handleFillDemo = () => {
    setEmail(selectedRole.defaultEmail);
    setPassword(selectedRole.defaultPassword);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login(email, password, selectedRole.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const SelectedIcon = selectedRole.icon;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-10 overflow-hidden text-slate-900">
      <LightBackgroundAccents />

      <div className="relative z-10 w-full max-w-5xl">
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            WhiteFox B2B Laundry Management & RFID Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Sign In to{' '}
            <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
              WhiteFox
            </span>
          </h1>
          <p className="text-slate-500 mt-2.5 text-sm md:text-base max-w-md mx-auto">
            Choose your login role and enter your account credentials
          </p>
        </div>

        {/* ── Main Container ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          {/* ── Left: 4 Role Cards ── */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ROLE_OPTIONS.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                selected={selectedRole.id === role.id}
                onSelect={handleRoleSelect}
              />
            ))}
          </div>

          {/* ── Right: Login Form Card ── */}
          <div className="lg:col-span-2">
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col justify-between">
              <div>
                {/* Selected Role Header */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-sm flex-shrink-0',
                      selectedRole.gradient
                    )}
                  >
                    <SelectedIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-bold text-base leading-tight">{selectedRole.label} Login</p>
                    <p className="text-slate-500 text-xs">{selectedRole.subtitle}</p>
                  </div>
                  <span
                    className={cn(
                      'ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                      selectedRole.badge
                    )}
                  >
                    {selectedRole.tag}
                  </span>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        required
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Demo Credential Shortcut */}
                  <div className="pt-0.5 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleFillDemo}
                      className="text-violet-600 hover:text-violet-800 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Fill demo password
                    </button>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {selectedRole.defaultEmail}
                    </span>
                  </div>

                  {/* Sign In Button */}
                  <button
                    id="btn-sign-in"
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      'w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 mt-3 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 bg-gradient-to-r',
                      selectedRole.gradient
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign In as {selectedRole.label}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Portal path footnote */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs">
                  Directs to <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{selectedRole.portalPath}</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs">
            © {new Date().getFullYear()} WhiteFox Commercial Laundry Platform · Powered by Next.js & Spring Boot · RFID Tracked
          </p>
          <div className="flex items-center justify-center gap-4 mt-2.5">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer',
                  selectedRole.id === role.id
                    ? 'text-slate-800 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', role.dot)} />
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}