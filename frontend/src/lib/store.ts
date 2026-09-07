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

export interface InvoiceItem {
  id: string;
  description: string;
  garmentType: string;
  quantity: number;
  ratePerWash: number;
  amount: number;
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
  missingGarmentPenalty: number;
  taxGstPercent: number; // Configurable by Admin (e.g. 18%)
  taxAmount: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  issuedDate: string;
  dueDate: string;
  notes?: string;
  items?: InvoiceItem[];
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
  customWashRate?: number;
}

/* ──────────────── RFID Gate Tunneling Types ──────────────── */
export type RFIDGateType = 'GATE_1_COLLECTION' | 'GATE_2_CLEANING' | 'GATE_3_DELIVERY';

export interface MissingGarmentDetail {
  assetId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  setItem: 'setA' | 'setB' | 'setC';
  garmentType: string;
  expectedStatus: string;
}

export interface GateInletOutletTelemetry {
  inletTimestamp: string;
  inletCount: number;
  inletSource: string;
  inletAssetIds: string[];
  outletTimestamp: string;
  outletCount: number;
  outletDestination: string;
  outletAssetIds: string[];
  throughputPerMinute: number;
  antennaPowerDb: number;
  sensorHealth: 'OPTIMAL' | 'CALIBRATING' | 'WARNING';
}

export interface RFIDGateScanRecord {
  id: string;
  gate: RFIDGateType;
  gateName: string;
  gateLocation: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  scannedAt: string;
  detectedCount: number;
  expectedCount: number;
  missingCount: number;
  detectedAssetIds: string[];
  missingGarments: MissingGarmentDetail[];
  status: 'NORMAL' | 'DISCREPANCY_ALERT';
  disinfectionVerified?: boolean;
  operatorNotes?: string;
  telemetry: GateInletOutletTelemetry;
}

/* ──────────────── Pickup Scheduling Types ──────────────── */
export type PickupStatus =
  | 'SCHEDULED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_EN_ROUTE'
  | 'PICKED_UP'
  | 'IN_LAUNDRY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PickupPriority = 'NORMAL' | 'EXPRESS_SAME_DAY' | 'STERILIZATION_URGENT';

export interface PickupRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  pickupDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:00 AM - 11:00 AM"
  estimatedHampers: number;
  estimatedGarments: number;
  pickupLocation: string; // e.g. "Main Intake Bay / ICU Dock"
  priority: PickupPriority;
  status: PickupStatus;
  assignedDriverId: string | null;
  assignedDriverName?: string;
  driverPhone?: string;
  specialInstructions?: string;
  createdAt: string;
}

/* ──────────────── Admin Notification Types ──────────────── */
export interface AdminNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  gate?: RFIDGateType;
  gateName?: string;
  tenantId?: string;
  tenantName?: string;
  tenantCode?: string;
  detectedCount?: number;
  expectedCount?: number;
  missingGarments?: MissingGarmentDetail[];
  type: 'MISSING_ALERT' | 'GATE_SCAN' | 'PICKUP_SCHEDULED' | 'BILLING' | 'SYSTEM';
  read: boolean;
  isPopupShown?: boolean;
}

export interface BillingSettings {
  defaultGstPercent: number; // e.g., 18
  defaultRatePerWash: number; // e.g., 18
  expressRate: number; // e.g., 5
  disinfectionRate: number; // e.g., 8
  missingGarmentFine: number; // e.g., 450
  paymentDueDays: number; // e.g., 15
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
    contractStart: '2025-01-01', slaHours: 24, customWashRate: 18,
  },
  {
    id: 'tnt-2', code: 'MMC', name: 'Metro Medical Center', industry: 'HEALTHCARE',
    email: 'admin@mmc.org', phone: '+91-22-87654321', city: 'Pune',
    employeeCount: 2, setsPerEmployee: 3, totalGarments: 6,
    inUseCount: 2, inLockerCount: 2, inLaundryCount: 2, repairCount: 0, missingCount: 0,
    status: 'ACTIVE', assignedDriverId: 'drv-2',
    contractStart: '2025-03-01', slaHours: 24, customWashRate: 18,
  },
  {
    id: 'tnt-3', code: 'GHC', name: 'Grand Hotel Chain', industry: 'HOSPITALITY',
    email: 'admin@ghc.com', phone: '+91-11-99887766', city: 'Delhi',
    employeeCount: 2, setsPerEmployee: 2, totalGarments: 4,
    inUseCount: 2, inLockerCount: 2, inLaundryCount: 2, repairCount: 1, missingCount: 0,
    status: 'ACTIVE', assignedDriverId: 'drv-3',
    contractStart: '2024-11-01', slaHours: 48, customWashRate: 22,
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

const SEED_PICKUP_REQUESTS: PickupRequest[] = [
  {
    id: 'pck-001',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    pickupDate: '2026-09-04',
    timeSlot: '09:00 AM - 11:00 AM',
    estimatedHampers: 6,
    estimatedGarments: 145,
    pickupLocation: 'ICU & Emergency Bio-Hamper Bay 1',
    priority: 'STERILIZATION_URGENT',
    status: 'DRIVER_ASSIGNED',
    assignedDriverId: 'drv-1',
    assignedDriverName: 'Alex Rivera',
    driverPhone: '+91-9876543210',
    specialInstructions: 'ICU scrubs in red marked bags. Needs autoclave sterilization.',
    createdAt: '2026-09-03 18:30',
  },
  {
    id: 'pck-002',
    tenantId: 'tnt-2',
    tenantName: 'Metro Medical Center',
    tenantCode: 'MMC',
    pickupDate: '2026-09-04',
    timeSlot: '02:00 PM - 04:00 PM',
    estimatedHampers: 4,
    estimatedGarments: 90,
    pickupLocation: 'Main Linen Dock B',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    assignedDriverId: 'drv-2',
    assignedDriverName: 'Rajan Mehta',
    driverPhone: '+91-9123456789',
    specialInstructions: 'Regular bi-weekly ward linen and scrubs cycle.',
    createdAt: '2026-09-03 20:15',
  },
  {
    id: 'pck-003',
    tenantId: 'tnt-3',
    tenantName: 'Grand Hotel Chain',
    tenantCode: 'GHC',
    pickupDate: '2026-09-05',
    timeSlot: '11:00 AM - 01:00 PM',
    estimatedHampers: 8,
    estimatedGarments: 210,
    pickupLocation: 'Basement Staff Changing Area',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    assignedDriverId: null,
    specialInstructions: 'Front desk suits and housekeeping uniforms.',
    createdAt: '2026-09-04 00:10',
  },
  {
    id: 'pck-004',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    pickupDate: '2026-09-07',
    timeSlot: '09:00 AM - 11:00 AM',
    estimatedHampers: 5,
    estimatedGarments: 120,
    pickupLocation: 'Surgical OT Clean Room Air-lock',
    priority: 'EXPRESS_SAME_DAY',
    status: 'SCHEDULED',
    assignedDriverId: null,
    specialInstructions: 'Same-day turnaround required for Surgery unit.',
    createdAt: '2026-09-04 00:20',
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
    missingGarmentPenalty: 450,
    taxGstPercent: 18,
    taxAmount: 5121,
    totalAmount: 33571,
    status: 'PAID',
    issuedDate: '2026-08-16',
    dueDate: '2026-08-30',
    notes: 'Bi-weekly commercial wash & barrier sterilization service.',
    items: [
      { id: 'itm-1', description: 'Sterilized ICU Scrub Tops (RFID Tracked)', garmentType: 'Scrub Top', quantity: 650, ratePerWash: 18, amount: 11700 },
      { id: 'itm-2', description: 'Sterilized ICU Scrub Trousers (RFID Tracked)', garmentType: 'Scrub Trousers', quantity: 500, ratePerWash: 18, amount: 9000 },
      { id: 'itm-3', description: 'Surgeon Barrier Gowns & Lab Coats', garmentType: 'Lab Coat', quantity: 200, ratePerWash: 18, amount: 3600 },
    ],
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
    missingGarmentPenalty: 0,
    taxGstPercent: 18,
    taxAmount: 3117.6,
    totalAmount: 20437.6,
    status: 'PENDING',
    issuedDate: '2026-08-16',
    dueDate: '2026-08-31',
    notes: 'Bi-weekly medical linen and scrubs cycle.',
    items: [
      { id: 'itm-4', description: 'Standard Nurse Uniforms', garmentType: 'Nurse Uniform', quantity: 480, ratePerWash: 18, amount: 8640 },
      { id: 'itm-5', description: 'Medical Staff Lab Coats', garmentType: 'Lab Coat', quantity: 360, ratePerWash: 18, amount: 6480 },
    ],
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
    missingGarmentPenalty: 0,
    taxGstPercent: 18,
    taxAmount: 5090.4,
    totalAmount: 33370.4,
    status: 'PAID',
    issuedDate: '2026-08-01',
    dueDate: '2026-08-15',
    notes: 'Monthly hospitality linen, towels & staff uniform processing.',
    items: [
      { id: 'itm-6', description: 'Executive Front Desk Uniforms', garmentType: 'Front Desk Suit', quantity: 640, ratePerWash: 22, amount: 14080 },
      { id: 'itm-7', description: 'Housekeeping Heavy-Duty Uniforms', garmentType: 'Staff Uniform', quantity: 600, ratePerWash: 22, amount: 13200 },
    ],
  },
];

const SEED_CLEANING_PREFS: CleaningPref[] = [
  { id: 'cp-1', tenantId: 'tnt-1', garmentType: 'Scrub Top', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY' },
  { id: 'cp-2', tenantId: 'tnt-1', garmentType: 'Scrub Trousers', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY' },
  { id: 'cp-3', tenantId: 'tnt-1', garmentType: 'Lab Coat', cleaningType: 'DRY_CLEAN', frequency: 'WEEKLY' },
  { id: 'cp-4', tenantId: 'tnt-2', garmentType: 'Nurse Uniform', cleaningType: 'NORMAL_WASH_IRON', frequency: 'DAILY' },
];

const SEED_GATE_SCANS: RFIDGateScanRecord[] = [
  {
    id: 'scan-101',
    gate: 'GATE_1_COLLECTION',
    gateName: 'Gate 1: Collection & Intake Unit',
    gateLocation: 'Hospital Intake Bay A',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    scannedAt: 'Today, 09:30 AM',
    detectedCount: 3,
    expectedCount: 4,
    missingCount: 1,
    detectedAssetIds: ['WF-SCR-00103', 'WF-SCR-00203', 'WF-SCR-00303'],
    missingGarments: [
      {
        assetId: 'WF-SCR-00401',
        employeeName: 'Sarah Connor',
        employeeCode: 'EMP-1004',
        department: 'Pediatrics',
        setItem: 'setA',
        garmentType: 'Scrub Top',
        expectedStatus: 'Expected in Intake',
      },
    ],
    status: 'DISCREPANCY_ALERT',
    disinfectionVerified: true,
    operatorNotes: 'Gate 1 detected 3 of 4 garments from Cart #CGH-04. 1 Garment missing.',
    telemetry: {
      inletTimestamp: '09:28:45 AM',
      inletCount: 4,
      inletSource: 'Hospital Intake Bay A (Hamper #CGH-04)',
      inletAssetIds: ['WF-SCR-00103', 'WF-SCR-00203', 'WF-SCR-00303'],
      outletTimestamp: '09:30:12 AM',
      outletCount: 3,
      outletDestination: 'Sorting & Disinfection Conveyor #1',
      outletAssetIds: ['WF-SCR-00103', 'WF-SCR-00203', 'WF-SCR-00303'],
      throughputPerMinute: 45,
      antennaPowerDb: 31.5,
      sensorHealth: 'OPTIMAL',
    },
  },
  {
    id: 'scan-102',
    gate: 'GATE_2_CLEANING',
    gateName: 'Gate 2: Cleaning & Sterilization Unit',
    gateLocation: 'Main Continuous Batch Washer #2',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    scannedAt: 'Today, 11:15 AM',
    detectedCount: 3,
    expectedCount: 3,
    missingCount: 0,
    detectedAssetIds: ['WF-SCR-00103', 'WF-SCR-00203', 'WF-SCR-00303'],
    missingGarments: [],
    status: 'NORMAL',
    disinfectionVerified: true,
    operatorNotes: 'Thermal disinfection cycle completed at 75°C. All 3 items passed QC.',
    telemetry: {
      inletTimestamp: '10:45:00 AM',
      inletCount: 3,
      inletSource: 'Sorting Bay ➔ Washer Infeed Chute',
      inletAssetIds: ['WF-SCR-00103', 'WF-SCR-00203', 'WF-SCR-00303'],
      outletTimestamp: '11:15:20 AM',
      outletCount: 3,
      outletDestination: 'Barrier Dryer & Thermal QC Station',
      outletAssetIds: ['WF-SCR-00103', 'WF-SCR-00203', 'WF-SCR-00303'],
      throughputPerMinute: 60,
      antennaPowerDb: 30.0,
      sensorHealth: 'OPTIMAL',
    },
  },
  {
    id: 'scan-103',
    gate: 'GATE_3_DELIVERY',
    gateName: 'Gate 3: Delivery & Dispatch Unit',
    gateLocation: 'Dispatch Tunnel & Van Dock 2',
    tenantId: 'tnt-2',
    tenantName: 'Metro Medical Center',
    tenantCode: 'MMC',
    scannedAt: 'Today, 01:45 PM',
    detectedCount: 2,
    expectedCount: 2,
    missingCount: 0,
    detectedAssetIds: ['WF-SCR-01003', 'WF-SCR-01006'],
    missingGarments: [],
    status: 'NORMAL',
    disinfectionVerified: true,
    operatorNotes: 'Sealed hamper dispatched to Driver Rajan Mehta for Metro Medical.',
    telemetry: {
      inletTimestamp: '01:30:10 PM',
      inletCount: 2,
      inletSource: 'Packaging & Bundle Seal Line #2',
      inletAssetIds: ['WF-SCR-01003', 'WF-SCR-01006'],
      outletTimestamp: '01:45:00 PM',
      outletCount: 2,
      outletDestination: 'Delivery Van MH-14-CD-5678 (Driver: Rajan Mehta)',
      outletAssetIds: ['WF-SCR-01003', 'WF-SCR-01006'],
      throughputPerMinute: 50,
      antennaPowerDb: 32.0,
      sensorHealth: 'OPTIMAL',
    },
  },
];

const SEED_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-1',
    timestamp: 'Just now',
    title: '🚨 MISSING CLOTH DETECTED — Gate 1 (Collection Unit)',
    message: 'Gate 1 scanned 3/4 garments from City General Hospital. 1 Garment (WF-SCR-00401) is missing from Pediatrics ward.',
    gate: 'GATE_1_COLLECTION',
    gateName: 'Gate 1: Collection & Intake Unit',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    detectedCount: 3,
    expectedCount: 4,
    missingGarments: [
      {
        assetId: 'WF-SCR-00401',
        employeeName: 'Sarah Connor',
        employeeCode: 'EMP-1004',
        department: 'Pediatrics',
        setItem: 'setA',
        garmentType: 'Scrub Top',
        expectedStatus: 'Expected at Collection Gate',
      },
    ],
    type: 'MISSING_ALERT',
    read: false,
    isPopupShown: false,
  },
  {
    id: 'notif-2',
    timestamp: '15 mins ago',
    title: '✅ Gate 2 (Cleaning Unit) Scan Complete',
    message: '3 RFID garments for City General Hospital successfully passed wash cycle and thermal barrier disinfection.',
    gate: 'GATE_2_CLEANING',
    gateName: 'Gate 2: Cleaning & Sterilization Unit',
    tenantId: 'tnt-1',
    tenantName: 'City General Hospital',
    tenantCode: 'CGH',
    detectedCount: 3,
    expectedCount: 3,
    missingGarments: [],
    type: 'GATE_SCAN',
    read: false,
    isPopupShown: false,
  },
  {
    id: 'notif-3',
    timestamp: '1 hour ago',
    title: '🚚 Gate 3 (Delivery Unit) Dispatched',
    message: '2 RFID garments for Metro Medical Center scanned and dispatched in Delivery Van MH-14-CD-5678.',
    gate: 'GATE_3_DELIVERY',
    gateName: 'Gate 3: Delivery & Dispatch Unit',
    tenantId: 'tnt-2',
    tenantName: 'Metro Medical Center',
    tenantCode: 'MMC',
    detectedCount: 2,
    expectedCount: 2,
    missingGarments: [],
    type: 'GATE_SCAN',
    read: true,
    isPopupShown: true,
  },
];

const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  defaultGstPercent: 18,
  defaultRatePerWash: 18,
  expressRate: 5,
  disinfectionRate: 8,
  missingGarmentFine: 450,
  paymentDueDays: 15,
};

/* ──────────────── Store Interface ──────────────── */
interface WhiteFoxStore {
  tenants: WfTenant[];
  drivers: Driver[];
  employees: WfEmployee[];
  cleaningPrefs: CleaningPref[];
  invoices: Invoice[];
  gateScans: RFIDGateScanRecord[];
  notifications: AdminNotification[];
  pickupRequests: PickupRequest[];
  billingSettings: BillingSettings;

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

  // Invoice CRUD & Billing Settings
  addInvoice: (inv: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  updateBillingSettings: (settings: Partial<BillingSettings>) => void;

  // Driver live status
  setDriverStatus: (driverId: string, status: DriverStatus) => void;

  // Cleaning prefs
  addCleaningPref: (p: Omit<CleaningPref, 'id'>) => void;
  updateCleaningPref: (id: string, patch: Partial<CleaningPref>) => void;
  deleteCleaningPref: (id: string) => void;

  // Pickup Requests CRUD
  addPickupRequest: (p: Omit<PickupRequest, 'id' | 'createdAt'>) => PickupRequest;
  updatePickupRequest: (id: string, patch: Partial<PickupRequest>) => void;
  deletePickupRequest: (id: string) => void;
  assignDriverToPickup: (pickupId: string, driverId: string) => void;

  // RFID Gate Scanning & Multi-gate Tunneling Actions
  triggerGateScan: (gate: RFIDGateType, tenantId: string, simulateMissing?: boolean) => RFIDGateScanRecord;
  triggerFullTunnelSequence: (tenantId: string, simulateMissing?: boolean) => RFIDGateScanRecord[];

  // Notification Actions
  addNotification: (n: Omit<AdminNotification, 'id' | 'timestamp' | 'read' | 'isPopupShown'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissPopup: (id: string) => void;
  clearNotifications: () => void;
}

/* ──────────────── Store Implementation ──────────────── */
export const useWhiteFoxStore = create<WhiteFoxStore>()(
  persist(
    (set, get) => ({
      tenants: SEED_TENANTS,
      drivers: SEED_DRIVERS,
      employees: SEED_EMPLOYEES,
      cleaningPrefs: SEED_CLEANING_PREFS,
      invoices: SEED_INVOICES,
      gateScans: SEED_GATE_SCANS,
      notifications: SEED_NOTIFICATIONS,
      pickupRequests: SEED_PICKUP_REQUESTS,
      billingSettings: DEFAULT_BILLING_SETTINGS,

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
          pickupRequests: s.pickupRequests.filter((p) => p.tenantId !== id),
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

      updateBillingSettings: (settings) =>
        set((s) => ({
          billingSettings: { ...s.billingSettings, ...settings },
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

      /* ──────────────── Pickup Scheduling CRUD ──────────────── */
      addPickupRequest: (p) => {
        const newReq: PickupRequest = {
          ...p,
          id: `pck-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        };

        const notification: AdminNotification = {
          id: `notif-${Date.now()}`,
          timestamp: 'Just now',
          title: `📅 New Pickup Scheduled: ${p.tenantName}`,
          message: `${p.tenantName} requested laundry pickup on ${p.pickupDate} (${p.timeSlot}) for ~${p.estimatedGarments} garments (${p.estimatedHampers} hampers). Location: ${p.pickupLocation}.`,
          tenantId: p.tenantId,
          tenantName: p.tenantName,
          tenantCode: p.tenantCode,
          type: 'PICKUP_SCHEDULED',
          read: false,
          isPopupShown: false,
        };

        set((s) => ({
          pickupRequests: [newReq, ...s.pickupRequests],
          notifications: [notification, ...s.notifications],
        }));

        return newReq;
      },

      updatePickupRequest: (id, patch) =>
        set((s) => ({
          pickupRequests: s.pickupRequests.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deletePickupRequest: (id) =>
        set((s) => ({
          pickupRequests: s.pickupRequests.filter((p) => p.id !== id),
        })),

      assignDriverToPickup: (pickupId, driverId) => {
        const driver = get().drivers.find((d) => d.id === driverId);
        set((s) => ({
          pickupRequests: s.pickupRequests.map((p) =>
            p.id === pickupId
              ? {
                  ...p,
                  assignedDriverId: driverId,
                  assignedDriverName: driver?.name ?? 'Assigned Driver',
                  driverPhone: driver?.phone,
                  status: 'DRIVER_ASSIGNED',
                }
              : p
          ),
        }));
      },

      /* ──────────────── RFID Multi-Gate Tunneling Scan Logic with Inlet/Outlet Telemetry ──────────────── */
      triggerGateScan: (gate, tenantId, simulateMissing = false) => {
        const state = get();
        const tenant = state.tenants.find((t) => t.id === tenantId) ?? state.tenants[0];
        const tenantEmps = state.employees.filter((e) => e.tenantId === tenant.id);

        let gateName = 'Gate 1: Collection & Intake Unit';
        let gateLocation = 'Hospital Intake Tunnel Bay A';
        let targetGarmentStatus: GarmentSetItem['status'] = 'IN_LAUNDRY';
        let inletSource = `Hospital Soiled Linen Cart #${tenant.code}-01`;
        let outletDest = 'Automated Sorting & Disinfection Infeed Chute';

        if (gate === 'GATE_2_CLEANING') {
          gateName = 'Gate 2: Cleaning & Sterilization Unit';
          gateLocation = 'Continuous Wash Tunnel & Thermal QC Station';
          targetGarmentStatus = 'QC_PASSED';
          inletSource = 'Sorting Conveyor ➔ Continuous Batch Washer #2';
          outletDest = 'Thermal Barrier Dryers & Folding Station #3';
        } else if (gate === 'GATE_3_DELIVERY') {
          gateName = 'Gate 3: Delivery & Dispatch Unit';
          gateLocation = 'Clean Linen Dispatch Tunnel & Van Loading';
          targetGarmentStatus = 'PACKED';
          inletSource = 'Clean Uniform Bundling & Packaging Scanner #1';
          outletDest = `Delivery Vehicle Dock 2 (Manifest: MAN-${tenant.code})`;
        }

        const expectedCount = tenantEmps.length || tenant.employeeCount || 4;
        const missingCount = simulateMissing ? 1 : 0;
        const detectedCount = Math.max(0, expectedCount - missingCount);

        const detectedAssetIds: string[] = [];
        const missingGarments: MissingGarmentDetail[] = [];

        tenantEmps.forEach((emp, index) => {
          if (simulateMissing && index === tenantEmps.length - 1) {
            // Mark last garment as missing
            missingGarments.push({
              assetId: emp.setA.assetId || `WF-${tenant.code}-A00${index + 1}`,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              employeeCode: emp.employeeCode,
              department: emp.department,
              setItem: 'setA',
              garmentType: 'RFID Medical Garment',
              expectedStatus: `Expected at ${gateName}`,
            });
          } else {
            detectedAssetIds.push(emp.setC.assetId || `WF-${tenant.code}-C00${index + 1}`);
          }
        });

        const scanRecord: RFIDGateScanRecord = {
          id: `scan-${Date.now()}`,
          gate,
          gateName,
          gateLocation,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantCode: tenant.code,
          scannedAt: 'Just now',
          detectedCount,
          expectedCount,
          missingCount,
          detectedAssetIds,
          missingGarments,
          status: missingCount > 0 ? 'DISCREPANCY_ALERT' : 'NORMAL',
          disinfectionVerified: gate === 'GATE_2_CLEANING' || gate === 'GATE_3_DELIVERY',
          operatorNotes: missingCount > 0
            ? `⚠️ Discrepancy Alert: ${missingCount} garment missing from ${tenant.name} (${tenant.code}). Notification sent to Admin.`
            : `All ${detectedCount} RFID tags successfully validated at ${gateName}.`,
          telemetry: {
            inletTimestamp: new Date(Date.now() - 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            inletCount: expectedCount,
            inletSource,
            inletAssetIds: [...detectedAssetIds, ...missingGarments.map((m) => m.assetId)],
            outletTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            outletCount: detectedCount,
            outletDestination: outletDest,
            outletAssetIds: detectedAssetIds,
            throughputPerMinute: Math.floor(45 + Math.random() * 20),
            antennaPowerDb: 31.5,
            sensorHealth: missingCount > 0 ? 'WARNING' : 'OPTIMAL',
          },
        };

        // Update employee garment statuses based on gate
        const updatedEmployees = state.employees.map((emp) => {
          if (emp.tenantId === tenant.id) {
            if (simulateMissing && missingGarments.some((m) => m.assetId === emp.setA.assetId)) {
              return {
                ...emp,
                setA: { ...emp.setA, status: 'MISSING' as const },
              };
            }
            return {
              ...emp,
              setC: {
                ...emp.setC,
                status: targetGarmentStatus,
                washCount: gate === 'GATE_2_CLEANING' ? emp.setC.washCount + 1 : emp.setC.washCount,
              },
            };
          }
          return emp;
        });

        // Create Admin Notification
        const notification: AdminNotification = {
          id: `notif-${Date.now()}`,
          timestamp: 'Just now',
          title: missingCount > 0
            ? `🚨 DISCREPANCY: Missing Cloth at ${gateName}`
            : `📡 RFID Scan Complete: ${gateName}`,
          message: missingCount > 0
            ? `${detectedCount}/${expectedCount} garments detected for ${tenant.name}. ⚠️ Missing: ${missingGarments.map((m) => `${m.assetId} (${m.employeeName} - ${m.department})`).join(', ')}.`
            : `Tunnel detected all ${detectedCount} garments for ${tenant.name} (${tenant.code}) at ${gateLocation}. Inlet: ${expectedCount} pcs ➔ Outlet: ${detectedCount} pcs verified.`,
          gate,
          gateName,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantCode: tenant.code,
          detectedCount,
          expectedCount,
          missingGarments,
          type: missingCount > 0 ? 'MISSING_ALERT' : 'GATE_SCAN',
          read: false,
          isPopupShown: false,
        };

        set((s) => ({
          gateScans: [scanRecord, ...s.gateScans],
          employees: updatedEmployees,
          notifications: [notification, ...s.notifications],
          tenants: s.tenants.map((t) =>
            t.id === tenant.id
              ? {
                  ...t,
                  missingCount: missingCount > 0 ? (t.missingCount || 0) + 1 : t.missingCount,
                }
              : t
          ),
        }));

        return scanRecord;
      },

      triggerFullTunnelSequence: (tenantId, simulateMissing = false) => {
        const g1 = get().triggerGateScan('GATE_1_COLLECTION', tenantId, simulateMissing);
        const g2 = get().triggerGateScan('GATE_2_CLEANING', tenantId, false);
        const g3 = get().triggerGateScan('GATE_3_DELIVERY', tenantId, false);
        return [g1, g2, g3];
      },

      /* ──────────────── Notification Actions ──────────────── */
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: `notif-${Date.now()}`,
              timestamp: 'Just now',
              read: false,
              isPopupShown: false,
            },
            ...s.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      dismissPopup: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, isPopupShown: true } : n)),
        })),

      clearNotifications: () =>
        set(() => ({
          notifications: [],
        })),
    }),
    {
      name: 'whitefox-store-v3',
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

export const PICKUP_STATUS_LABELS: Record<PickupStatus, { label: string; color: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  DRIVER_EN_ROUTE: { label: 'Driver En Route', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  PICKED_UP: { label: 'Picked Up', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  IN_LAUNDRY: { label: 'In Laundry Plant', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
};

export const GATE_LABELS: Record<RFIDGateType, { label: string; short: string; color: string; desc: string }> = {
  GATE_1_COLLECTION: {
    label: 'Gate 1: Collection & Intake Unit',
    short: 'Gate 1 (Collection)',
    color: 'bg-blue-600 text-white',
    desc: 'Intake and receiving tunnel from hospital soiled linen carts.',
  },
  GATE_2_CLEANING: {
    label: 'Gate 2: Cleaning & Sterilization Unit',
    short: 'Gate 2 (Cleaning)',
    color: 'bg-amber-600 text-white',
    desc: 'Continuous wash batching, thermal barrier & QC inspection tunnel.',
  },
  GATE_3_DELIVERY: {
    label: 'Gate 3: Delivery & Dispatch Unit',
    short: 'Gate 3 (Delivery)',
    color: 'bg-emerald-600 text-white',
    desc: 'Packaging, dispatch and delivery vehicle loading verification.',
  },
};
