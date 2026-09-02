'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  useWhiteFoxStore,
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
  GARMENT_STATUS_LABELS,
} from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shirt, Package, Truck, LogOut } from 'lucide-react';

/* ──────────────── Set Card ──────────────── */
function SetCard({
  label,
  badge,
  assetId,
  description,
  washCount,
  locInfo,
  borderColor,
  bgColor,
  badgeClass,
  tagClass,
}: {
  label: string;
  badge: string;
  assetId: string;
  description: string;
  washCount: number;
  locInfo: string;
  borderColor: string;
  bgColor: string;
  badgeClass: string;
  tagClass: string;
}) {
  return (
    <div className={cn('p-5 rounded-2xl border space-y-3', borderColor, bgColor)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-bold uppercase tracking-wider', tagClass)}>{label}</span>
        <Badge className={badgeClass}>{badge}</Badge>
      </div>
      <div>
        <p className="text-2xl font-mono font-bold text-foreground">{assetId}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="pt-2 border-t border-current/10 text-xs space-y-1 text-muted-foreground">
        <div className="flex justify-between">
          <span>Total Washes:</span>
          <span className="font-semibold text-foreground font-mono">{washCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Location:</span>
          <span className="font-semibold text-foreground">{locInfo}</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main ──────────────── */
export function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const { employees, tenants, drivers } = useWhiteFoxStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Find this employee in the store — fall back to demo emp-1 (John Smith, ICU)
  const emp = employees.find((e) => e.email === user?.email) ?? employees[0];
  const tenant = tenants.find((t) => t.id === emp?.tenantId);
  const assignedDriver = drivers.find((d) => d.id === tenant?.assignedDriverId);

  if (!user || !emp) return null;

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-card border rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Shirt className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold">My Garments</h1>
            <Badge className={cn(
              user.role === 'EMPLOYEE' ? 'bg-emerald-600' : 'bg-indigo-600',
              'text-white'
            )}>{user.role}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {emp.firstName} {emp.lastName} · <span className="font-mono">{emp.employeeCode}</span> · {emp.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Driver status */}
          {assignedDriver && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/40">
              <Truck className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-semibold">{assignedDriver.name}</p>
                <Badge variant="outline" className={cn('text-[10px]', DRIVER_STATUS_COLORS[assignedDriver.status])}>
                  {DRIVER_STATUS_LABELS[assignedDriver.status]}
                </Badge>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 hover:bg-red-50 border-red-200 gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* ── 3-Set Model Cards ── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shirt className="w-5 h-5 text-blue-600" /> My Personal 3-Set Garment Allocation
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set A (Current Shift) · Set B (Stored in Locker) · Set C (Laundering at WhiteFox)
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">Personal Portal</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SetCard
              label="Set A · In Use"
              badge="Active Shift"
              assetId={emp.setA.assetId}
              description="Scrub Top & Trousers (Size M)"
              washCount={emp.setA.washCount}
              locInfo={`${emp.department} Ward`}
              borderColor="border-blue-200"
              bgColor="bg-blue-50/50 dark:bg-blue-950/30"
              badgeClass="bg-blue-600 text-white"
              tagClass="text-blue-700"
            />
            <SetCard
              label="Set B · In Locker"
              badge="Ready for Swap"
              assetId={emp.setB.assetId}
              description="Clean & Pressed in Locker"
              washCount={emp.setB.washCount}
              locInfo={`Locker #${emp.employeeCode.slice(-3)}`}
              borderColor="border-emerald-200"
              bgColor="bg-emerald-50/50 dark:bg-emerald-950/30"
              badgeClass="bg-emerald-600 text-white"
              tagClass="text-emerald-700"
            />
            <SetCard
              label="Set C · In Laundry"
              badge="At WhiteFox"
              assetId={emp.setC.assetId}
              description="Under Wash & Disinfection"
              washCount={emp.setC.washCount}
              locInfo="WhiteFox Plant"
              borderColor="border-orange-200"
              bgColor="bg-orange-50/50 dark:bg-orange-950/30"
              badgeClass="bg-orange-600 text-white"
              tagClass="text-orange-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Washes (Set A)', value: emp.setA.washCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Washes (Set B)', value: emp.setB.washCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Washes (Set C)', value: emp.setC.washCount, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Sets Allocated', value: 3, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 bg-card shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1 font-mono', s.color)}>{s.value}</p>
            </div>
            <div className={cn('p-2.5 rounded-lg', s.bg)}>
              <Package className={cn('w-5 h-5', s.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Garment Status Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Garment Details</CardTitle>
          <p className="text-xs text-muted-foreground">Current status and wash history for all three sets</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { pos: 'A', set: emp.setA, color: 'bg-blue-100 text-blue-800', label: 'In Use' },
              { pos: 'B', set: emp.setB, color: 'bg-emerald-100 text-emerald-800', label: 'In Locker' },
              { pos: 'C', set: emp.setC, color: 'bg-orange-100 text-orange-800', label: 'In Laundry' },
            ].map(({ pos, set, color, label }) => (
              <div key={pos} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-4">
                  <Badge className={cn('w-10 h-10 flex items-center justify-center text-lg font-bold rounded-full', color)}>
                    {pos}
                  </Badge>
                  <div>
                    <p className="font-mono font-bold text-sm">{set.assetId}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{GARMENT_STATUS_LABELS[set.status] ?? set.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Washes</p>
                  <p className="font-mono font-bold text-lg">{set.washCount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Laundry Status from Driver ── */}
      {assignedDriver && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" /> Your Laundry Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
                {assignedDriver.name[0]}
              </div>
              <div>
                <p className="font-semibold">{assignedDriver.name}</p>
                <p className="text-xs text-muted-foreground">{assignedDriver.vehicleNumber} · {assignedDriver.phone}</p>
              </div>
              <Badge variant="outline" className={cn('ml-auto', DRIVER_STATUS_COLORS[assignedDriver.status])}>
                {DRIVER_STATUS_LABELS[assignedDriver.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}