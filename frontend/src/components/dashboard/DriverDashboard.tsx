'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  useWhiteFoxStore,
  type DriverStatus,
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
} from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  LogOut,
  Clock,
  Navigation,
  Package,
  CheckCircle2,
  Circle,
  MapPin,
  Building2,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MasterPickupCalendar } from '@/components/calendar/MasterPickupCalendar';

/* ──────────────── Status config ──────────────── */
const STATUS_OPTIONS: {
  value: DriverStatus;
  label: string;
  description: string;
  icon: React.ElementType;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  dotColor: string;
}[] = [
  {
    value: 'OFF_DUTY',
    label: 'Off Duty',
    description: 'Not on shift',
    icon: Circle,
    activeBg: 'bg-gray-700',
    activeText: 'text-white',
    activeBorder: 'border-gray-600',
    dotColor: 'bg-gray-400',
  },
  {
    value: 'WAITING',
    label: 'Waiting',
    description: 'At base, ready for assignment',
    icon: Clock,
    activeBg: 'bg-yellow-500',
    activeText: 'text-yellow-950',
    activeBorder: 'border-yellow-400',
    dotColor: 'bg-yellow-400',
  },
  {
    value: 'EN_ROUTE_PICKUP',
    label: 'En Route to Pickup',
    description: 'Driving to hospital/tenant',
    icon: Navigation,
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    activeBorder: 'border-blue-500',
    dotColor: 'bg-blue-400',
  },
  {
    value: 'PICKED_UP',
    label: 'Picked Up',
    description: 'Collected laundry, heading to plant',
    icon: Package,
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
    activeBorder: 'border-orange-400',
    dotColor: 'bg-orange-400',
  },
  {
    value: 'ON_THE_WAY',
    label: 'On the Way',
    description: 'Delivering clean laundry',
    icon: Truck,
    activeBg: 'bg-purple-600',
    activeText: 'text-white',
    activeBorder: 'border-purple-500',
    dotColor: 'bg-purple-400',
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
    description: 'Delivery complete',
    icon: CheckCircle2,
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    activeBorder: 'border-emerald-500',
    dotColor: 'bg-emerald-400',
  },
];

/* ──────────────── Main ──────────────── */
export function DriverDashboard() {
  const { user, logout } = useAuth();
  const { drivers, tenants, pickupRequests, setDriverStatus } = useWhiteFoxStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Find this driver — fall back to demo driver drv-1
  const driver = drivers.find((d) => d.email === user?.email) ?? drivers[0];
  const assignedTenant = tenants.find((t) => t.id === driver?.assignedTenantId);

  if (!user || !driver) return null;

  const currentStatusConfig = STATUS_OPTIONS.find((s) => s.value === driver.status) ?? STATUS_OPTIONS[0];

  const handleStatusChange = (newStatus: DriverStatus) => {
    setDriverStatus(driver.id, newStatus);
    toast.success(`Status updated: ${DRIVER_STATUS_LABELS[newStatus]}`);
  };

  // Pickups assigned to this driver
  const myPickups = pickupRequests.filter((p) => p.assignedDriverId === driver.id);
  const upcomingPickups = myPickups.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-card border rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <Badge className="bg-amber-600 text-white">Driver</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {driver.name} · <span className="font-mono">{driver.vehicleNumber ?? 'No vehicle'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn('text-sm px-3 py-1', DRIVER_STATUS_COLORS[driver.status])}>
            {DRIVER_STATUS_LABELS[driver.status]}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 hover:bg-red-50 border-red-200 gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* ── Assigned Tenant Info ── */}
      {assignedTenant && (
        <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Assigned Tenant</p>
              <p className="font-bold text-lg">{assignedTenant.name}</p>
              <p className="text-xs text-muted-foreground">{assignedTenant.code} · {assignedTenant.city} · SLA: {assignedTenant.slaHours}h</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground">Total Garments</p>
              <p className="font-mono font-bold text-xl text-blue-700">{assignedTenant.totalGarments}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Live Status Update Panel ── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" /> Update Your Live Status
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your status is visible to tenant admins and employees in real time
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/40">
              <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', currentStatusConfig.dotColor)} />
              <span className="text-sm font-semibold">{currentStatusConfig.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = driver.status === opt.value;
              return (
                <button
                  key={opt.value}
                  id={`status-btn-${opt.value.toLowerCase()}`}
                  onClick={() => handleStatusChange(opt.value)}
                  className={cn(
                    'relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer',
                    isActive
                      ? `${opt.activeBg} ${opt.activeText} ${opt.activeBorder} shadow-lg scale-[1.02]`
                      : 'bg-card border-border hover:border-muted-foreground/40 hover:shadow-md hover:scale-[1.01]'
                  )}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-widest opacity-70">
                      CURRENT
                    </span>
                  )}
                  <div className={cn('p-2 rounded-xl', isActive ? 'bg-white/20' : 'bg-muted')}>
                    <Icon className={cn('w-5 h-5', isActive ? opt.activeText : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <p className={cn('font-bold text-sm', isActive ? opt.activeText : 'text-foreground')}>{opt.label}</p>
                    <p className={cn('text-[11px] mt-0.5 leading-tight', isActive ? `${opt.activeText} opacity-80` : 'text-muted-foreground')}>
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            ⚡ Status updates instantly reflect in the Tenant Admin and Employee portals
          </p>
        </CardContent>
      </Card>

      {/* ── Today's Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pickups Today', value: 3, color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
          { label: 'Deliveries Today', value: 2, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Garments Collected', value: 148, color: 'text-orange-600', bg: 'bg-orange-50', icon: Truck },
          { label: 'Upcoming Pickups', value: upcomingPickups.length, color: 'text-violet-600', bg: 'bg-violet-50', icon: Calendar },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border p-4 bg-card shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={cn('text-2xl font-bold mt-1', stat.color)}>{stat.value}</p>
            </div>
            <div className={cn('p-2.5 rounded-lg', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs: Status + Pickup Calendar ── */}
      <Tabs defaultValue="status">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="status" className="gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Live Status
          </TabsTrigger>
          <TabsTrigger value="pickups" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Pickup Schedule ({upcomingPickups.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Status Tab ── */}
        <TabsContent value="status" className="mt-4">
          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '09:15 AM', action: 'Status set to En Route to Pickup', color: 'bg-blue-500' },
                  { time: '09:45 AM', action: 'Arrived at City General Hospital — ICU Wing', color: 'bg-orange-500' },
                  { time: '10:10 AM', action: 'RFID scan: 74 garments collected', color: 'bg-orange-500' },
                  { time: '10:30 AM', action: 'Picked Up — driving to WhiteFox Plant', color: 'bg-purple-500' },
                  { time: '11:20 AM', action: 'Delivered 92 clean garments to Hospital', color: 'bg-emerald-500' },
                ].map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', entry.color)} />
                    <div>
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground font-mono">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pickup Schedule Tab ── */}
        <TabsContent value="pickups" className="mt-4">
          <MasterPickupCalendar mode="DRIVER" driverId={driver.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}