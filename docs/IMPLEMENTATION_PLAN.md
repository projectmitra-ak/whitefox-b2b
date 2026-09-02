# WhiteFox B2B Laundry Management - Implementation Plan

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Language | Java | 21 (LTS) |
| Framework | Spring Boot | 3.2.5 |
| Architecture | Spring Modulith | 1.2.2 |
| Database | PostgreSQL | 16 |
| Time-series | TimescaleDB | 2.14 (as PG extension) |
| Cache | Redis | 7 |
| Messaging | Redpanda (Kafka API) | 23.3 |
| Build | Maven | 3.9+ |
| Frontend | Next.js | 14+ (App Router) |
| UI | Tailwind CSS + shadcn/ui | Latest |
| 3D | React Three Fiber + Three.js | Latest |
| Auth | Spring Security + JWT | 6.2+ |

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Backend - Core Configuration
- [ ] Spring Boot main application class
- [ ] `application.yml` with profiles (dev, docker, prod)
- [ ] Spring Modulith module configuration
- [ ] Global exception handling
- [ ] OpenAPI/Swagger configuration
- [ ] Flyway migration setup
- [ ] Redis cache configuration
- [ ] Kafka/Redpanda producer/consumer config
- [ ] WebSocket configuration for real-time updates

### 1.2 Database Schema (Flyway Migrations)
```
V1__create_tenant_schema.sql
V2__create_asset_schema.sql
V3__create_rfid_schema.sql
V4__create_laundry_schema.sql
V5__create_inventory_schema.sql
V6__create_3set_model_schema.sql
V7__create_billing_schema.sql
V8__create_audit_schema.sql
```

### 1.3 Infrastructure
- [ ] Docker Compose (already created)
- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] GitHub Actions CI pipeline
- [ ] Development scripts

---

## Phase 2: Core Domain Modules (Week 2-4)

### 2.1 Tenant Module (`com.whitefox.tenant`)
**Module Boundary:** Tenant, Hospital, Branch, Department, Contract, User

**Entities:**
- `Tenant` - Organization (Hospital, Hotel, etc.)
- `Branch` - Physical location
- `Department` - ICU, Emergency, etc.
- `Contract` - Service agreement with SLA
- `User` - Tenant users with roles

**API:**
```
GET    /api/tenants
POST   /api/tenants
GET    /api/tenants/{id}
PUT    /api/tenants/{id}
GET    /api/tenants/{id}/branches
POST   /api/tenants/{id}/branches
GET    /api/branches/{id}/departments
POST   /api/branches/{id}/departments
GET    /api/contracts
POST   /api/contracts
```

**Events Published:**
- `TenantCreatedEvent`
- `BranchCreatedEvent`
- `ContractSignedEvent`

### 2.2 Security Module (`com.whitefox.security`)
- JWT token generation/validation
- OAuth2 resource server config
- Role-based access control (RBAC)
- Multi-tenancy filter (tenant context)
- Method-level security (`@PreAuthorize`)

**Roles:**
- `WHITEFOX_ADMIN` - Platform admin
- `TENANT_ADMIN` - Hospital admin
- `PLANT_MANAGER` - Laundry plant operator
- `DRIVER` - Pickup/delivery driver
- `EMPLOYEE` - Hospital staff

### 2.3 Asset Module (`com.whitefox.asset`)
**Module Boundary:** Garment, RFIDTag, GarmentType, Size, Color, AssetLifecycle

**Entities:**
- `Garment` - Core asset with digital twin
- `GarmentType` - Shirt, Trouser, Scrub, Bedsheet, Towel
- `Size` - XS, S, M, L, XL, XXL, Custom
- `RFIDTag` - EPC, tag status, encoding info
- `AssetLifecycle` - State machine (PROCURED → TAGGED → ALLOCATED → IN_USE → IN_LOCKER → IN_LAUNDRY → WASHING → DRYING → QC → PACKED → DISPATCHED → DELIVERED → IN_USE)

**3-Set Model Entities:**
- `EmployeeGarmentSet` - Links Employee ↔ 3 Garments (Set A/B/C)
- `GarmentSetStatus` - IN_USE, IN_LOCKER, IN_LAUNDRY

**API:**
```
GET    /api/garments
POST   /api/garments
GET    /api/garments/{id}
PUT    /api/garments/{id}
POST   /api/garments/{id}/tag
GET    /api/garment-types
POST   /api/garment-types
GET    /api/employees/{id}/garment-sets
POST   /api/employees/{id}/garment-sets
PUT    /api/employees/{id}/garment-sets/rotate
```

**Events Published:**
- `GarmentCreatedEvent`
- `GarmentTaggedEvent`
- `GarmentAllocatedEvent`
- `GarmentStatusChangedEvent`
- `GarmentSetRotatedEvent`

### 2.4 Employee Module (part of Tenant or separate)
**Entities:**
- `Employee` - Staff member
- `EmployeeGarmentSet` - 3-set assignment

**API:**
```
GET    /api/employees
POST   /api/employees
GET    /api/employees/{id}
PUT    /api/employees/{id}
GET    /api/employees/{id}/current-set
POST   /api/employees/{id}/rotate-set
```

---

## Phase 3: RFID & Event Processing (Week 4-5)

### 3.1 RFID Module (`com.whitefox.rfid`)
**Module Boundary:** RFIDReader, RFIDGate, RFIDEvent, ScanSession, Deduplication

**Entities:**
- `RFIDReader` - Reader config (IP, port, location, protocol)
- `RFIDGate` - Physical gate (entry/exit, plant, hospital)
- `RFIDEvent` - Raw scan event (EPC, reader, timestamp, RSSI, antenna)
- `ScanSession` - Batch scan grouping

**Event Processing Pipeline:**
```
RFID Reader → Edge Gateway → Kafka (rfid.raw.events)
    → Deduplication Service (Redis-based, 5-sec window)
    → Enrichment (EPC → Garment → Tenant → Location)
    → Kafka (rfid.enriched.events)
    → Asset Tracking Consumer
    → Reconciliation Consumer
    → Analytics Consumer
```

**Kafka Topics:**
- `rfid.raw.events` - Raw scans from edge
- `rfid.enriched.events` - Enriched with business context
- `rfid.deduplication.log` - Dedup decisions

**API:**
```
GET    /api/readers
POST   /api/readers
GET    /api/gates
POST   /api/gates
GET    /api/rfid/events
GET    /api/rfid/events/{epc}/history
```

### 3.2 Edge Gateway (`edge/`)
- Python/Java service for RFID reader communication
- LLRP protocol support
- MQTT bridge for sensor data
- Local buffering (SQLite) for offline resilience
- Publishes to Redpanda

---

## Phase 4: Laundry Operations & 3-Set Model (Week 5-7)

### 4.1 Laundry Module (`com.whitefox.laundry`)
**Module Boundary:** Pickup, WashBatch, WashCycle, DryCycle, QC, Repair, Pack, Dispatch, Delivery

**Entities:**
- `PickupRequest` - Scheduled collection
- `Pickup` - Actual pickup with scanned garments
- `WashBatch` - Group of garments washed together
- `WashCycle` - Machine, program, temperature, chemicals
- `DryCycle` - Machine, program, temperature
- `QualityCheck` - PASS/FAIL/REWASH, defects
- `Repair` - Damage type, repair actions, cost
- `PackList` - Garments packed for delivery
- `Dispatch` - Outbound shipment
- `Delivery` - Confirmed delivery

**3-Set Rotation Logic:**
```
Employee has 3 sets: Set A (IN_USE), Set B (IN_LOCKER), Set C (IN_LAUNDRY)

On rotation (employee changes uniform):
1. Set A → IN_LAUNDRY (dirty)
2. Set B → IN_USE (clean from locker)
3. Set C → IN_LOCKER (clean from laundry)

On laundry completion:
- Washed garments → IN_LOCKER (becomes new Set C)
```

**State Machine:**
```
DIRTY_PICKED_UP → RECEIVED_AT_PLANT → SORTING → WASHING → DRYING → QC
    → (PASS) → PACKING → DISPATCHED → DELIVERED → IN_LOCKER
    → (FAIL) → REPAIR → REWASH / REPLACE
```

**API:**
```
POST   /api/pickups
GET    /api/pickups/{id}
POST   /api/pickups/{id}/scan
POST   /api/wash-batches
GET    /api/wash-batches/{id}
POST   /api/wash-batches/{id}/start
POST   /api/wash-batches/{id}/complete
POST   /api/quality-checks
POST   /api/repairs
POST   /api/pack-lists
POST   /api/dispatches
POST   /api/deliveries
GET    /api/garments/{id}/laundry-history
```

**Events Published:**
- `PickupCompletedEvent`
- `WashBatchStartedEvent`
- `WashBatchCompletedEvent`
- `QualityCheckCompletedEvent`
- `GarmentRepairedEvent`
- `DispatchCompletedEvent`
- `DeliveryConfirmedEvent`

### 4.2 Reconciliation Module (`com.whitefox.reconciliation`)
**Module Boundary:** Expected vs Received matching, Discrepancy detection, Missing garment alerts

**Entities:**
- `ReconciliationRun` - Batch reconciliation job
- `ExpectedGarment` - What should arrive
- `ReceivedGarment` - What actually arrived
- `Discrepancy` - Missing, Extra, Wrong garment
- `MissingGarmentAlert` - Notification for missing items

**Reconciliation Points:**
1. **Pickup**: Hospital expected vs Driver scanned
2. **Plant Receive**: Pickup scanned vs Plant gate scanned
3. **Dispatch**: Pack list vs Dispatch gate scanned
4. **Delivery**: Dispatch scanned vs Hospital received

**Algorithm:**
```
For each reconciliation point:
  expected = Set of EPCs from previous step
  received = Set of EPCs from current scan
  
  missing = expected - received
  extra = received - expected
  
  Create Discrepancy records
  Trigger alerts for missing > threshold
```

**API:**
```
POST   /api/reconciliation/run
GET    /api/reconciliation/runs
GET    /api/reconciliation/runs/{id}/discrepancies
GET    /api/discrepancies
GET    /api/missing-garments
```

---

## Phase 5: Inventory & Analytics (Week 7-8)

### 5.1 Inventory Module (`com.whitefox.inventory`)
**Module Boundary:** Real-time location, Availability, Utilization

**Entities:**
- `GarmentLocation` - Current location (tenant, branch, department, locker, plant, transit)
- `InventorySnapshot` - Periodic counts
- `UtilizationMetrics` - Wash count, age, predicted replacement

**Queries:**
```
GET /api/inventory/summary?tenantId=X
GET /api/inventory/by-status?tenantId=X
GET /api/inventory/by-location?tenantId=X
GET /api/inventory/garment/{id}/location-history
GET /api/inventory/utilization?tenantId=X
```

**Real-time Updates:** WebSocket `/ws/inventory` for live dashboard

### 5.2 Analytics Module (`com.whitefox.analytics`)
**Module Boundary:** Reports, Trends, Predictions

**Reports:**
- Garment lifecycle report
- Wash count distribution
- Loss/theft trends
- SLA compliance
- Plant utilization
- Cost per garment

**AI/ML Preparation:**
- Feature store for demand forecasting
- Replacement prediction features
- SLA risk scoring

---

## Phase 6: Frontend - Next.js with 3D (Week 3-8 parallel)

### 6.1 Project Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Login, register
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── dashboard/     # Main dashboard with 3D
│   │   │   ├── tenants/       # Tenant management
│   │   │   ├── garments/      # Asset management
│   │   │   ├── employees/     # Employee & 3-set model
│   │   │   ├── laundry/       # Laundry operations
│   │   │   ├── reconciliation/ # Reconciliation views
│   │   │   ├── inventory/     # Real-time inventory
│   │   │   ├── analytics/     # Reports & charts
│   │   │   └── settings/
│   │   └── api/               # API routes (proxy)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── 3d/                # React Three Fiber components
│   │   │   ├── GarmentLifecycle3D.tsx
│   │   │   ├── PlantVisualization3D.tsx
│   │   │   ├── GarmentFlow3D.tsx
│   │   │   └── hooks/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   ├── lib/
│   │   ├── api.ts             # API client (TanStack Query)
│   │   ├── auth.ts            # Auth utilities
│   │   ├── websocket.ts       # Real-time connection
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── styles/
```

### 6.2 3D Animations (React Three Fiber)

**1. Garment Lifecycle 3D Visualization (`GarmentLifecycle3D`)**
- Animated 3D garment model moving through stations
- Stations: Hospital → Truck → Plant Gate → Wash → Dry → QC → Pack → Truck → Hospital
- Real-time position based on actual garment status
- Click garment → see details panel

**2. Plant 3D View (`PlantVisualization3D`)**
- Isometric laundry plant layout
- Animated conveyor belts, washers, dryers
- Real-time batch progression
- Color-coded by tenant

**3. Garment Flow 3D (`GarmentFlow3D`)**
- Sankey-style 3D flow diagram
- Particles representing garments flowing
- Interactive: hover tenant → highlight flow
- Real-time updates via WebSocket

**4. 3-Set Model Animation (`ThreeSetModel3D`)**
- 3 rotating cylinders per employee
- Set A (body), Set B (locker), Set C (laundry)
- Smooth rotation animation on set change
- Click to see garment details

### 6.3 Key Pages

**Dashboard (`/dashboard`)**
- KPI cards with animated counters
- 3D garment lifecycle centerpiece
- Real-time alerts feed
- SLA risk indicators
- Quick actions

**Garment Management (`/garments`)**
- Searchable, filterable table
- 3D view toggle
- Bulk operations (tag, allocate, retire)

**Employee 3-Set View (`/employees/{id}/sets`)**
- Visual 3-set rotation interface
- Drag-drop to rotate sets
- History timeline

**Laundry Operations (`/laundry`)**
- Kanban board: Pickup → Wash → Dry → QC → Pack → Dispatch → Deliver
- 3D plant view
- Batch details modal

**Reconciliation (`/reconciliation`)**
- Discrepancy dashboard
- Missing garment tracker
- Resolution workflow

---

## Phase 7: Billing & Integrations (Week 8-9)

### 7.1 Billing Module (`com.whitefox.billing`)
- Invoice generation (GST-compliant)
- Usage-based billing (per wash, per garment)
- Contract pricing tiers
- Payment tracking

### 7.2 Integration Module (`com.whitefox.integration`)
- ERP sync (SAP, Oracle, Tally)
- HRMS sync (employee master)
- Accounting export
- Webhook framework

---

## Phase 8: Polish & Production (Week 9-10)

- [ ] End-to-end integration tests
- [ ] Performance testing (RFID event throughput)
- [ ] Security audit
- [ ] Documentation (API, Architecture, Deployment)
- [ ] Monitoring dashboards (Grafana)
- [ ] Log aggregation (Loki)
- [ ] Production deployment scripts
- [ ] User acceptance testing

---

## Database Schema Summary

### Core Tables
```sql
-- Tenant
tenant (id, name, code, status, created_at)
branch (id, tenant_id, name, address, gps_lat, gps_lng)
department (id, branch_id, name, code)
contract (id, tenant_id, name, sla_hours, price_per_wash, start_date, end_date)

-- Users & Auth
app_user (id, tenant_id, email, password_hash, role, status)
user_role (user_id, role)

-- Asset
garment_type (id, code, name, category, default_wash_program)
size (id, code, label, sort_order)
garment (id, asset_id, tenant_id, type_id, size_id, color, status, wash_count, manufacture_date, rfid_tag_id)
rfid_tag (id, epc, tag_type, status, encoded_at)

-- Employee & 3-Set
employee (id, tenant_id, branch_id, department_id, employee_code, name, status)
employee_garment_set (id, employee_id, set_a_garment_id, set_b_garment_id, set_c_garment_id, current_rotation)

-- RFID
rfid_reader (id, tenant_id, location_id, ip_address, port, protocol, status)
rfid_gate (id, reader_id, name, gate_type, direction)
rfid_event (id, epc, reader_id, gate_id, timestamp, rssi, antenna, session_id)

-- Laundry
pickup_request (id, tenant_id, branch_id, scheduled_at, status)
pickup (id, request_id, driver_id, started_at, completed_at, scanned_count)
wash_batch (id, plant_id, program_id, started_at, completed_at, status)
wash_cycle (id, batch_id, machine_id, program, temperature, duration)
quality_check (id, garment_id, result, defects, checked_by, checked_at)
repair (id, garment_id, damage_type, description, cost, status)
pack_list (id, dispatch_id, garment_ids)
dispatch (id, plant_id, driver_id, dispatched_at, estimated_arrival)
delivery (id, dispatch_id, received_at, received_by, confirmed_count)

-- Reconciliation
reconciliation_run (id, point_type, reference_id, started_at, completed_at, status)
discrepancy (id, run_id, epc, expected, received, type, resolved)
missing_garment_alert (id, garment_id, last_seen_location, alert_level, status)

-- Inventory (Materialized Views)
garment_location (garment_id, tenant_id, location_type, location_id, updated_at)
inventory_summary (tenant_id, status, count, updated_at)
```

---

## API Contract Examples

### Garment
```typescript
interface Garment {
  id: string;
  assetId: string;
  tenantId: string;
  type: GarmentType;
  size: Size;
  color: string;
  status: GarmentStatus;
  washCount: number;
  rfidTag?: RFIDTag;
  currentLocation: Location;
  employeeId?: string;
  setPosition?: 'A' | 'B' | 'C';
  createdAt: string;
  updatedAt: string;
}

enum GarmentStatus {
  PROCURED = 'PROCURED',
  TAGGED = 'TAGGED',
  ALLOCATED = 'ALLOCATED',
  IN_USE = 'IN_USE',
  IN_LOCKER = 'IN_LOCKER',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED_AT_PLANT = 'RECEIVED_AT_PLANT',
  SORTING = 'SORTING',
  WASHING = 'WASHING',
  DRYING = 'DRYING',
  QC_PENDING = 'QC_PENDING',
  QC_PASSED = 'QC_PASSED',
  QC_FAILED = 'QC_FAILED',
  REPAIRING = 'REPAIRING',
  PACKED = 'PACKED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  MISSING = 'MISSING',
  RETIRED = 'RETIRED'
}
```

### 3-Set Rotation Request
```typescript
interface RotateSetRequest {
  employeeId: string;
  reason: 'SHIFT_CHANGE' | 'SCHEDULED' | 'EMERGENCY' | 'DAMAGED';
  notes?: string;
}

interface RotateSetResponse {
  previousSetA: GarmentSummary;
  previousSetB: GarmentSummary;
  previousSetC: GarmentSummary;
  newSetA: GarmentSummary;   // Was Set B
  newSetB: GarmentSummary;   // Was Set C (clean from laundry)
  newSetC: GarmentSummary;   // Was Set A (dirty to laundry)
  rotatedAt: string;
}
```

### RFID Event (Enriched)
```typescript
interface RFIDEventEnriched {
  eventId: string;
  epc: string;
  garmentId: string;
  garmentAssetId: string;
  tenantId: string;
  tenantName: string;
  readerId: string;
  readerName: string;
  gateId: string;
  gateName: string;
  locationType: 'HOSPITAL' | 'PLANT' | 'TRUCK' | 'LOCKER';
  locationId: string;
  locationName: string;
  direction: 'ENTRY' | 'EXIT';
  timestamp: string;
  rssi: number;
  deduplicated: boolean;
}
```

---

## Kafka Event Schemas (Avro/JSON)

### GarmentStatusChangedEvent
```json
{
  "eventId": "uuid",
  "eventType": "GarmentStatusChangedEvent",
  "timestamp": "2026-08-15T10:30:00Z",
  "tenantId": "tenant-123",
  "garmentId": "garment-456",
  "assetId": "WF-TXT-0009281",
  "previousStatus": "IN_USE",
  "newStatus": "IN_LAUNDRY",
  "locationId": "branch-789",
  "triggeredBy": "employee-111",
  "metadata": {
    "setPosition": "A",
    "rotationReason": "SHIFT_CHANGE"
  }
}
```

### PickupCompletedEvent
```json
{
  "eventId": "uuid",
  "eventType": "PickupCompletedEvent",
  "timestamp": "2026-08-15T08:00:00Z",
  "tenantId": "tenant-123",
  "pickupId": "pickup-789",
  "branchId": "branch-456",
  "driverId": "driver-111",
  "expectedCount": 100,
  "scannedCount": 98,
  "missingEpcs": ["epc-1", "epc-2"],
  "garmentIds": ["garment-1", "garment-2", "..."]
}
```

---

## Development Commands

```bash
# Start infrastructure
docker-compose up -d

# Backend (from backend/)
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Frontend (from frontend/)
npm run dev

# Run tests
./mvnw test                    # Backend
npm run test                   # Frontend

# Build
./mvnw clean package           # Backend JAR
npm run build                  # Frontend

# Database migration
./mvnw flyway:migrate          # Apply migrations
./mvnw flyway:clean flyway:migrate  # Reset & migrate
```

---

## Success Criteria per Phase

| Phase | Criteria |
|-------|----------|
| 1 | All services start via docker-compose; API docs accessible |
| 2 | CRUD for Tenant, Asset, Employee; Multi-tenancy enforced |
| 3 | RFID events flow: Reader → Gateway → Kafka → Backend → DB |
| 4 | 3-set rotation works; Laundry lifecycle complete; Reconciliation detects missing |
| 5 | Real-time inventory dashboard; WebSocket updates |
| 6 | 3D visualizations render; Interactive; Data-driven |
| 7 | Invoices generated; ERP/HRMS sync functional |
| 8 | Production-ready; Monitoring; Documentation complete |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| RFID reader integration complexity | Start with simulator; abstract protocol behind interface |
| 3D performance on low-end devices | LOD (Level of Detail); fallback to 2D charts |
| Multi-tenancy data leakage | Row-level security policies; integration tests |
| Event throughput at scale | Partition by tenant_id; benchmark early |
| 3-set model edge cases | Comprehensive state machine tests; simulation |

---

## Next Steps

1. **Immediate**: Create Spring Boot main class + application.yml + Flyway V1
2. **Day 1-2**: Tenant module + Security + Multi-tenancy filter
3. **Day 3-4**: Asset module + 3-set model entities
4. **Day 5**: RFID module + Kafka config
5. **Week 2**: Next.js project + shadcn/ui + TanStack Query + React Three Fiber setup
6. **Week 2-3**: Build 3D components in parallel with backend

---

*Document Version: 1.0*
*Last Updated: 2026-08-15*