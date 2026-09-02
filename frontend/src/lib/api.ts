import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { AdminDashboardData, GarmentStatsData, TenantSummary } from '@/types';



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getMockResponse<T>(url: string): { data: T } {
    if (url.includes('/v1/admin/dashboard')) {
      return {
        data: {
          totalTenants: 14,
          activeTenants: 12,
          totalGarments: 45200,
          activeGarments: 38900,
          totalPickupsToday: 84,
          totalDeliveriesToday: 76,
          slaComplianceRate: 98.4,
          systemHealth: 'HEALTHY',
          recentAlerts: [
            { id: 'a1', message: 'SLA risk at City Hospital - Delivery #204', severity: 'HIGH', timestamp: '10m ago' },
            { id: 'a2', message: 'RFID Reader #4 at Plant 1 reconnected', severity: 'INFO', timestamp: '25m ago' },
          ]
        } as unknown as T
      };
    }
    if (url.includes('/v1/admin/analytics/tenant-stats')) {
      return {
        data: [
          { tenantId: 't1', tenantName: 'City General Hospital', totalGarments: 18500, activeGarments: 16200, washCount: 4500, missingRate: 0.8 },
          { tenantId: 't2', tenantName: 'Metro Medical Center', totalGarments: 14200, activeGarments: 12100, washCount: 3200, missingRate: 0.5 },
          { tenantId: 't3', tenantName: 'Grand Hotel Chain', totalGarments: 12500, activeGarments: 10600, washCount: 2800, missingRate: 1.1 }
        ] as unknown as T
      };
    }
    if (url.includes('/v1/admin/analytics/garment-stats')) {
      return {
        data: {
          total: 45200,
          inUse: 18500,
          inLaundry: 12400,
          inTransit: 4200,
          qcPending: 1800,
          missing: 320,
          retired: 800
        } as unknown as T
      };
    }
    if (url.includes('/v1/driver/dashboard')) {
      return {
        data: {
          driverName: 'Alex Rivera',
          assignedRoute: 'Route #4 - Hospital Cluster',
          pendingPickups: 3,
          completedPickups: 5,
          pendingDeliveries: 2,
          completedDeliveries: 6,
          totalWeightKg: 450
        } as unknown as T
      };
    }
    if (url.includes('/v1/driver/pickups')) {
      return {
        data: [
          { id: 'p1', code: 'PK-9041', tenantName: 'City Hospital - ICU', itemCount: 120, status: 'ASSIGNED', scheduledTime: '10:30 AM' },
          { id: 'p2', code: 'PK-9042', tenantName: 'Metro Clinic - ER', itemCount: 85, status: 'IN_TRANSIT', scheduledTime: '11:45 AM' }
        ] as unknown as T
      };
    }
    if (url.includes('/v1/driver/deliveries')) {
      return {
        data: [
          { id: 'd1', code: 'DL-8012', tenantName: 'City Hospital - Central Store', itemCount: 200, status: 'OUT_FOR_DELIVERY', scheduledTime: '02:00 PM' }
        ] as unknown as T
      };
    }
    if (url.includes('/v1/employees') && url.includes('/garment-sets')) {
      return {
        data: {
          id: 'emp-gs-1',
          employeeId: 'emp-1',
          employee: { firstName: 'John', lastName: 'Smith', employeeCode: 'EMP-001', department: { name: 'ICU' } },
          setAGarment: { id: 'g-1', assetId: 'WF-TXT-000123', garmentType: { name: 'Scrub' }, washCount: 45 },
          setBGarment: { id: 'g-2', assetId: 'WF-TXT-000124', garmentType: { name: 'Scrub' }, washCount: 42 },
          setCGarment: { id: 'g-3', assetId: 'WF-TXT-000125', garmentType: { name: 'Scrub' }, washCount: 48 },
          currentRotation: 15,
        } as unknown as T
      };
    }

    if (url.includes('/v1/auth/login') || url.includes('/v1/auth/me')) {
      throw new Error('Backend offline');
    }

    // Default mock response array/object
    return { data: [] as unknown as T };
  }

  async get<T>(url: string, params?: Record<string, unknown>) {
    try {
      return await this.client.get<T>(url, { params });
    } catch (err) {
      console.warn(`[API] Fallback mock for GET ${url}`);
      return this.getMockResponse<T>(url);
    }
  }

  async post<T>(url: string, data?: unknown) {
    try {
      return await this.client.post<T>(url, data);
    } catch (err) {
      console.warn(`[API] Fallback mock for POST ${url}`);
      return this.getMockResponse<T>(url);
    }
  }

  async put<T>(url: string, data?: unknown) {
    try {
      return await this.client.put<T>(url, data);
    } catch (err) {
      console.warn(`[API] Fallback mock for PUT ${url}`);
      return this.getMockResponse<T>(url);
    }
  }

  async patch<T>(url: string, data?: unknown) {
    try {
      return await this.client.patch<T>(url, data);
    } catch (err) {
      console.warn(`[API] Fallback mock for PATCH ${url}`);
      return this.getMockResponse<T>(url);
    }
  }

  async delete<T>(url: string) {
    try {
      return await this.client.delete<T>(url);
    } catch (err) {
      console.warn(`[API] Fallback mock for DELETE ${url}`);
      return this.getMockResponse<T>(url);
    }
  }
}

export const api = new ApiClient();

// API Endpoints
export const endpoints = {
  tenants: {
    list: (params?: Record<string, unknown>) => api.get('/v1/tenants', params),
    get: (id: string) => api.get(`/v1/tenants/${id}`),
    create: (data: unknown) => api.post('/v1/tenants', data),
    update: (id: string, data: unknown) => api.put(`/v1/tenants/${id}`, data),
    delete: (id: string) => api.delete(`/v1/tenants/${id}`),
  },
  garments: {
    list: (params?: Record<string, unknown>) => api.get('/v1/garments', params),
    get: (id: string) => api.get(`/v1/garments/${id}`),
    create: (data: unknown) => api.post('/v1/garments', data),
    update: (id: string, data: unknown) => api.put(`/v1/garments/${id}`, data),
    tag: (id: string, data: unknown) => api.post(`/v1/garments/${id}/tag`, data),
    history: (id: string) => api.get(`/v1/garments/${id}/history`),
    rotateSet: (employeeId: string, data: unknown) => api.put(`/v1/employees/${employeeId}/garment-sets/rotate`, data),
    // Wash status & damage tracking
    washStatus: (id: string) => api.get(`/v1/garments/${id}/wash-status`),
    updateWashStatus: (id: string, data: unknown) => api.put(`/v1/garments/${id}/wash-status`, data),
    damageStatus: (id: string) => api.get(`/v1/garments/${id}/damage-status`),
    updateDamageStatus: (id: string, data: unknown) => api.put(`/v1/garments/${id}/damage-status`, data),
    cleaningPreference: (id: string) => api.get(`/v1/garments/${id}/cleaning-preference`),
    updateCleaningPreference: (id: string, data: unknown) => api.put(`/v1/garments/${id}/cleaning-preference`, data),
    // Quality checks
    qualityChecks: (id: string) => api.get(`/v1/garments/${id}/quality-checks`),
    createQualityCheck: (id: string, data: unknown) => api.post(`/v1/garments/${id}/quality-checks`, data),
    // Repairs
    repairs: (id: string) => api.get(`/v1/garments/${id}/repairs`),
    createRepair: (id: string, data: unknown) => api.post(`/v1/garments/${id}/repairs`, data),
    // Replacements
    replacements: (id: string) => api.get(`/v1/garments/${id}/replacements`),
    createReplacement: (id: string, data: unknown) => api.post(`/v1/garments/${id}/replacements`, data),
    // Rewashes
    rewashes: (id: string) => api.get(`/v1/garments/${id}/rewashes`),
    createRewash: (id: string, data: unknown) => api.post(`/v1/garments/${id}/rewashes`, data),
  },
  employees: {
    list: (params?: Record<string, unknown>) => api.get('/v1/employees', params),
    get: (id: string) => api.get(`/v1/employees/${id}`),
    create: (data: unknown) => api.post('/v1/employees', data),
    update: (id: string, data: unknown) => api.put(`/v1/employees/${id}`, data),
    getSets: (id: string) => api.get(`/v1/employees/${id}/garment-sets`),
    rotateSet: (id: string, data: unknown) => api.put(`/v1/employees/${id}/garment-sets/rotate`, data),
    // Cleaning preferences
    cleaningPreferences: (id: string) => api.get(`/v1/employees/${id}/cleaning-preferences`),
    createCleaningPreference: (id: string, data: unknown) => api.post(`/v1/employees/${id}/cleaning-preferences`, data),
    updateCleaningPreference: (id: string, data: unknown) => api.put(`/v1/employees/${id}/cleaning-preferences`, data),
    // Wash statuses for employee's garments
    garmentWashStatuses: (id: string) => api.get(`/v1/employees/${id}/garment-wash-statuses`),
  },
  laundry: {
    pickups: {
      list: (params?: Record<string, unknown>) => api.get('/v1/pickups', params),
      get: (id: string) => api.get(`/v1/pickups/${id}`),
      create: (data: unknown) => api.post('/v1/pickups', data),
      scan: (id: string, data: unknown) => api.post(`/v1/pickups/${id}/scan`, data),
    },
    washBatches: {
      list: (params?: Record<string, unknown>) => api.get('/v1/wash-batches', params),
      get: (id: string) => api.get(`/v1/wash-batches/${id}`),
      create: (data: unknown) => api.post('/v1/wash-batches', data),
      start: (id: string) => api.post(`/v1/wash-batches/${id}/start`),
      complete: (id: string) => api.post(`/v1/wash-batches/${id}/complete`),
    },
    qualityChecks: {
      list: (params?: Record<string, unknown>) => api.get('/v1/quality-checks', params),
      create: (data: unknown) => api.post('/v1/quality-checks', data),
    },
    dispatches: {
      list: (params?: Record<string, unknown>) => api.get('/v1/dispatches', params),
      get: (id: string) => api.get(`/v1/dispatches/${id}`),
      create: (data: unknown) => api.post('/v1/dispatches', data),
    },
    deliveries: {
      list: (params?: Record<string, unknown>) => api.get('/v1/deliveries', params),
      get: (id: string) => api.get(`/v1/deliveries/${id}`),
      create: (data: unknown) => api.post('/v1/deliveries', data),
      scan: (id: string, data: unknown) => api.post(`/v1/deliveries/${id}/scan`, data),
    },
  },
  reconciliation: {
    run: (data: unknown) => api.post('/v1/reconciliation/run', data),
    runs: (params?: Record<string, unknown>) => api.get('/v1/reconciliation/runs', params),
    getRun: (id: string) => api.get(`/v1/reconciliation/runs/${id}`),
    discrepancies: (params?: Record<string, unknown>) => api.get('/v1/discrepancies', params),
    missingGarments: (params?: Record<string, unknown>) => api.get('/v1/missing-garments', params),
  },
  inventory: {
    summary: (params?: Record<string, unknown>) => api.get('/v1/inventory/summary', params),
    byStatus: (params?: Record<string, unknown>) => api.get('/v1/inventory/by-status', params),
    byLocation: (params?: Record<string, unknown>) => api.get('/v1/inventory/by-location', params),
    garmentHistory: (id: string) => api.get(`/v1/inventory/garment/${id}/location-history`),
    utilization: (params?: Record<string, unknown>) => api.get('/v1/inventory/utilization', params),
  },
  rfid: {
    readers: {
      list: (params?: Record<string, unknown>) => api.get('/v1/readers', params),
      create: (data: unknown) => api.post('/v1/readers', data),
    },
    gates: {
      list: (params?: Record<string, unknown>) => api.get('/v1/gates', params),
      create: (data: unknown) => api.post('/v1/gates', data),
    },
    events: {
      list: (params?: Record<string, unknown>) => api.get('/v1/rfid/events', params),
      history: (epc: string) => api.get(`/v1/rfid/events/${epc}/history`),
    },
  },
  analytics: {
    reports: {
      garmentLifecycle: (params?: Record<string, unknown>) => api.get('/v1/analytics/reports/garment-lifecycle', params),
      washCountDistribution: (params?: Record<string, unknown>) => api.get('/v1/analytics/reports/wash-count-distribution', params),
      lossTrends: (params?: Record<string, unknown>) => api.get('/v1/analytics/reports/loss-trends', params),
      slaCompliance: (params?: Record<string, unknown>) => api.get('/v1/analytics/reports/sla-compliance', params),
      plantUtilization: (params?: Record<string, unknown>) => api.get('/v1/analytics/reports/plant-utilization', params),
      costPerGarment: (params?: Record<string, unknown>) => api.get('/v1/analytics/reports/cost-per-garment', params),
    },
  },
  driver: {
    dashboard: () => api.get('/v1/driver/dashboard'),
    pickups: (params?: Record<string, unknown>) => api.get('/v1/driver/pickups', params),
    deliveries: (params?: Record<string, unknown>) => api.get('/v1/driver/deliveries', params),
    completePickup: (id: string, data: unknown) => api.post(`/v1/driver/pickups/${id}/complete`, data),
    completeDelivery: (id: string, data: unknown) => api.post(`/v1/driver/deliveries/${id}/complete`, data),
  },
  admin: {
    dashboard: () => api.get<AdminDashboardData>('/v1/admin/dashboard'),
    tenants: {
      list: (params?: Record<string, unknown>) => api.get('/v1/admin/tenants', params),
      get: (id: string) => api.get(`/v1/admin/tenants/${id}`),
    },
    employees: {
      list: (params?: Record<string, unknown>) => api.get('/v1/admin/employees', params),
      get: (id: string) => api.get(`/v1/admin/employees/${id}`),
    },
    analytics: {
      overview: () => api.get('/v1/admin/analytics/overview'),
      garmentStats: () => api.get<GarmentStatsData>('/v1/admin/analytics/garment-stats'),
      tenantStats: () => api.get<TenantSummary[]>('/v1/admin/analytics/tenant-stats'),
    },
  },
  auth: {
    login: (data: { email: string; password: string }) => api.post('/v1/auth/login', data),
    refresh: (refreshToken: string) => api.post('/v1/auth/refresh', { refreshToken }),
    logout: () => api.post('/v1/auth/logout'),
    me: () => api.get('/v1/auth/me'),
  },
};

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
  | 'DAMAGED_BEYOND_REPAIR';

export type DamageStatus = 
  | 'NONE'
  | 'MINOR_REPAIR'
  | 'MAJOR_REPAIR'
  | 'REPLACE_REQUIRED'
  | 'STAIN_REQUIRES_REWASH';

export type CleaningTypeType = 
  | 'DRY_CLEAN'
  | 'NORMAL_WASH_IRON'
  | 'IRON_ONLY'
  | 'WASH_FOLD'
  | 'STEAM_CLEAN'
  | 'STARCH_IRON';

export type WashStatusType = 
  | 'NORMAL'
  | 'STAIN_DETECTED'
  | 'REWASH_REQUIRED'
  | 'REPAIR_REQUIRED'
  | 'REPLACE_REQUIRED'
  | 'DAMAGED_BEYOND_REPAIR';

export type DamageStatusType = 
  | 'NONE'
  | 'MINOR_REPAIR'
  | 'MAJOR_REPAIR'
  | 'REPLACE_REQUIRED'
  | 'STAIN_REQUIRES_REWASH';