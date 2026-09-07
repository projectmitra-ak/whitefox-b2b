# WhiteFox — Multi-Tenant B2B Laundry Management & RFID Tracking

WhiteFox is an enterprise B2B laundry tracking and management system designed for healthcare, hospitality, and commercial operations with UHF RFID gate scanning, driver logistics, pickup scheduling, and automated billing.

---

## 🚀 Live Application Links

When Docker containers are running (`docker compose up -d`):

| Service | Access Link | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Next.js 14 Web Application |
| **Login Portal** | [http://localhost:3000/login](http://localhost:3000/login) | Role switcher & authentication |
| **Swagger UI** | [http://localhost:8080/api/swagger-ui/index.html](http://localhost:8080/api/swagger-ui/index.html) | Interactive Backend API Explorer |
| **Backend Health** | [http://localhost:8080/api/actuator/health](http://localhost:8080/api/actuator/health) | Spring Boot Actuator status |
| **API Docs (JSON)** | [http://localhost:8080/api/v3/api-docs](http://localhost:8080/api/v3/api-docs) | OpenAPI specification |

---

## 🔑 Demo Credentials

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@whitefox.com` | `admin123` | Multi-Tenant Management, 3-Gate RFID Tunnel, Master Pickup Calendar, Itemized GST Billing, Discrepancy Alerts |
| **Tenant Admin** | `hospital@demo.com` | `demo123` | Employee 3-Set Uniform Inventory (Set A/B/C), Schedule Pickup Calendar, View Invoices |
| **Logistics Driver** | `driver@demo.com` | `demo123` | Live Route Updates (En Route, Picked Up, Delivered), Assigned Pickup Schedule |
| **Staff Member** | `employee@demo.com` | `demo123` | Personal uniform tracking, wash cycle counter, RFID tags |

---

## 🛠️ Docker Containers & Architecture

All services run locally via Docker Compose:

* **`whitefox-frontend`**: Next.js 14 standalone container on port `3000`
* **`whitefox-backend`**: Java Spring Boot 3 on port `8080` (context path `/api`)
* **`whitefox-postgres`**: PostgreSQL 16 + PostGIS on port `5432`
* **`whitefox-redis`**: Redis 7 cache on port `6379`
* **`whitefox-redpanda`**: Redpanda (Kafka-compatible) on ports `9092` & `19092`

### Start / Stop Commands
```bash
# Start all containers in background
docker compose up -d

# Rebuild frontend after code changes
docker compose up -d --build frontend

# Stop all containers
docker compose down
```

---

## ✨ Features Included
1. **3-Gate RFID Tunneling Station**: Continuous wash UHF telemetry, Inlet/Outlet garment count validation, and automated discrepancy alerting.
2. **Master Pickup & Drop Calendar**: Monthly/weekly schedule to book and assign laundry collection and return slots.
3. **Itemized GST Invoicing**: Base rates, disinfection charges, express fees, missing garment penalties, and configurable GST taxes.
4. **Multi-Tenant Staff Uniform Tracking**: 3-Set uniform rotation (Set A: In Use, Set B: In Locker, Set C: In Laundry).
