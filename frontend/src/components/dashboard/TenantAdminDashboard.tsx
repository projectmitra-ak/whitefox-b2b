'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  useWhiteFoxStore,
  type WfEmployee,
  type CleaningPref,
  type Invoice,
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_COLORS,
  GARMENT_STATUS_LABELS,
} from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Package,
  Truck,
  AlertCircle,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Shirt,
  AlertTriangle,
  Search,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ──────────────── Garment set status badge ──────────────── */
function GarmentBadge({ item }: { item: WfEmployee['setA'] }) {
  const colorMap: Record<string, string> = {
    IN_USE: 'bg-blue-100 text-blue-800 border-blue-300',
    IN_LOCKER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    IN_LAUNDRY: 'bg-orange-100 text-orange-800 border-orange-300',
    WASHING: 'bg-orange-100 text-orange-800 border-orange-300',
    QC_PASSED: 'bg-green-100 text-green-800 border-green-300',
    PACKED: 'bg-purple-100 text-purple-800 border-purple-300',
    MISSING: 'bg-red-100 text-red-800 border-red-300',
    REPAIR: 'bg-amber-100 text-amber-800 border-amber-300',
  };
  return (
    <div className="space-y-0.5">
      <span className="font-mono text-xs font-semibold text-foreground block">{item.assetId}</span>
      <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', colorMap[item.status] ?? '')}>
        {GARMENT_STATUS_LABELS[item.status] ?? item.status} · {item.washCount} washes
      </Badge>
    </div>
  );
}

/* ──────────────── Employee Form Modal (Add / Edit) ──────────────── */
function EmployeeModal({
  open,
  onClose,
  tenantId,
  tenantCode,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  tenantCode: string;
  initial?: WfEmployee;
}) {
  const { addEmployee, updateEmployee } = useWhiteFoxStore();
  const isEdit = !!initial;

  const defaultNum = Math.floor(1000 + Math.random() * 9000);
  const blankForm: Omit<WfEmployee, 'id'> = {
    tenantId,
    employeeCode: `EMP-${defaultNum}`,
    firstName: '',
    lastName: '',
    email: '',
    department: 'ICU',
    status: 'ACTIVE',
    setA: { assetId: `WF-${tenantCode}-A${defaultNum}`, status: 'IN_USE', washCount: 0 },
    setB: { assetId: `WF-${tenantCode}-B${defaultNum}`, status: 'IN_LOCKER', washCount: 0 },
    setC: { assetId: `WF-${tenantCode}-C${defaultNum}`, status: 'IN_LAUNDRY', washCount: 0 },
  };

  const [form, setForm] = useState<Omit<WfEmployee, 'id'>>(initial ?? blankForm);

  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else {
      setForm(blankForm);
    }
  }, [initial, open]);

  const updateField = (f: string, v: unknown) => setForm((s) => ({ ...s, [f]: v }));
  const updateSet = (setKey: 'setA' | 'setB' | 'setC', f: string, v: unknown) =>
    setForm((s) => ({ ...s, [setKey]: { ...s[setKey], [f]: v } }));

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.employeeCode) {
      toast.error('First name, last name, and employee code are required');
      return;
    }
    if (isEdit && initial) {
      updateEmployee(initial.id, form);
      toast.success(`Employee ${form.firstName} ${form.lastName} updated`);
    } else {
      addEmployee(form);
      toast.success(`Employee ${form.firstName} ${form.lastName} added with 3-set uniforms`);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {isEdit ? 'Edit Employee & Garment Sets' : 'Add New Employee'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employee Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Employee Code *</Label>
              <Input
                value={form.employeeCode}
                onChange={(e) => updateField('employeeCode', e.target.value)}
                placeholder="EMP-1001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john.smith@hospital.org"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => updateField('department', v)}>
                <SelectContent>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Surgery">Surgery</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Front Desk">Front Desk</SelectItem>
                  <SelectItem value="General Ward">General Ward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Employment Status</Label>
              <Select value={form.status || 'ACTIVE'} onValueChange={(v) => updateField('status', v)}>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3-Set Uniform Configuration */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3-Set Garment Assignment & RFID Tags
            </h4>

            {/* Set A */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 grid grid-cols-3 gap-3 items-center">
              <div>
                <p className="text-xs font-bold text-blue-700">Set A (In Use)</p>
                <p className="text-[11px] text-muted-foreground">Shift uniform</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Asset ID</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={form.setA.assetId}
                  onChange={(e) => updateSet('setA', 'assetId', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Wash Count</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={form.setA.washCount}
                  onChange={(e) => updateSet('setA', 'washCount', Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            {/* Set B */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 grid grid-cols-3 gap-3 items-center">
              <div>
                <p className="text-xs font-bold text-emerald-700">Set B (In Locker)</p>
                <p className="text-[11px] text-muted-foreground">Clean buffer</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Asset ID</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={form.setB.assetId}
                  onChange={(e) => updateSet('setB', 'assetId', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Wash Count</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={form.setB.washCount}
                  onChange={(e) => updateSet('setB', 'washCount', Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            {/* Set C */}
            <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 dark:bg-orange-950/20 grid grid-cols-3 gap-3 items-center">
              <div>
                <p className="text-xs font-bold text-orange-700">Set C (In Laundry)</p>
                <p className="text-[11px] text-muted-foreground">At plant / washing</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Asset ID</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={form.setC.assetId}
                  onChange={(e) => updateSet('setC', 'assetId', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Wash Count</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={form.setC.washCount}
                  onChange={(e) => updateSet('setC', 'washCount', Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
            {isEdit ? 'Save Changes' : 'Add Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Delete Confirm Modal ──────────────── */
function DeleteConfirm({ open, label, onClose, onConfirm }: { open: boolean; label: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Confirm Delete
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Are you sure you want to delete <strong>{label}</strong>? This will remove their assigned garments and update inventory.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Cleaning Preference Modal ──────────────── */
function CleaningPrefModal({
  open,
  onClose,
  tenantId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  initial?: CleaningPref;
}) {
  const { addCleaningPref, updateCleaningPref } = useWhiteFoxStore();
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial ?? { garmentType: '', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY', tenantId }
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial, open]);

  const update = (f: string, v: string) => setForm((s) => ({ ...s, [f]: v }));

  const handleSave = () => {
    if (!form.garmentType) { toast.error('Garment type is required'); return; }
    if (isEdit && initial) { updateCleaningPref(initial.id, form); toast.success('Preference updated'); }
    else { addCleaningPref({ ...form, tenantId }); toast.success('Preference added'); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Cleaning Preference</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Garment Type</Label>
            <Input value={form.garmentType} onChange={(e) => update('garmentType', e.target.value)} placeholder="Scrub Top, Lab Coat…" />
          </div>
          <div className="space-y-1.5">
            <Label>Cleaning Type</Label>
            <Select value={form.cleaningType} onValueChange={(v) => update('cleaningType', v)}>
              <SelectContent>
                <SelectItem value="NORMAL_WASH_IRON">Normal Wash + Iron</SelectItem>
                <SelectItem value="DRY_CLEAN">Dry Clean</SelectItem>
                <SelectItem value="WASH_FOLD">Wash + Fold</SelectItem>
                <SelectItem value="STEAM_CLEAN">Steam Clean</SelectItem>
                <SelectItem value="STARCH_IRON">Starch + Iron</SelectItem>
                <SelectItem value="IRON_ONLY">Iron Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={(v) => update('frequency', v)}>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="ALTERNATE_DAY">Alternate Day</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                <SelectItem value="ON_DEMAND">On Demand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">{isEdit ? 'Save' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Main TenantAdminDashboard ──────────────── */
export function TenantAdminDashboard() {
  const { user, logout } = useAuth();
  const { tenants, drivers, employees, cleaningPrefs, invoices, deleteEmployee, deleteCleaningPref } = useWhiteFoxStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const tenant = tenants.find((t) => t.id === (user?.tenantId ?? 'tnt-1')) ?? tenants[0];
  const assignedDriver = drivers.find((d) => d.id === tenant?.assignedDriverId);
  const tenantEmployees = employees.filter((e) => e.tenantId === (tenant?.id ?? 'tnt-1'));
  const tenantPrefs = cleaningPrefs.filter((p) => p.tenantId === (tenant?.id ?? 'tnt-1'));
  const tenantInvoices = invoices.filter((inv) => inv.tenantId === (tenant?.id ?? 'tnt-1'));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [employeeModal, setEmployeeModal] = useState<{ open: boolean; initial?: WfEmployee }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ open: boolean; label: string; onConfirm: () => void }>({ open: false, label: '', onConfirm: () => {} });
  const [prefModal, setPrefModal] = useState<{ open: boolean; initial?: CleaningPref }>({ open: false });

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredEmployees = tenantEmployees.filter((emp) => {
    const matchSearch = `${emp.firstName} ${emp.lastName} ${emp.employeeCode} ${emp.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'all' || emp.department.toLowerCase() === selectedDept.toLowerCase();
    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(tenantEmployees.map((e) => e.department).filter(Boolean)));

  if (!user || !tenant) return null;

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-card border rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <Badge className="bg-blue-600 text-white">Tenant Admin</Badge>
            <Badge variant="outline">{tenant.code}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{tenant.industry} · {tenant.city} · SLA: {tenant.slaHours}h</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Driver status badge */}
          {assignedDriver ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/40">
              <Truck className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-foreground">{assignedDriver.name}</p>
                <Badge variant="outline" className={cn('text-[10px]', DRIVER_STATUS_COLORS[assignedDriver.status])}>
                  {DRIVER_STATUS_LABELS[assignedDriver.status]}
                </Badge>
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">No driver assigned</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 hover:bg-red-50 border-red-200 gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total Employees', value: tenantEmployees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sets per Employee', value: tenant.setsPerEmployee, icon: Shirt, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Total Garments', value: tenantEmployees.length * tenant.setsPerEmployee, icon: Package, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'In Use (Set A)', value: tenantEmployees.filter(e => e.setA.status === 'IN_USE').length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Locker (Set B)', value: tenantEmployees.filter(e => e.setB.status === 'IN_LOCKER').length, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Laundry (Set C)', value: tenantEmployees.filter(e => e.setC.status === 'IN_LAUNDRY' || e.setC.status === 'WASHING').length, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border p-4 bg-card shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={cn('p-2.5 rounded-lg', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="employees">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="employees">Employees ({tenantEmployees.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({tenantInvoices.length})</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning Preferences</TabsTrigger>
        </TabsList>

        {/* ── Employees Tab ── */}
        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Employee Garment Inventory — 3-Set Status</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Manage employees, track 3-set allocations and cumulative washes</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search employee…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-44 pl-8" />
                </div>
                <div className="w-40">
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={() => setEmployeeModal({ open: true })} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Employee</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead className="text-blue-700">Set A (In Use)</TableHead>
                    <TableHead className="text-emerald-700">Set B (In Locker)</TableHead>
                    <TableHead className="text-orange-700">Set C (In Laundry)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No employees found. Click "Add Employee" to register staff.</TableCell></TableRow>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/40">
                        <TableCell>
                          <p className="font-semibold">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{emp.employeeCode} · {emp.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">{emp.department}</Badge>
                        </TableCell>
                        <TableCell><GarmentBadge item={emp.setA} /></TableCell>
                        <TableCell><GarmentBadge item={emp.setB} /></TableCell>
                        <TableCell><GarmentBadge item={emp.setC} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 cursor-pointer"
                              title="Edit Employee"
                              onClick={() => setEmployeeModal({ open: true, initial: emp })}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 cursor-pointer"
                              title="Delete Employee"
                              onClick={() => setDeleteTarget({
                                open: true,
                                label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`,
                                onConfirm: () => {
                                  deleteEmployee(emp.id);
                                  toast.success(`Employee ${emp.firstName} ${emp.lastName} deleted`);
                                },
                              })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoices Tab ── */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-emerald-600" /> Billing Statements & Invoices</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Commercial laundry invoices and GST breakdowns issued by WhiteFox Admin</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Billing Period</TableHead>
                    <TableHead>Garments Washed</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>GST (18%)</TableHead>
                    <TableHead>Total (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantInvoices.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No invoices issued yet for this billing cycle.</TableCell></TableRow>
                  ) : (
                    tenantInvoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-foreground">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{inv.billingPeriodStart} to {inv.billingPeriodEnd}</TableCell>
                        <TableCell className="font-mono">{inv.totalGarmentsCleaned.toLocaleString()}</TableCell>
                        <TableCell className="font-mono">₹{inv.ratePerWash}/wash</TableCell>
                        <TableCell className="font-mono text-xs">₹{inv.taxAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono font-bold text-base text-foreground">₹{inv.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            inv.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-red-100 text-red-800 border-red-300'
                          )}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{inv.dueDate}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cleaning Preferences Tab ── */}
        <TabsContent value="cleaning" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cleaning Preferences</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Specify preferred cleaning type per garment category for this organization</p>
              </div>
              <Button size="sm" onClick={() => setPrefModal({ open: true })} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Preference
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Garment Type</TableHead>
                    <TableHead>Cleaning Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantPrefs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No preferences set. Click "Add Preference" to begin.</TableCell></TableRow>
                  ) : (
                    tenantPrefs.map((pref) => (
                      <TableRow key={pref.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{pref.garmentType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{pref.cleaningType.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{pref.frequency.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 cursor-pointer" onClick={() => setPrefModal({ open: true, initial: pref })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 cursor-pointer" onClick={() => { deleteCleaningPref(pref.id); toast.success('Preference deleted'); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <EmployeeModal
        open={employeeModal.open}
        onClose={() => setEmployeeModal({ open: false })}
        tenantId={tenant.id}
        tenantCode={tenant.code}
        initial={employeeModal.initial}
      />
      <CleaningPrefModal open={prefModal.open} onClose={() => setPrefModal({ open: false })} tenantId={tenant.id} initial={prefModal.initial} />
      <DeleteConfirm {...deleteTarget} onClose={() => setDeleteTarget((s) => ({ ...s, open: false }))} />
    </div>
  );
}