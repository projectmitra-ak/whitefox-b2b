# 🆓 100% Free Deployment Guide for WhiteFox B2B Platform

This guide explains how to deploy the entire **WhiteFox B2B Application** online for **100% FREE** without spending any money.

---

## 🌟 Top 2 Free Deployment Methods

| Method | Best For | Included Services | Setup Time |
| :--- | :--- | :--- | :--- |
| **Method A: Oracle Cloud Always Free VPS** *(Recommended)* | Running the complete Docker Compose stack on one server | Free Server (4 vCPU, 24GB RAM, 200GB Storage) - **Free Forever** | 15 mins |
| **Method B: Free SaaS Cloud Tier** | Deploying services across free cloud platforms | Vercel (Frontend) + Render (Backend) + Neon/Supabase (Database) + Upstash (Redis) | 20 mins |

---

## 🚀 Method A: Oracle Cloud "Always Free" VPS (Recommended)

Oracle Cloud provides a generous **Always Free Tier** that gives you an ARM Ampere compute instance with **4 vCPU, 24 GB RAM, and 200 GB Storage** completely **FREE FOREVER**.

### Step 1: Create Oracle Cloud Always Free Account
1. Sign up at [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
2. Create an **Ampere A1 Compute Instance** with:
   - **Shape**: `VM.Standard.A1.Flex`
   - **OCPUs**: 4 OCPUs
   - **Memory**: 24 GB RAM
   - **OS**: Ubuntu 22.04 LTS

### Step 2: Open Ports in Oracle Cloud Firewall
In your Oracle Cloud Console:
1. Navigate to **Virtual Cloud Networks** ➔ **Security Lists**.
2. Add Ingress Rules for:
   - Port `80` (HTTP)
   - Port `443` (HTTPS)
   - Port `3000` (Frontend)
   - Port `8080` (Backend API)

### Step 3: Run WhiteFox on Oracle Cloud
SSH into your free server and execute:

```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Clone WhiteFox repo
git clone https://github.com/projectmitra-ak/whitefox-b2b.git /var/www/whitefox
cd /var/www/whitefox/whitefox

# Run Docker Compose
docker compose up -d --build
```

Your app is now live online at `http://<YOUR_ORACLE_PUBLIC_IP>:3000`!

---

## ⚡ Method B: Free SaaS Cloud Services Stack

If you prefer using free managed cloud hosting platforms:

### 1. Deploy Frontend for Free on Vercel
1. Push your codebase to **GitHub**.
2. Sign up at [Vercel.com](https://vercel.com) using your GitHub account.
3. Click **Add New Project** ➔ Select your repository.
4. Set **Root Directory** to `whitefox/frontend`.
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://<YOUR_RENDER_BACKEND_URL>/api`
   - `NEXT_PUBLIC_WS_URL` = `wss://<YOUR_RENDER_BACKEND_URL>/ws`
   - `NEXTAUTH_URL` = `https://<YOUR_VERCEL_APP_URL>`
   - `NEXTAUTH_SECRET` = `LzMliik+cWnXYHBf8cYjfcNzO5m73WDeWIYr+hFzsSE=`
6. Click **Deploy**. Vercel will give you a free `https://whitefox-app.vercel.app` URL with SSL!

---

### 2. Deploy Free PostgreSQL Database on Neon / Supabase
1. Sign up at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Create a new free PostgreSQL database.
3. Enable PostGIS extension by running `CREATE EXTENSION IF NOT EXISTS postgis;` in the SQL editor.
4. Copy your PostgreSQL connection string:
   `postgres://user:password@ep-cool-db.neon.tech/whitefox`

---

### 3. Deploy Free Redis on Upstash
1. Sign up at [Upstash.com](https://upstash.com).
2. Create a free Serverless Redis database.
3. Copy the Redis Host, Port (`6379`), and Password.

---

### 4. Deploy Backend Java API on Render.com / Koyeb
1. Sign up at [Render.com](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Set **Root Directory** to `whitefox/backend`.
5. Set **Environment** to `Docker` (or Java Runtime).
6. Set Environment Variables:
   - `SPRING_PROFILES_ACTIVE` = `docker`
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<NEON_HOST>:5432/whitefox`
   - `SPRING_DATASOURCE_USERNAME` = `<NEON_USER>`
   - `SPRING_DATASOURCE_PASSWORD` = `<NEON_PASSWORD>`
   - `SPRING_REDIS_HOST` = `<UPSTASH_HOST>`
   - `JWT_SECRET` = `d2hpdGVmb3gtcHJvZC1zZWN1cmUtc2VjcmV0LWtleS1taW4tMjU2LWJpdHMtZGF0YQ==`
7. Click **Deploy Web Service**. Render gives you a free API endpoint (`https://whitefox-backend.onrender.com`).

---

## 🎯 Verification

After deploying:
1. Open your Vercel URL (`https://whitefox-app.vercel.app`).
2. Log in with the pre-configured accounts:
   - **Platform Admin**: `admin@whitefox.com` / `admin123`
   - **Tenant Admin**: `hospital@demo.com` / `demo123`
   - **Logistics Driver**: `driver@demo.com` / `demo123`
   - **Hospital Staff**: `employee@demo.com` / `demo123`
