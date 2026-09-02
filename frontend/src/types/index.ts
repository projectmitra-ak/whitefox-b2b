export interface Tenant {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';
  industry?: 'HEALTHCARE' | 'HOSPITALITY' | 'INDUSTRIAL' | 'EDUCATION' | 'OTHER';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  language: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  branchType: 'HOSPITAL' | 'CLINIC' | 'HOTEL' | 'HOSTEL' | 'FACTORY' | 'WAREHOUSE' | 'LAUNDRY_PLANT' | 'OTHER';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  phone?: string;
  email?: string;
  contactPerson?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  operatingHours: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  branchId: string;
  code: string;
  name: string;
  description?: string;
  departmentType?: 'ICU' | 'EMERGENCY' | 'SURGERY' | 'GENERAL_WARD' | 'OT' | 'RADIOLOGY' | 'LABORATORY' | 'PHARMACY' | 'ADMIN' | 'HOUSEKEEPING' | 'LAUNDRY' | 'KITCHEN' | 'FRONT_DESK' | 'MAINTENANCE' | 'OTHER';
  floor?: string;
  wing?: string;
  status: 'ACTIVE' | 'INACTIVE';
  garmentRequirements: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GarmentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: 'UPPER_BODY' | 'LOWER_BODY' | 'FULL_BODY' | 'LINEN' | 'TOWEL' | 'ACCESSORY' | 'OTHER';
  defaultWashProgramId?: string;
  defaultWashTempCelsius: number;
  typicalLifespanWashes: number;
  fabricComposition?: string;
  careInstructions?: string;
  standardWeightGrams?: number;
  colorFastnessRating?: number;
  shrinkageTolerancePercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Size {
  id: string;
  code: string;
  label: string;
  description?: string;
  sortOrder: number;
  chestCm?: number;
  waistCm?: number;
  hipCm?: number;
  lengthCm?: number;
  isStandard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Color {
  id: string;
  code: string;
  name: string;
  hexCode?: string;
  pantoneCode?: string;
  isStandard: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface RFIDTag {
  id: string;
  epc: string;
  tagType: 'UHF_PASSIVE' | 'UHF_ACTIVE' | 'HF_PASSIVE' | 'NFC' | 'BLE';
  manufacturer?: string;
  model?: string;
  encodingStandard: string;
  status: 'UNENCODED' | 'ENCODED' | 'VERIFIED' | 'ATTACHED' | 'ACTIVE' | 'DAMAGED' | 'LOST' | 'RETIRED';
  encodedAt?: string;
  verifiedAt?: string;
  attachedAt?: string;
  lastReadAt?: string;
  readCount: number;
  garmentId?: string;
  batchNumber?: string;
  warrantyExpiry?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type GarmentStatus =
  | 'PROCURED'
  | 'TAGGED'
  | 'ALLOCATED'
  | 'IN_USE'
  | 'IN_LOCKER'
  | 'IN_TRANSIT'
  | 'RECEIVED_AT_PLANT'
  | 'SORTING'
  | 'WASHING'
  | 'DRYING'
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'REPAIRING'
  | 'REPAIRED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'MISSING'
  | 'LOST'
  | 'DAMAGED'
  | 'RETIRED'
  | 'DISPOSED';

export type GarmentLocationType =
  | 'BRANCH'
  | 'DEPARTMENT'
  | 'LOCKER'
  | 'LAUNDRY_PLANT'
  | 'TRANSIT'
  | 'WASHING_MACHINE'
  | 'DRYER'
  | 'QC_STATION'
  | 'PACKING_STATION'
  | 'DISPATCH_AREA'
  | 'TRUCK';

export type CleaningType = 
  | 'DRY_CLEAN'
  | 'NORMAL_WASH_IRON'
  | 'IRON_ONLY'
  | 'WASH_FOLD'
  | 'STEAM_CLEAN'
  | 'STARCH_IRON';

export type WashStatus = 
  | 'NORMAL'
  | 'STAIN_DETECTED'
  | 'REWASH_REQUIRED'
  | 'REPAIR_REQUIRED'
  | 'REPLACE_REQUIRED'
  | 'DAMAGED_BEYOND_REPAIR'
  | 'DRYING'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED';

export type DamageStatus = 
  | 'NONE'
  | 'MINOR_REPAIR'
  | 'MAJOR_REPAIR'
  | 'REPLACE_REQUIRED'
  | 'STAIN_REQUIRES_REWASH';

export type GarmentCondition = 
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'DAMAGED';

export interface Garment {
  id: string;
  assetId: string;
  tenantId: string;
  garmentTypeId: string;
  sizeId: string;
  colorId: string;
  rfidTagId?: string;
  rfidTag?: RFIDTag;
  garmentType?: GarmentType;
  size?: Size;
  color?: Color;
  status: GarmentStatus;
  previousStatus?: GarmentStatus;
  statusChangedAt: string;
  currentBranchId?: string;
  currentBranch?: Branch;
  currentDepartmentId?: string;
  currentDepartment?: Department;
  currentLocationType?: GarmentLocationType;
  currentLocationId?: string;
  lockerNumber?: string;
  assignedEmployeeId?: string;
  setPosition?: 'A' | 'B' | 'C';
  manufactureDate?: string;
  procurementDate?: string;
  firstUseDate?: string;
  washCount: number;
  repairCount: number;
  qcPassCount: number;
  qcFailCount: number;
  totalDaysInUse: number;
  totalDaysInLaundry: number;
  lastWashDate?: string;
  lastQcDate?: string;
  predictedRetirementDate?: string;
  conditionRating?: number;
  lastConditionCheck?: string;
  condition?: GarmentCondition;
  washStatus?: WashStatus;
  damageStatus?: DamageStatus;
  damageNotes?: string;
  cleaningType?: CleaningType;
  preferredCleaningType?: CleaningType;
  notes?: string;
  purchaseCost?: number;
  depreciationPerWash?: number;
  currentBookValue?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  branchId?: string;
  branch?: Branch;
  departmentId?: string;
  department?: Department;
  employeeCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  hireDate?: string;
  terminationDate?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERN';
  role?: string;
  grade?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
  uniformRequired: boolean;
  setsAllocated: number;
  sizeId?: string;
  size?: Size;
  measurements: Record<string, unknown>;
  preferences: Record<string, unknown>;
  metadata: Record<string, unknown>;
  garmentSet?: EmployeeGarmentSet;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeGarmentSet {
  id: string;
  employeeId: string;
  employee?: Employee;
  setAGarmentId?: string;
  setAGarment?: Garment;
  setBGarmentId?: string;
  setBGarment?: Garment;
  setCGarmentId?: string;
  setCGarment?: Garment;
  currentRotation: number;
  lastRotatedAt?: string;
  lastRotatedBy?: string;
  rotationReason?: 'SHIFT_CHANGE' | 'SCHEDULED' | 'EMERGENCY' | 'DAMAGED' | 'MISSING' | 'MANUAL';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningPreference {
  id: string;
  employeeId: string;
  garmentTypeId: string;
  garmentType?: GarmentType;
  cleaningType: CleaningType;
  frequency: 'DAILY' | 'ALTERNATE_DAY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ON_DEMAND';
  specialInstructions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GarmentWashStatus {
  id: string;
  garmentId: string;
  garment?: Garment;
  washBatchId?: string;
  status: WashStatus;
  stainDetected: boolean;
  stainType?: string;
  stainLocation?: string;
  damageStatus: DamageStatus;
  damageNotes?: string;
  repairRequired: boolean;
  repairDescription?: string;
  repairCost?: number;
  replacementRequired: boolean;
  replacementReason?: string;
  replacementCost?: number;
  rewashRequired: boolean;
  rewashReason?: string;
  stainDetectedAt?: string;
  damageDetectedAt?: string;
  repairedAt?: string;
  replacedAt?: string;
  rewashCompletedAt?: string;
  qcCheckedAt?: string;
  qcCheckedBy?: string;
  qcNotes?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDashboardData {
  employee: Employee;
  garmentSet: EmployeeGarmentSet;
  cleaningPreferences: CleaningPreference[];
  garmentWashStatuses: GarmentWashStatus[];
}

export interface TenantDashboardData {
  tenant: Tenant;
  employees: EmployeeDashboardData[];
  summary: {
    totalEmployees: number;
    totalGarments: number;
    inUseCount: number;
    inLockerCount: number;
    inWashCount: number;
    repairCount: number;
    replaceCount: number;
    rewashCount: number;
    stainCount: number;
  };
}

export interface AdminDashboardData {
  totalTenants: number;
  totalEmployees: number;
  totalGarments: number;
  totalPlants: number;
  totalDrivers: number;
  revenue?: number;
  slaCompliance?: number;
  activeAlerts?: number;
  garmentsByStatus: Record<GarmentStatus, number>;
  garmentsByWashStatus: Record<string, number>;
  tenants: TenantSummary[];
  recentActivity: Activity[];
}

export interface GarmentStatsData {
  totalGarments: number;
  inCirculation: number;
  atPlant: number;
  byStatus: { status: string; count: number }[];
}

export interface TenantSummary {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
  garmentCount: number;
  inUseCount: number;
  inLockerCount: number;
  inWashCount: number;
  repairCount: number;
  replaceCount: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  tenantId?: string;
  tenantName?: string;
  employeeId?: string;
  employeeName?: string;
  garmentId?: string;
  garmentAssetId?: string;
  timestamp: string;
}

export interface DriverDashboardData {
  driver: Employee;
  assignedPickups: Pickup[];
  assignedDeliveries: Delivery[];
  todayStats: {
    pickupsScheduled: number;
    pickupsCompleted: number;
    deliveriesScheduled: number;
    deliveriesCompleted: number;
    garmentsCollected: number;
    garmentsDelivered: number;
  };
}

export interface Pickup {
  id: string;
  requestId?: string;
  tenantId: string;
  branchId: string;
  branch?: Branch;
  driverId?: string;
  vehicleId?: string;
  pickupNumber: string;
  status: 'SCHEDULED' | 'EN_ROUTE' | 'ARRIVED' | 'SCANNING' | 'LOADING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
  scheduledDate: string;
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  startedAt?: string;
  arrivedAt?: string;
  scanningStartedAt?: string;
  scanningCompletedAt?: string;
  loadingCompletedAt?: string;
  completedAt?: string;
  expectedGarmentCount: number;
  scannedGarmentCount: number;
  loadedGarmentCount: number;
  totalWeightKg?: number;
  notes?: string;
  issues: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  dispatchId: string;
  tenantId: string;
  branchId: string;
  branch?: Branch;
  deliveryNumber: string;
  status: 'PENDING' | 'ARRIVED' | 'UNLOADING' | 'SCANNING' | 'VERIFYING' | 'COMPLETED' | 'PARTIAL' | 'DISCREPANCY' | 'REJECTED' | 'RESCHEDULED';
  scheduledDate?: string;
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  arrivedAt?: string;
  unloadingStartedAt?: string;
  unloadingCompletedAt?: string;
  scanningStartedAt?: string;
  scanningCompletedAt?: string;
  verifiedAt?: string;
  completedAt?: string;
  expectedGarmentCount: number;
  receivedGarmentCount: number;
  verifiedGarmentCount: number;
  discrepancyCount: number;
  receivedBy?: string;
  verifiedBy?: string;
  notes?: string;
  issues: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WashProgram {
  id: string;
  code: string;
  name: string;
  description?: string;
  temperatureCelsius: number;
  durationMinutes: number;
  chemicalDosageMlPerKg?: number;
  waterLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  spinSpeedRpm?: number;
  suitableFabrics?: string[];
  unsuitableFabrics?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WashBatch {
  id: string;
  plantId: string;
  batchNumber: string;
  washProgramId?: string;
  machineId?: string;
  operatorId?: string;
  status: 'PENDING' | 'LOADING' | 'LOADED' | 'WASHING' | 'RINSING' | 'SPINNING' | 'UNLOADING' | 'COMPLETED' | 'FAILED' | 'ABORTED' | 'REWASH_REQUIRED' | 'DRYING' | 'QC_PASSED' | 'QC_FAILED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
  garmentCount: number;
  totalWeightKg: number;
  targetTemperatureCelsius?: number;
  actualTemperatureCelsius?: number;
  chemicalBatchId?: string;
  chemicalDosageMl?: number;
  waterConsumptionLiters?: number;
  energyConsumptionKwh?: number;
  startedAt?: string;
  washStartedAt?: string;
  washCompletedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  qualityCheckRequired: boolean;
  qcSampleRate: number;
  notes?: string;
  issues: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheck {
  id: string;
  garmentId: string;
  garment?: Garment;
  washBatchId?: string;
  dryCycleId?: string;
  plantId: string;
  qcNumber: string;
  checkerId?: string;
  checkType: 'POST_WASH' | 'POST_DRY' | 'PRE_PACK' | 'RANDOM_SAMPLE' | 'CUSTOMER_COMPLAINT' | 'REWORK_VERIFICATION';
  result: 'PASS' | 'FAIL' | 'REWASH' | 'REPAIR' | 'REPLACE' | 'CONDITIONAL_PASS';
  overallRating?: number;
  hasStains: boolean;
  stainTypes?: string[];
  stainSeverity?: 'LIGHT' | 'MODERATE' | 'HEAVY';
  hasTears: boolean;
  tearLocations?: string[];
  tearSeverity?: 'MINOR' | 'MAJOR' | 'CRITICAL';
  hasMissingButtons: boolean;
  missingButtonCount: number;
  hasBrokenZipper: boolean;
  hasFraying: boolean;
  hasDiscoloration: boolean;
  hasShrinkage: boolean;
  shrinkagePercent?: number;
  hasOdor: boolean;
  hasWrinkles: boolean;
  wrinkleSeverity?: 'LIGHT' | 'MODERATE' | 'HEAVY';
  measurements: Record<string, unknown>;
  photos: string[];
  checkedAt: string;
  reworkRequired: boolean;
  reworkNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Repair {
  id: string;
  garmentId: string;
  garment?: Garment;
  qualityCheckId?: string;
  plantId: string;
  repairNumber: string;
  repairType: 'STITCHING' | 'PATCHING' | 'BUTTON_REPLACEMENT' | 'ZIPPER_REPAIR' | 'ZIPPER_REPLACEMENT' | 'HEM_REPAIR' | 'SEAM_REPAIR' | 'STAIN_REMOVAL' | 'RE_DYEING' | 'OTHER';
  damageDescription: string;
  repairDescription?: string;
  materialsUsed: Record<string, unknown>[];
  laborMinutes: number;
  costMaterials: number;
  costLabor: number;
  totalCost: number;
  technicianId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'OUTSOURCED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startedAt?: string;
  completedAt?: string;
  warrantyDays: number;
  qcAfterRepairId?: string;
  outsourcedTo?: string;
  outsourcedCost?: number;
  notes?: string;
  photosBefore: string[];
  photosAfter: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Replacement {
  id: string;
  originalGarmentId: string;
  originalGarment?: Garment;
  replacementGarmentId?: string;
  replacementGarment?: Garment;
  reason: 'DAMAGED_BEYOND_REPAIR' | 'LOST' | 'STOLEN' | 'WORN_OUT' | 'SIZE_CHANGE' | 'OTHER';
  reasonDescription?: string;
  approvedBy?: string;
  approvedAt?: string;
  replacementCost: number;
  status: 'REQUESTED' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'ALLOCATED' | 'COMPLETED' | 'CANCELLED';
  requestedAt: string;
  approvedAtDate?: string;
  orderedAt?: string;
  receivedAt?: string;
  allocatedAt?: string;
  completedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Rewash {
  id: string;
  garmentId: string;
  garment?: Garment;
  originalWashBatchId?: string;
  rewashBatchId?: string;
  reason: 'STAIN' | 'ODOR' | 'WRINKLES' | 'INSUFFICIENT_CLEANING' | 'CHEMICAL_RESIDUE' | 'OTHER';
  reasonDescription?: string;
  requestedBy?: string;
  requestedAt: string;
  status: 'REQUESTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  qualityCheckId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummary {
  totalGarments: number;
  inUseCount: number;
  inLockerCount: number;
  inLaundryCount: number;
  missingCount: number;
  damagedCount: number;
  repairCount: number;
  replacementCount: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string[]>;
}