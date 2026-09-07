'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRequireRole } from '@/lib/auth-context';
import { ROLES } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  useWhiteFoxStore,
  type WfTenant,
  type Driver,
  type WfEmployee,
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
  Shield,
  Building2,
  Truck,
  Users,
  Package,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Filter,
  Search,
  FileText,
  DollarSign,
  Calendar,
  Bell,
  Radio,
  Calculator,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RFIDTunnelingStation } from '@/components/rfid/RFIDTunnelingStation';
import { AdminNotificationCenter, AdminLoginNotificationPopup } from '@/components/notifications/AdminNotificationCenter';
import { DetailedBillingView } from '@/components/billing/DetailedBillingView';
import { MasterPickupCalendar } from '@/components/calendar/MasterPickupCalendar';

/* ──────────────── Status Badges ──────────────── */
function statusBadge(status: WfTenant['status']) {
  return status === 'ACTIVE'
    ? 'bg-green-100 text-green-800 border-green-300'
    : status === 'TRIAL'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
    : 'bg-red-100 text-red-800 border-red-300';
}

function GarmentItemBadge({ item }: { item: WfEmployee['setA'] }) {
  const colorMap: Record<string, string> = {
    IN_USE: 'bg-blue-100 text-blue-800 border-blue-300',
    IN_LOCKER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    IN_LAUNDRY: 'bg-orange-100 text-orange-800 border-orange-300',
    WASHING: 'bg-orange-100 text-orange-800 border-orange-300',
    QC_PASSED: 'bg-green-100 text-green-800 border-green-300',
    PACKED: 'bg-purple-100 text-purple-800 border-purple-300',
    MISSING: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
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

/* ──────────────── Tenant Form Modal ──────────────── */
function TenantModal({
  open,
  onClose,
  initial,
  drivers,
}: {
  open: boolean;
  onClose: () => void;
  initial?: WfTenant;
  drivers: Driver[];
}) {
  const { addTenant, updateTenant } = useWhiteFoxStore();
  const isEdit = !!initial;

  const blank: Omit<WfTenant, 'id'> = {
    code: '', name: '', industry: 'HEALTHCARE', email: '', phone: '', city: '',
    employeeCount: 4, setsPerEmployee: 3,
    totalGarments: 12, inUseCount: 4, inLockerCount: 4, inLaundryCount: 3,
    repairCount: 0, missingCount: 0, status: 'ACTIVE', assignedDriverId: null,
    contractStart: new Date().toISOString().slice(0, 10), slaHours: 24,
  };

  const [form, setForm] = useState<Omit<WfTenant, 'id'>>(initial ? { ...initial } : blank);

  useEffect(() => {
    if (initial) setForm(initial);
    else setForm(blank);
  }, [initial, open]);

  const update = (field: string, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleSave = () => {
    if (!form.name || !form.code) {
      toast.error('Name and Code are required');
      return;
    }
    const total = form.employeeCount * form.setsPerEmployee;
    const patchedForm = {
      ...form,
      totalGarments: total,
      inUseCount: form.employeeCount,
      inLockerCount: form.employeeCount,
      inLaundryCount: Math.round(form.employeeCount * 0.8),
    };
    if (isEdit && initial) {
      updateTenant(initial.id, patchedForm);
      toast.success(`Tenant "${form.name}" updated`);
    } else {
      addTenant(patchedForm);
      toast.success(`Tenant "${form.name}" added`);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-600" />
            {isEdit ? 'Edit Tenant' : 'Add New Tenant'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Organization Name *</Label>
            <Input id="t-name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="City General Hospital" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-code">Short Code *</Label>
            <Input id="t-code" value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="CGH" maxLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => update('industry', v)}>
              <SelectContent>
                <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                <SelectItem value="HOSPITALITY">Hospitality</SelectItem>
                <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                <SelectItem value="EDUCATION">Education</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v as WfTenant['status'])}>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-email">Contact Email</Label>
            <Input id="t-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="admin@hospital.org" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-phone">Phone</Label>
            <Input id="t-phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91-22-12345678" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-city">City</Label>
            <Input id="t-city" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Mumbai" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-sla">SLA (hours)</Label>
            <Input id="t-sla" type="number" value={form.slaHours} onChange={(e) => update('slaHours', Number(e.target.value))} min={1} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-emp">Number of Employees</Label>
            <Input id="t-emp" type="number" value={form.employeeCount} onChange={(e) => update('employeeCount', Number(e.target.value))} min={1} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-sets">Uniform Sets per Employee</Label>
            <Input id="t-sets" type="number" value={form.setsPerEmployee} onChange={(e) => update('setsPerEmployee', Number(e.target.value))} min={1} max={5} />
          </div>
          <div className="col-span-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-sm">
            <span className="text-violet-700 dark:text-violet-300 font-semibold">Auto-calculated Total Garments: </span>
            <span className="font-mono font-bold text-foreground">{form.employeeCount * form.setsPerEmployee}</span>
            <span className="text-muted-foreground ml-2">({form.employeeCount} employees × {form.setsPerEmployee} sets)</span>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Assign Driver</Label>
            <Select value={form.assignedDriverId ?? 'none'} onValueChange={(v) => update('assignedDriverId', v === 'none' ? null : v)}>
              <SelectContent>
                <SelectItem value="none">— No Driver —</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.vehicleNumber ?? 'No vehicle'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer">
            {isEdit ? 'Save Changes' : 'Add Tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Driver Form Modal ──────────────── */
function DriverModal({
  open,
  onClose,
  initial,
  tenants,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Driver;
  tenants: WfTenant[];
}) {
  const { addDriver, updateDriver } = useWhiteFoxStore();
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial ?? { name: '', email: '', phone: '', vehicleNumber: '', assignedTenantId: null as string | null, assignedTenantName: '' }
  );

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial, open]);

  const update = (field: string, val: unknown) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    const tenant = tenants.find((t) => t.id === form.assignedTenantId);
    if (isEdit && initial) {
      updateDriver(initial.id, { ...form, assignedTenantName: tenant?.name });
      toast.success('Driver updated');
    } else {
      addDriver({ ...form, assignedTenantName: tenant?.name } as Omit<Driver, 'id' | 'status'>);
      toast.success('Driver added');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            {isEdit ? 'Edit Driver' : 'Add New Driver'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Alex Rivera" />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="driver@whitefox.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="+91-98765-43210" />
          </div>
          <div className="space-y-1.5">
            <Label>Vehicle Number</Label>
            <Input value={form.vehicleNumber ?? ''} onChange={(e) => update('vehicleNumber', e.target.value)} placeholder="MH-12-AB-1234" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Assign to Tenant</Label>
            <Select value={form.assignedTenantId ?? 'none'} onValueChange={(v) => update('assignedTenantId', v === 'none' ? null : v)}>
              <SelectContent>
                <SelectItem value="none">— Unassigned —</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
            {isEdit ? 'Save Changes' : 'Add Driver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Invoice Form Modal (Generate / Add Invoice) ──────────────── */
function InvoiceModal({
  open,
  onClose,
  tenants,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  tenants: WfTenant[];
  initial?: Invoice;
}) {
  const { addInvoice, updateInvoice } = useWhiteFoxStore();
  const isEdit = !!initial;

  const defaultTenant = tenants[0] || { id: 'tnt-1', name: 'City General Hospital', code: 'CGH' };
  const randomInv = `INV-2026-08-${Math.floor(100 + Math.random() * 900)}`;

  const [tenantId, setTenantId] = useState(initial?.tenantId || defaultTenant.id);
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoiceNumber || randomInv);
  const [periodStart, setPeriodStart] = useState(initial?.billingPeriodStart || '2026-08-01');
  const [periodEnd, setPeriodEnd] = useState(initial?.billingPeriodEnd || '2026-08-15');
  const [garmentsCleaned, setGarmentsCleaned] = useState(initial?.totalGarmentsCleaned || 1200);
  const [ratePerWash, setRatePerWash] = useState(initial?.ratePerWash || 18);
  const [expressCharges, setExpressCharges] = useState(initial?.expressCharges || 1000);
  const [disinfectionCharges, setDisinfectionCharges] = useState(initial?.disinfectionCharges || 1500);
  const [status, setStatus] = useState<Invoice['status']>(initial?.status || 'PENDING');
  const [dueDate, setDueDate] = useState(initial?.dueDate || '2026-08-31');
  const [notes, setNotes] = useState(initial?.notes || 'Bi-weekly commercial laundry and barrier sterilization service.');

  const baseAmount = garmentsCleaned * ratePerWash;
  const subtotal = baseAmount + expressCharges + disinfectionCharges;
  const taxGstPercent = 18;
  const taxAmount = (subtotal * taxGstPercent) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSave = () => {
    const matchedTenant = tenants.find((t) => t.id === tenantId) || defaultTenant;
    const invData: Omit<Invoice, 'id'> = {
      invoiceNumber,
      tenantId: matchedTenant.id,
      tenantName: matchedTenant.name,
      tenantCode: matchedTenant.code,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      totalGarmentsCleaned: garmentsCleaned,
      ratePerWash,
      baseAmount,
      expressCharges,
      disinfectionCharges,
      missingGarmentPenalty: initial?.missingGarmentPenalty || 0,
      taxGstPercent,
      taxAmount,
      totalAmount,
      status,
      issuedDate: new Date().toISOString().slice(0, 10),
      dueDate,
      notes,
    };

    if (isEdit && initial) {
      updateInvoice(initial.id, invData);
      toast.success(`Invoice ${invoiceNumber} updated`);
    } else {
      addInvoice(invData);
      toast.success(`Invoice ${invoiceNumber} generated for ${matchedTenant.name}`);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            {isEdit ? 'Edit Invoice Statement' : 'Generate New Tenant Invoice Statement'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Select Tenant Organization *</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Invoice Number *</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Billing Period Start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Billing Period End</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Total Garments Processed</Label>
              <Input
                type="number"
                value={garmentsCleaned}
                onChange={(e) => setGarmentsCleaned(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Base Rate per Wash (₹)</Label>
              <Input
                type="number"
                value={ratePerWash}
                onChange={(e) => setRatePerWash(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Express Logistics Charges (₹)</Label>
              <Input
                type="number"
                value={expressCharges}
                onChange={(e) => setExpressCharges(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Barrier Disinfection Charges (₹)</Label>
              <Input
                type="number"
                value={disinfectionCharges}
                onChange={(e) => setDisinfectionCharges(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Invoice['status'])}>
                <SelectContent>
                  <SelectItem value="PENDING">Pending Payment</SelectItem>
                  <SelectItem value="PAID">Paid / Cleared</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="rounded-xl border bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Base Washing ({garmentsCleaned} items × ₹{ratePerWash})</span>
              <span className="font-mono font-medium text-foreground">₹{baseAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Additional Services (Express + Disinfection)</span>
              <span className="font-mono font-medium text-foreground">₹{(expressCharges + disinfectionCharges).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground border-t pt-1">
              <span>GST / Tax (18%)</span>
              <span className="font-mono font-medium text-foreground">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground border-t pt-2">
              <span>Grand Total Amount</span>
              <span className="font-mono text-emerald-600">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
            {isEdit ? 'Save Invoice' : 'Generate & Issue Invoice'}
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
        <p className="text-sm text-muted-foreground py-2">Are you sure you want to delete <strong>{label}</strong>? This cannot be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Tenant Detail with Embedded Employee List & Filters ──────────────── */
function TenantRowWithEmployees({
  tenant,
  drivers,
  employees,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  tenant: WfTenant;
  drivers: Driver[];
  employees: WfEmployee[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const assignedDriver = drivers.find((d) => d.id === tenant.assignedDriverId);
  const tenantEmps = employees.filter((e) => e.tenantId === tenant.id);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [searchEmp, setSearchEmp] = useState<string>('');

  const departments = Array.from(new Set(tenantEmps.map((e) => e.department).filter(Boolean)));

  // Filtering employees
  const filteredEmps = tenantEmps.filter((emp) => {
    const searchMatch = `${emp.firstName} ${emp.lastName} ${emp.employeeCode} ${emp.department}`
      .toLowerCase()
      .includes(searchEmp.toLowerCase());
    const deptMatch = deptFilter === 'ALL' || emp.department.toLowerCase() === deptFilter.toLowerCase();
    
    let statusMatch = true;
    if (statusFilter === 'MISSING') {
      statusMatch = emp.setA.status === 'MISSING' || emp.setB.status === 'MISSING' || emp.setC.status === 'MISSING';
    } else if (statusFilter === 'REPAIR') {
      statusMatch = emp.setA.status === 'REPAIR' || emp.setB.status === 'REPAIR' || emp.setC.status === 'REPAIR';
    } else if (statusFilter === 'IN_USE') {
      statusMatch = emp.setA.status === 'IN_USE';
    } else if (statusFilter === 'IN_LAUNDRY') {
      statusMatch = emp.setC.status === 'IN_LAUNDRY' || emp.setC.status === 'WASHING';
    }

    return searchMatch && deptMatch && statusMatch;
  });

  const missingCount = tenantEmps.filter(
    (e) => e.setA.status === 'MISSING' || e.setB.status === 'MISSING' || e.setC.status === 'MISSING'
  ).length;
  const repairCount = tenantEmps.filter(
    (e) => e.setA.status === 'REPAIR' || e.setB.status === 'REPAIR' || e.setC.status === 'REPAIR'
  ).length;

  return (
    <>
      <TableRow className={cn('hover:bg-muted/40 cursor-pointer transition-colors', isSelected && 'bg-violet-50/50 dark:bg-violet-950/20')} onClick={onToggleSelect}>
        <TableCell>
          <div className="flex items-center gap-2">
            {isSelected ? <ChevronDown className="w-4 h-4 text-violet-600" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="font-semibold text-foreground">{tenant.name}</p>
              <p className="text-xs text-muted-foreground">{tenant.industry} · {tenant.city}</p>
            </div>
          </div>
        </TableCell>
        <TableCell><Badge variant="outline">{tenant.code}</Badge></TableCell>
        <TableCell className="font-medium">{tenantEmps.length || tenant.employeeCount}</TableCell>
        <TableCell>{tenant.setsPerEmployee}</TableCell>
        <TableCell className="font-mono font-semibold">{(tenantEmps.length || tenant.employeeCount) * tenant.setsPerEmployee}</TableCell>
        <TableCell><Badge variant="outline" className={cn(statusBadge(tenant.status))}>{tenant.status}</Badge></TableCell>
        <TableCell>
          {assignedDriver ? (
            <div>
              <p className="text-sm font-medium">{assignedDriver.name}</p>
              <Badge variant="outline" className={cn('text-[10px]', DRIVER_STATUS_COLORS[assignedDriver.status])}>
                {DRIVER_STATUS_LABELS[assignedDriver.status]}
              </Badge>
            </div>
          ) : <span className="text-muted-foreground text-xs">Unassigned</span>}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Tenant Details & All Employees with Side Filters */}
      {isSelected && (
        <TableRow>
          <TableCell colSpan={8} className="p-0 bg-slate-50/70 dark:bg-slate-900/60 border-b border-t">
            <div className="p-5 space-y-4">
              {/* Tenant KPI Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                <div className="bg-white dark:bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Total Staff</p>
                  <p className="text-lg font-bold text-blue-600">{tenantEmps.length}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Sets Per Staff</p>
                  <p className="text-lg font-bold text-foreground">{tenant.setsPerEmployee}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">In Use (Set A)</p>
                  <p className="text-lg font-bold text-blue-600">{tenantEmps.filter(e => e.setA.status === 'IN_USE').length}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">In Laundry (Set C)</p>
                  <p className="text-lg font-bold text-orange-600">{tenantEmps.filter(e => e.setC.status === 'IN_LAUNDRY' || e.setC.status === 'WASHING').length}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Missing / Lost</p>
                  <p className="text-lg font-bold text-red-600">{missingCount}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Under Repair</p>
                  <p className="text-lg font-bold text-amber-600">{repairCount}</p>
                </div>
              </div>

              {/* Employees Section with Interactive Filters */}
              <div className="bg-white dark:bg-card rounded-xl border shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
                  <div>
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-600" />
                      Employees under {tenant.name} ({tenantEmps.length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Viewing garment set status and wash counts for this tenant's employees
                    </p>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search employee..."
                        value={searchEmp}
                        onChange={(e) => setSearchEmp(e.target.value)}
                        className="h-9 w-44 pl-8 text-xs"
                      />
                    </div>

                    <div className="w-36">
                      <Select value={deptFilter} onValueChange={setDeptFilter}>
                        <SelectContent>
                          <SelectItem value="ALL">All Depts</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Filter Chips / Quick Buttons */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Quick Filter:
                  </span>
                  {[
                    { id: 'ALL', label: `All Staff (${tenantEmps.length})`, count: tenantEmps.length },
                    { id: 'MISSING', label: `Missing Garments (${missingCount})`, count: missingCount, alert: true },
                    { id: 'REPAIR', label: `Under Repair (${repairCount})`, count: repairCount },
                    { id: 'IN_USE', label: `In Use`, count: tenantEmps.length },
                    { id: 'IN_LAUNDRY', label: `In Laundry`, count: tenantEmps.length },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setStatusFilter(chip.id)}
                      className={cn(
                        'px-3 py-1 rounded-full border transition-all font-medium cursor-pointer',
                        statusFilter === chip.id
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : chip.alert && chip.count > 0
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Employee Table */}
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-xs">
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-blue-700">Set A (In Use)</TableHead>
                        <TableHead className="text-emerald-700">Set B (In Locker)</TableHead>
                        <TableHead className="text-orange-700">Set C (In Laundry)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmps.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                            No employees match current filter
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmps.map((emp) => (
                          <TableRow key={emp.id} className="hover:bg-muted/30 text-xs">
                            <TableCell>
                              <p className="font-semibold text-foreground">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{emp.employeeCode} · {emp.email}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-[11px]">
                                {emp.department}
                              </Badge>
                            </TableCell>
                            <TableCell><GarmentItemBadge item={emp.setA} /></TableCell>
                            <TableCell><GarmentItemBadge item={emp.setB} /></TableCell>
                            <TableCell><GarmentItemBadge item={emp.setC} /></TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                                {emp.status || 'ACTIVE'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/* ──────────────── Main AdminDashboard ──────────────── */
export function AdminDashboard() {
  const { authorized } = useRequireRole([ROLES.WHITEFOX_ADMIN]);
  const { user, logout } = useAuth();
  const {
    tenants,
    drivers,
    employees,
    invoices,
    gateScans,
    notifications,
    pickupRequests,
    deleteTenant,
    deleteDriver,
  } = useWhiteFoxStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<string>('tenants');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(tenants[0]?.id ?? null);
  const [tenantModal, setTenantModal] = useState<{ open: boolean; initial?: WfTenant }>({ open: false });
  const [driverModal, setDriverModal] = useState<{ open: boolean; initial?: Driver }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ open: boolean; label: string; onConfirm: () => void }>({ open: false, label: '', onConfirm: () => {} });
  const [searchTenant, setSearchTenant] = useState('');

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  const filteredTenants = tenants.filter((t) =>
    `${t.name} ${t.code} ${t.city}`.toLowerCase().includes(searchTenant.toLowerCase())
  );

  const totalEmployees = employees.length || tenants.reduce((s, t) => s + t.employeeCount, 0);
  const totalGarments = tenants.reduce((s, t) => s + t.totalGarments, 0);
  const totalRevenue = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 p-6">
      {/* ── Admin Login Popup for Gate Scans & Missing Garments ── */}
      <AdminLoginNotificationPopup />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-card border rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" />
            <h1 className="text-2xl font-bold">Platform Admin Dashboard</h1>
            <Badge className="bg-violet-600 text-white">WhiteFox Admin</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Logged in as: <strong>{user?.email}</strong> · Full Multi-Tenant Management</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Direct Notification Center Bell Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'relative gap-2 border-violet-200 text-violet-700 dark:text-violet-300 hover:bg-violet-50 cursor-pointer',
              unreadNotifsCount > 0 && 'ring-2 ring-red-500/40'
            )}
          >
            <Bell className="w-4 h-4 text-violet-600" />
            <span>Alerts</span>
            {unreadNotifsCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={() => logout()} className="text-red-600 hover:bg-red-50 border-red-200 gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: tenants.length, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Total Staff Managed', value: totalEmployees.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'RFID Garments', value: totalGarments.toLocaleString(), icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Billed Value', value: `₹${totalRevenue.toLocaleString()}`, icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

      {/* ── 6 Comprehensive Admin Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full max-w-5xl h-auto p-1 gap-1">
          <TabsTrigger value="tenants" className="text-xs py-2">
            Tenants & Staff ({tenants.length})
          </TabsTrigger>
          <TabsTrigger value="rfid-tunnel" className="text-xs py-2 gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            3-Gate RFID Tunnel
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs py-2 gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-emerald-500" />
            GST Billing ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs py-2 gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Pickup Calendar ({pickupRequests.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs py-2 gap-1.5">
            <Bell className="w-3.5 h-3.5 text-violet-500" />
            Notifications {unreadNotifsCount > 0 && `(${unreadNotifsCount})`}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs py-2">
            Drivers ({drivers.length})
          </TabsTrigger>
        </TabsList>

        {/* ── 1. Tenants & Staff Tab ── */}
        <TabsContent value="tenants" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-violet-600" /> Tenant Organizations</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Click any tenant row to inspect all assigned employees and apply filters (missing, repair, laundry)</p>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="Search tenants…" value={searchTenant} onChange={(e) => setSearchTenant(e.target.value)} className="w-48 text-xs" />
                <Button size="sm" onClick={() => setTenantModal({ open: true })} className="bg-violet-600 hover:bg-violet-700 text-white gap-1 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Tenant
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Organization</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Sets/Staff</TableHead>
                    <TableHead>Total Garments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No tenants found</TableCell></TableRow>
                  ) : (
                    filteredTenants.map((t) => (
                      <TenantRowWithEmployees
                        key={t.id}
                        tenant={t}
                        drivers={drivers}
                        employees={employees}
                        isSelected={selectedTenantId === t.id}
                        onToggleSelect={() => setSelectedTenantId(selectedTenantId === t.id ? null : t.id)}
                        onEdit={() => setTenantModal({ open: true, initial: t })}
                        onDelete={() => setDeleteTarget({ open: true, label: t.name, onConfirm: () => { deleteTenant(t.id); toast.success(`Tenant "${t.name}" deleted`); } })}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. 3-Gate RFID Tunneling Station Tab ── */}
        <TabsContent value="rfid-tunnel" className="mt-4">
          <RFIDTunnelingStation />
        </TabsContent>

        {/* ── 3. Detailed Itemized Invoices & GST Billing Tab ── */}
        <TabsContent value="billing" className="mt-4">
          <DetailedBillingView mode="ADMIN" />
        </TabsContent>

        {/* ── 4. Master Pickup Calendar Tab ── */}
        <TabsContent value="calendar" className="mt-4">
          <MasterPickupCalendar mode="ADMIN" />
        </TabsContent>

        {/* ── 5. Admin Notifications & Discrepancy Stream Tab ── */}
        <TabsContent value="notifications" className="mt-4">
          <AdminNotificationCenter />
        </TabsContent>

        {/* ── 5. Drivers & Logistics Tab ── */}
        <TabsContent value="drivers" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-amber-600" /> Drivers & Logistics Fleet</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Manage driver accounts, vehicle assignment, and tenant allocation</p>
              </div>
              <Button size="sm" onClick={() => setDriverModal({ open: true })} className="bg-amber-600 hover:bg-amber-700 text-white gap-1 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Driver
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Live Status</TableHead>
                    <TableHead>Assigned Tenant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((d) => {
                    const tenant = tenants.find((t) => t.id === d.assignedTenantId);
                    return (
                      <TableRow key={d.id} className="hover:bg-muted/40">
                        <TableCell className="font-semibold">{d.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.email}</TableCell>
                        <TableCell className="font-mono text-sm">{d.vehicleNumber ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(DRIVER_STATUS_COLORS[d.status])}>
                            {DRIVER_STATUS_LABELS[d.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tenant ? (
                            <div>
                              <p className="text-sm font-medium">{tenant.name}</p>
                              <p className="text-xs text-muted-foreground">{tenant.code}</p>
                            </div>
                          ) : <span className="text-muted-foreground text-xs">Unassigned</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 cursor-pointer" onClick={() => setDriverModal({ open: true, initial: d })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 cursor-pointer" onClick={() => setDeleteTarget({ open: true, label: d.name, onConfirm: () => { deleteDriver(d.id); toast.success(`Driver "${d.name}" deleted`); } })}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <TenantModal open={tenantModal.open} onClose={() => setTenantModal({ open: false })} initial={tenantModal.initial} drivers={drivers} />
      <DriverModal open={driverModal.open} onClose={() => setDriverModal({ open: false })} initial={driverModal.initial} tenants={tenants} />
      <DeleteConfirm {...deleteTarget} onClose={() => setDeleteTarget((s) => ({ ...s, open: false }))} />
    </div>
  );
}