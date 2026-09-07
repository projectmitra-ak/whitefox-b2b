# 🌐 WhiteFox B2B Platform — Production Deployment Guide

This guide details how to take the newly generated deployment files and host the **WhiteFox B2B Application** on a live public domain with free HTTPS (SSL) certificates.

---

## 📂 Generated Production Deployment Files

The following deployment artifacts have been added directly to your codebase:

* [`docker-compose.prod.yml`](file:///c:/Users/singa/OneDrive/Desktop/whitefox%20B2B%20application/whitefox%20B2B%20application/whitefox/docker-compose.prod.yml): Production Docker Compose configuration with security hardening, volume persistence, restart policies, and logging limits.
* [`.env.example`](file:///c:/Users/singa/OneDrive/Desktop/whitefox%20B2B%20application/whitefox%20B2B%20application/whitefox/.env.example): Production environment variables template.
* [`infrastructure/nginx/whitefox.conf`](file:///c:/Users/singa/OneDrive/Desktop/whitefox%20B2B%20application/whitefox%20B2B%20application/whitefox/infrastructure/nginx/whitefox.conf): Nginx reverse proxy configuration for domain mapping, SSL termination, and WebSocket proxying.
* [`deploy.sh`](file:///c:/Users/singa/OneDrive/Desktop/whitefox%20B2B%20application/whitefox%20B2B%20application/whitefox/deploy.sh): Executable one-command automated deployment script.

---

## 📋 Step-by-Step Server Setup & Deployment

### Step 1: Provision a Cloud Server
Choose any cloud provider (AWS EC2, DigitalOcean Droplet, Hetzner, Linode, or GCP):
* **OS**: Ubuntu 22.04 LTS / 24.04 LTS
* **Minimum Specs**: 4 vCPU, 8 GB RAM, 40 GB SSD.

---

### Step 2: Configure Domain DNS
Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add DNS `A` records pointing to your server's Public IP address:

| Record Type | Host / Subdomain | Target IP |
| :--- | :--- | :--- |
| `A` | `yourdomain.com` | `YOUR_SERVER_PUBLIC_IP` |
| `A` | `www.yourdomain.com` | `YOUR_SERVER_PUBLIC_IP` |
| `A` | `api.yourdomain.com` | `YOUR_SERVER_PUBLIC_IP` |

---

### Step 3: Server Package Installation
Connect to your server via SSH (`ssh ubuntu@YOUR_SERVER_PUBLIC_IP`) and run:

```bash
# Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Nginx and Certbot for SSL
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

### Step 4: Clone Codebase & Setup Production `.env`
```bash
# Clone project repository
git clone <YOUR_GIT_REPOSITORY_URL> /var/www/whitefox
cd /var/www/whitefox/whitefox

# Create .env file from example template
cp .env.example .env

# Edit .env to set secure random passwords, JWT secret, and your domain name
nano .env
```

---

### Step 5: Configure Nginx & Enable Free SSL (HTTPS)
```bash
# Copy Nginx config to sites-available
sudo cp infrastructure/nginx/whitefox.conf /etc/nginx/sites-available/whitefox

# Replace 'yourdomain.com' with your actual domain name in the file
sudo sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN.com/g' /etc/nginx/sites-available/whitefox

# Enable the site
sudo ln -s /etc/nginx/sites-available/whitefox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Generate SSL certificates automatically using Certbot
sudo certbot --nginx -d YOUR_ACTUAL_DOMAIN.com -d www.YOUR_ACTUAL_DOMAIN.com -d api.YOUR_ACTUAL_DOMAIN.com
```

---

### Step 6: Launch Application
Run the automated deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ Verification & Post-Deployment Checklist

Once `./deploy.sh` finishes:
- Open `https://YOUR_ACTUAL_DOMAIN.com` in your browser.
- Verify HTTPS lock icon is active.
- Log in with the pre-configured admin account (`admin@whitefox.com` / `admin123`) to verify full functionality.
