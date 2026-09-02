/**
 * WhiteFox Global Zustand Store
 * Single source of truth shared across all portals (Admin, Tenant, Employee, Driver).
 * Persisted to localStorage so state survives page refreshes.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ──────────────── Types ──────────────── */
export type DriverStatus =
  | 'OFF_DUTY'
  | 'WAITING'
  | 'EN_ROUTE_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: DriverStatus;
  assignedTenantId: string | null;
  assignedTenantName?: string;
  vehicleNumber?: string;
}

export interface GarmentSetItem {
  assetId: string;
  status: 'IN_USE' | 'IN_LOCKER' | 'IN_LAUNDRY' | 'WASHING' | 'QC_PASSED' | 'PACKED' | 'MISSING' | 'REPAIR';
  washCount: number;
}

export interface WfEmployee {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  setA: GarmentSetItem;
  setB: GarmentSetItem;
  setC: GarmentSetItem;
}

export interface CleaningPref {
  id: string;
  tenantId: string;
  garmentType: string;
  cleaningType: string;
  frequency: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalGarmentsCleaned: number;
  ratePerWash: number;
  baseAmount: number;
  expressCharges: number;
  disinfectionCharges: number;
  taxGstPercent: number; // 18%
  taxAmount: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  issuedDate: string;
  dueDate: string;
  notes?: string;
}

export interface WfTenant {
  id: string;
  code: string;
  name: string;
  industry: string;
  email: string;
  phone: string;
  city: string;
  employeeCount: number;
  setsPerEmployee: number;
  totalGarments: number;
  inUseCount: number;
  inLockerCount: number;
  inLaundryCount: number;
  repairCount: number;
  missingCount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
  assignedDriverId: string | null;
  contractStart: string;
  slaHours: number;
}

/* ──────────────── Default seed data ──────────────── */
const SEED_DRIVERS: Driver[] = [
  { id: 'drv-1', name: 'Alex Rivera', email: 'driver@demo.com', phone: '+91-9876543210', status: 'WAITING', assignedTenantId: 'tnt-1', assignedTenantName: 'City General Hospital', vehicleNumber: 'MH-12-AB-1234' },
  { id: 'drv-2', name: 'Rajan Mehta', email: 'rajan@whitefox.com', phone: '+91-9123456789', status: 'OFF_DUTY', assignedTenantId: 'tnt-2', assignedTenantName: 'Metro Medical Center', vehicleNumber: 'MH-14-CD-5678' },
  { id: 'drv-3', name: 'Priya Nair', email: 'priya@whitefox.com', phone: '+91-9988776655', status: 'DELIVERED', assignedTenantId: 'tnt-3', assignedTenantName: 'Grand Hotel Chain', vehicleNumber: 'MH-01-EF-9012' },
];

const SEED_TENANTS: WfTenant[] = [
  {
    id: 'tnt-1', code: 'CGH', name: 'City General Hospital', industry: 'HEALTHCARE',
    email: 'admin@cgh.org', phone: '+91-22-12345678', city: 'Mumbai',
    employeeCount: 4, setsPerEmployee: 3, totalGarments: 12,
    inUseCount: 4, inLockerCount: 4, inLaundryCount: 3, repairCount: 1, missingCount: 1,
    status: 'ACTIVE', assignedDriverId: 'drv-1',
    contractStart: '2025-01-01', slaHours: 24,
  },
  {
    id: 'tnt-2', code: 'MMC', name: 'Metro Medical Center', industry: 'HEALTHCARE',
    email: 'admin@mmc.org', phone: '+91-22-87654321', city: 'Pune',
    employeeCount: 2, setsPerEmployee: 3, totalGarments: 6,
    inUseCount: 2, inLockerCount: 2, inLaundryCount: 2, repairCount: 0, missingCount: 0,
    status: 'ACTIVE', assignedDriverId: 'drv-2',
    contractStart: '2025-03-01', slaHours: 24,
  },
  {
    id: 'tnt-3', code: 'GHC', name: 'Grand Hotel Chain', industry: 'HOSPITALITY',
    email: 'admin@ghc.com', phone: '+91-11-99887766', city: 'Delhi',
    employeeCount: 2, setsPerEmployee: 2, totalGarments: 4,
    inUseCount: 2, inLockerCount: 2, inLaundryCount: 2, repairCount: 1, missingCount: 0,
    status: 'ACTIVE', assignedDriverId: 'drv-3',
    contractStart: '2024-11-01', slaHours: 48,
  },
];

const SEED_EMPLOYEES: WfEmployee[] = [
  {
    id: 'emp-1', tenantId: 'tnt-1', employeeCode: 'EMP-1001',
    firstName: 'John', lastName: 'Smith', email: 'john.smith@cgh.org', department: 'ICU',
    status: 'ACTIVE',
    setA: { assetId: 'WF-SCR-00101', status: 'IN_USE', washCount: 45 },
    setB: { assetId: 'WF-SCR-00102', status: 'IN_LOCKER', washCount: 42 },
    setC: { assetId: 'WF-SCR-00103', status: 'IN_LAUNDRY', washCount: 48 },
  },
  {
    id: 'emp-2', tenantId: 'tnt-1', employeeCode: 'EMP-1002',
    firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@cgh.org', department: 'Emergency',
    status: 'ACTIVE',
    setA: { assetId: 'WF-SCR-00201', status: 'IN_USE', washCount: 38 },
    setB: { assetId: 'WF-SCR-00202', status: 'IN_LOCKER', washCount: 35 },
    setC: { assetId: 'WF-SCR-00203', status: 'WASHING', washCount: 39 },
  },
  {
    id: 'emp-3', tenantId: 'tnt-1', employeeCode: 'EMP-1003',
    firstName: 'David', lastName: 'Kim', email: 'david.kim@cgh.org', department: 'Surgery',
    status: 'ACTIVE',
    setA: { assetId: 'WF-SCR-00301', status: 'IN_USE', washCount: 52 },
    setB: { assetId: 'WF-SCR-00302', status: 'IN_LOCKER', washCount: 50 },
    setC: { assetId: 'WF-SCR-00303', status: 'QC_PASSED', washCount: 51 },
  },
  {
    id: 'emp-4', tenantId: 'tnt-1', employeeCode: 'EMP-1004',
    firstName: 'Sarah', lastName: 'Connor', email: 'sarah.connor@cgh.org', department: 'Pediatrics',
    status: 'ACTIVE',
    setA: { assetId: 'WF-SCR-00401', status: 'MISSING', washCount: 22 },
    setB: { assetId: 'WF-SCR-00402', status: 'IN_LOCKER', washCount: 21 },
    setC: { assetId: 'WF-SCR-00403', status: 'PACKED', washCount: 23 },
  },
  {
    id: 'emp-5', tenantId: 'tnt-2', employeeCode: 'EMP-2001',
    firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@mmc.org', department: 'Radiology',
    status: 'ACTIVE',
    setA: { assetId: 'WF-SCR-01001', status: 'IN_USE', washCount: 30 },
    setB: { assetId: 'WF-SCR-01002', status: 'IN_LOCKER', washCount: 28 },
    setC: { assetId: 'WF-SCR-01003', status: 'IN_LAUNDRY', washCount: 31 },
  },
  {
    id: 'emp-6', tenantId: 'tnt-2', employeeCode: 'EMP-2002',
    firstName: 'Rahul', lastName: 'Verma', email: 'rahul.v@mmc.org', department: 'Cardiology',
    status: 'ACTIVE',
    setA: { assetId: 'WF-SCR-01004', status: 'IN_USE', washCount: 15 },
    setB: { assetId: 'WF-SCR-01005', status: 'IN_LOCKER', washCount: 14 },
    setC: { assetId: 'WF-SCR-01006', status: 'REPAIR', washCount: 16 },
  },
  {
    id: 'emp-7', tenantId: 'tnt-3', employeeCode: 'EMP-3001',
    firstName: 'Amit', lastName: 'Patel', email: 'amit@ghc.com', department: 'Front Desk',
    status: 'ACTIVE',
    setA: { assetId: 'WF-UNI-02001', status: 'IN_USE', washCount: 19 },
    setB: { assetId: 'WF-UNI-02002', status: 'IN_LOCKER', washCount: 18 },
    setC: { assetId: 'WF-UNI-02003', status: 'IN_LAUNDRY', washCount: 20 },
  },
  {
    id: 'emp-8', tenantId: 'tnt-3', employeeCode: 'EMP-3002',
    firstName: 'Sneha', lastName: 'Kapoor', email: 'sneha@ghc.com', department: 'Housekeeping',
    status: 'ACTIVE',
    setA: { assetId: 'WF-UNI-02004', status: 'IN_USE', washCount: 25 },
    setB: { assetId: 'WF-UNI-02005', status: 'IN_LOCKER', washCount: 24 },
    setC: { assetId: 'WF-UNI-02006', status: 'REPAIR', washCount: 26 },
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-08-001',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    billingPeriodStart: '2026-08-01',
    billingPeriodEnd: '2026-08-15',
    totalGarmentsCleaned: 1350,
    ratePerWash: 18,
    baseAmount: 24300,
    expressCharges: 1500,
    disinfectionCharges: 2200,
    taxGstPercent: 18,
    taxAmount: 5040,
    totalAmount: 33040,
    status: 'PAID',
    issuedDate: '2026-08-16',
    dueDate: '2026-08-30',
    notes: 'Bi-weekly commercial wash & barrier sterilization service.',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-08-002',
    tenantId: 'tnt-2',
    tenantName: 'Metro Medical Center',
    tenantCode: 'MMC',
    billingPeriodStart: '2026-08-01',
    billingPeriodEnd: '2026-08-15',
    totalGarmentsCleaned: 840,
    ratePerWash: 18,
    baseAmount: 15120,
    expressCharges: 800,
    disinfectionCharges: 1400,
    taxGstPercent: 18,
    taxAmount: 3117.6,
    totalAmount: 20437.6,
    status: 'PENDING',
    issuedDate: '2026-08-16',
    dueDate: '2026-08-31',
    notes: 'Bi-weekly medical linen and scrubs cycle.',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-07-003',
    tenantId: 'tnt-3',
    tenantName: 'Grand Hotel Chain',
    tenantCode: 'GHC',
    billingPeriodStart: '2026-07-01',
    billingPeriodEnd: '2026-07-31',
    totalGarmentsCleaned: 1240,
    ratePerWash: 22,
    baseAmount: 27280,
    expressCharges: 0,
    disinfectionCharges: 1000,
    taxGstPercent: 18,
    taxAmount: 5090.4,
    totalAmount: 33370.4,
    status: 'PAID',
    issuedDate: '2026-08-01',
    dueDate: '2026-08-15',
    notes: 'Monthly hospitality linen, towels & staff uniform processing.',
  },
];

const SEED_CLEANING_PREFS: CleaningPref[] = [
  { id: 'cp-1', tenantId: 'tnt-1', garmentType: 'Scrub Top', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY' },
  { id: 'cp-2', tenantId: 'tnt-1', garmentType: 'Scrub Trousers', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY' },
  { id: 'cp-3', tenantId: 'tnt-1', garmentType: 'Lab Coat', cleaningType: 'DRY_CLEAN', frequency: 'WEEKLY' },
  { id: 'cp-4', tenantId: 'tnt-2', garmentType: 'Nurse Uniform', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY' },
];

/* ──────────────── Store Interface ──────────────── */
interface WhiteFoxStore {
  tenants: WfTenant[];
  drivers: Driver[];
  employees: WfEmployee[];
  cleaningPrefs: CleaningPref[];
  invoices: Invoice[];

  // Tenant CRUD
  addTenant: (t: Omit<WfTenant, 'id'>) => void;
  updateTenant: (id: string, patch: Partial<WfTenant>) => void;
  deleteTenant: (id: string) => void;

  // Driver CRUD
  addDriver: (d: Omit<Driver, 'id' | 'status'>) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  // Employee CRUD
  addEmployee: (e: Omit<WfEmployee, 'id'>) => void;
  updateEmployee: (id: string, patch: Partial<WfEmployee>) => void;
  deleteEmployee: (id: string) => void;

  // Invoice CRUD
  addInvoice: (inv: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Driver live status
  setDriverStatus: (driverId: string, status: DriverStatus) => void;

  // Cleaning prefs
  addCleaningPref: (p: Omit<CleaningPref, 'id'>) => void;
  updateCleaningPref: (id: string, patch: Partial<CleaningPref>) => void;
  deleteCleaningPref: (id: string) => void;
}

/* ──────────────── Store ──────────────── */
export const useWhiteFoxStore = create<WhiteFoxStore>()(
  persist(
    (set, get) => ({
      tenants: SEED_TENANTS,
      drivers: SEED_DRIVERS,
      employees: SEED_EMPLOYEES,
      cleaningPrefs: SEED_CLEANING_PREFS,
      invoices: SEED_INVOICES,

      addTenant: (t) =>
        set((s) => ({
          tenants: [...s.tenants, { ...t, id: `tnt-${Date.now()}` }],
        })),

      updateTenant: (id, patch) =>
        set((s) => ({
          tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          drivers: patch.assignedDriverId !== undefined
            ? s.drivers.map((d) => {
                if (d.id === patch.assignedDriverId) {
                  return { ...d, assignedTenantId: id, assignedTenantName: patch.name ?? s.tenants.find(t => t.id === id)?.name ?? d.assignedTenantName };
                }
                if (d.assignedTenantId === id && d.id !== patch.assignedDriverId) {
                  return { ...d, assignedTenantId: null, assignedTenantName: undefined };
                }
                return d;
              })
            : s.drivers,
        })),

      deleteTenant: (id) =>
        set((s) => ({
          tenants: s.tenants.filter((t) => t.id !== id),
          employees: s.employees.filter((e) => e.tenantId !== id),
          cleaningPrefs: s.cleaningPrefs.filter((p) => p.tenantId !== id),
          invoices: s.invoices.filter((inv) => inv.tenantId !== id),
          drivers: s.drivers.map((d) =>
            d.assignedTenantId === id ? { ...d, assignedTenantId: null, assignedTenantName: undefined } : d
          ),
        })),

      addDriver: (d) =>
        set((s) => ({
          drivers: [...s.drivers, { ...d, id: `drv-${Date.now()}`, status: 'OFF_DUTY' }],
        })),

      updateDriver: (id, patch) =>
        set((s) => ({
          drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      deleteDriver: (id) =>
        set((s) => ({
          drivers: s.drivers.filter((d) => d.id !== id),
          tenants: s.tenants.map((t) =>
            t.assignedDriverId === id ? { ...t, assignedDriverId: null } : t
          ),
        })),

      addEmployee: (e) =>
        set((s) => {
          const newEmp: WfEmployee = { ...e, id: `emp-${Date.now()}` };
          const newEmployees = [...s.employees, newEmp];
          const tenantEmps = newEmployees.filter((emp) => emp.tenantId === e.tenantId);
          const updatedTenants = s.tenants.map((t) => {
            if (t.id === e.tenantId) {
              const empCount = tenantEmps.length;
              return {
                ...t,
                employeeCount: empCount,
                totalGarments: empCount * t.setsPerEmployee,
                inUseCount: empCount,
                inLockerCount: empCount,
                inLaundryCount: Math.round(empCount * 0.8),
              };
            }
            return t;
          });
          return {
            employees: newEmployees,
            tenants: updatedTenants,
          };
        }),

      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteEmployee: (id) =>
        set((s) => {
          const targetEmp = s.employees.find((e) => e.id === id);
          const newEmployees = s.employees.filter((e) => e.id !== id);
          const tenantId = targetEmp?.tenantId;
          const updatedTenants = s.tenants.map((t) => {
            if (t.id === tenantId) {
              const empCount = newEmployees.filter((e) => e.tenantId === tenantId).length;
              return {
                ...t,
                employeeCount: empCount,
                totalGarments: empCount * t.setsPerEmployee,
                inUseCount: empCount,
                inLockerCount: empCount,
                inLaundryCount: Math.max(0, Math.round(empCount * 0.8)),
              };
            }
            return t;
          });
          return {
            employees: newEmployees,
            tenants: updatedTenants,
          };
        }),

      addInvoice: (inv) =>
        set((s) => ({
          invoices: [{ ...inv, id: `inv-${Date.now()}` }, ...s.invoices],
        })),

      updateInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)),
        })),

      deleteInvoice: (id) =>
        set((s) => ({
          invoices: s.invoices.filter((inv) => inv.id !== id),
        })),

      setDriverStatus: (driverId, status) =>
        set((s) => ({
          drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, status } : d)),
        })),

      addCleaningPref: (p) =>
        set((s) => ({
          cleaningPrefs: [...s.cleaningPrefs, { ...p, id: `cp-${Date.now()}` }],
        })),

      updateCleaningPref: (id, patch) =>
        set((s) => ({
          cleaningPrefs: s.cleaningPrefs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteCleaningPref: (id) =>
        set((s) => ({
          cleaningPrefs: s.cleaningPrefs.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'whitefox-store',
    }
  )
);

/* ──────────────── Helpers ──────────────── */
export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  OFF_DUTY: 'Off Duty',
  WAITING: 'Waiting',
  EN_ROUTE_PICKUP: 'En Route to Pickup',
  PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On the Way',
  DELIVERED: 'Delivered',
};

export const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  OFF_DUTY: 'bg-gray-100 text-gray-700 border-gray-300',
  WAITING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  EN_ROUTE_PICKUP: 'bg-blue-100 text-blue-800 border-blue-300',
  PICKED_UP: 'bg-orange-100 text-orange-800 border-orange-300',
  ON_THE_WAY: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
};

export const GARMENT_STATUS_LABELS: Record<string, string> = {
  IN_USE: 'In Use',
  IN_LOCKER: 'In Locker',
  IN_LAUNDRY: 'In Laundry',
  WASHING: 'Washing',
  QC_PASSED: 'QC Passed',
  PACKED: 'Packed',
  MISSING: 'Missing / Lost',
  REPAIR: 'Under Repair',
};
