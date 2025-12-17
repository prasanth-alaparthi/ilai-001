# ILAI Oracle Cloud Deployment Guide

## Oracle Cloud Always Free Tier

Deploy ILAI for **FREE forever** with Oracle Cloud's generous always-free tier.

### What's Included (FREE)

| Resource | Specs | Usage |
|----------|-------|-------|
| Compute | 4 ARM VMs, 24GB RAM | All services |
| Database | 2 Autonomous DBs (20GB each) | PostgreSQL |
| Storage | 200GB block + 10GB object | Files, backups |
| Load Balancer | 1 flexible LB | Traffic routing |
| Bandwidth | 10TB/month | More than enough |

---

## Prerequisites

1. **Oracle Cloud Account**: [Sign up free](https://www.oracle.com/cloud/free/)
2. **OCI CLI**: [Install guide](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm)

---

## Step 1: Create Oracle Cloud Account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Sign up with email and credit card (won't be charged)
3. Select **Home Region**: Choose closest to your users (e.g., `ap-mumbai-1` for India)
4. Wait for account activation (few minutes)

---

## Step 2: Set Up OCI CLI

```bash
# Install OCI CLI
# Windows (PowerShell as Admin)
Set-ExecutionPolicy RemoteSigned
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1'))"

# Configure CLI
oci setup config
# Follow prompts: enter tenancy OCID, user OCID, region, etc.
```

---

## Step 3: Create Autonomous Database (PostgreSQL)

```bash
# Create Autonomous Database (Always Free)
oci db autonomous-database create \
  --compartment-id $COMPARTMENT_ID \
  --db-name "ilaidb" \
  --display-name "ILAI Database" \
  --db-workload "OLTP" \
  --is-free-tier true \
  --admin-password "YourSecurePassword123!" \
  --cpu-core-count 1 \
  --data-storage-size-in-tbs 1
```

Or use the Console:
1. Go to **Oracle Cloud Console** → **Autonomous Database**
2. Click **Create Autonomous Database**
3. Select **Always Free** toggle
4. Choose **Transaction Processing**
5. Set admin password
6. Create

---

## Step 4: Create Compute VMs (ARM - Always Free)

### VM Configuration

| VM | Services | RAM | vCPU |
|----|----------|-----|------|
| VM1 | Auth + Notes | 6GB | 1 |
| VM2 | AI + Academic | 6GB | 1 |
| VM3 | Social + Frontend | 6GB | 1 |

```bash
# Create VM (repeat for each)
oci compute instance launch \
  --compartment-id $COMPARTMENT_ID \
  --availability-domain "AD-1" \
  --shape "VM.Standard.A1.Flex" \
  --shape-config '{"ocpus":1,"memoryInGBs":6}' \
  --image-id $ORACLE_LINUX_ARM_IMAGE \
  --subnet-id $SUBNET_ID \
  --display-name "ilai-vm-1" \
  --assign-public-ip true
```

Or use Console:
1. **Compute** → **Instances** → **Create Instance**
2. Select **Always Free Eligible** shape: `VM.Standard.A1.Flex`
3. Configure: 1 OCPU, 6GB RAM
4. Select Oracle Linux 8 (ARM)
5. Add SSH key
6. Create

---

## Step 5: Configure VMs

SSH into each VM and run:

```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y dnf-utils
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker opc

# Install Java 21 (for building)
sudo dnf install -y java-21-openjdk java-21-openjdk-devel

# Clone repo
git clone https://github.com/your-repo/ilai.git
cd ilai
```

---

## Step 6: Deploy with Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  muse-auth-service:
    image: ghcr.io/your-org/muse-auth-service:latest
    ports:
      - "8081:8081"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=${DB_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: always

  muse-notes-service:
    image: ghcr.io/your-org/muse-notes-service:latest
    ports:
      - "8082:8082"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=${DB_URL}
    restart: always

  muse-ai-service:
    image: ghcr.io/your-org/muse-ai-service:latest
    ports:
      - "8088:8088"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=${DB_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    restart: always

  muse-social-service:
    image: ghcr.io/your-org/muse-social-service:latest
    ports:
      - "8086:8086"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=${DB_URL}
    restart: always

  muse-academic-service:
    image: ghcr.io/your-org/muse-academic-service:latest
    ports:
      - "8090:8090"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=${DB_URL}
    restart: always

  frontend:
    image: ghcr.io/your-org/ilai-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

volumes:
  redis_data:
```

Deploy:

```bash
# Create .env file
cat > .env << EOF
DB_URL=jdbc:oracle:thin:@ilaidb_high?TNS_ADMIN=/app/wallet
JWT_SECRET=your-secure-jwt-secret
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
EOF

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

---

## Step 7: Configure Load Balancer

1. **Networking** → **Load Balancers** → **Create Load Balancer**
2. Select **Flexible Load Balancer** (Always Free)
3. Configure listeners:
   - HTTP (80) → Backend set
   - HTTPS (443) → Backend set with SSL
4. Add backends (your 3 VMs)
5. Configure health checks: `/actuator/health`

---

## Step 8: Configure DNS

Point your domain to the Load Balancer IP:

| Type | Name | Value |
|------|------|-------|
| A | @ | Load Balancer IP |
| A | www | Load Balancer IP |
| A | api | Load Balancer IP |

---

## Step 9: SSL Certificate (Free)

Use Let's Encrypt with Certbot:

```bash
# Install certbot
sudo dnf install -y certbot

# Get certificate
sudo certbot certonly --standalone -d ilai.co.in -d www.ilai.co.in

# Auto-renewal
sudo systemctl enable certbot-renew.timer
```

---

## Firewall Rules

Open required ports in OCI Security List:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 8081-8090 | TCP | VCN CIDR | Internal services |

---

## Monitoring

Oracle Cloud provides free monitoring:

1. **Metrics** → CPU, Memory, Network
2. **Alarms** → Set alerts for high usage
3. **Logging** → Centralized logs

---

## Cost Summary

| Resource | Cost |
|----------|------|
| 3 ARM VMs (24GB total) | FREE |
| Autonomous Database | FREE |
| Load Balancer | FREE |
| Object Storage (10GB) | FREE |
| Bandwidth (10TB) | FREE |
| **Total** | **$0/month** |

---

## Troubleshooting

### VM not accessible
```bash
# Check security list rules
oci network security-list get --security-list-id $SECURITY_LIST_ID
```

### Database connection issues
```bash
# Test connection
sqlplus admin/password@ilaidb_high
```

### Service not starting
```bash
docker logs muse-auth-service
```

---

## Migration to Paid Tier (When Needed)

When you exceed 1000 users:

```bash
# Upgrade VM shape
oci compute instance update \
  --instance-id $INSTANCE_ID \
  --shape "VM.Standard.A1.Flex" \
  --shape-config '{"ocpus":4,"memoryInGBs":24}'
```
