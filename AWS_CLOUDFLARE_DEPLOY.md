# ILAI: AWS + Cloudflare Deployment Guide

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │   WAF       │  │    CDN      │  │  DNS        │               │
│  │ (Security)  │  │  (Cache)    │  │  (Routing)  │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                           AWS                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    EC2 Instance                           │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────────┐  │    │
│  │  │ Auth   │  │ Notes  │  │   AI   │  │    Frontend    │  │    │
│  │  │ :8081  │  │ :8082  │  │ :8088  │  │  Nginx :80     │  │    │
│  │  └────────┘  └────────┘  └────────┘  └────────────────┘  │    │
│  └─────────────────────────┬────────────────────────────────┘    │
│                            │                                      │
│  ┌─────────────────────────┼─────────────────────────────────┐   │
│  │  ┌──────────────┐  ┌────▼─────────┐  ┌──────────────────┐ │   │
│  │  │ RDS Postgres │  │  ElastiCache │  │   S3 (uploads)   │ │   │
│  │  │   (Free Tier)│  │    Redis     │  │   (5GB free)     │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘ │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Cloudflare Setup (15 minutes)

### Step 1: Add Your Domain to Cloudflare

1. Create account at [cloudflare.com](https://dash.cloudflare.com/sign-up)
2. Click **Add a Site** → Enter `ilai.co.in`
3. Select **Free Plan**
4. Cloudflare will scan your DNS records

### Step 2: Update Nameservers

Update your domain registrar (GoDaddy, Namecheap, etc.) with Cloudflare's nameservers:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

### Step 3: Configure DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | `<EC2-PUBLIC-IP>` | ✅ Proxied |
| A | www | `<EC2-PUBLIC-IP>` | ✅ Proxied |
| CNAME | api | `www.ilai.co.in` | ✅ Proxied |

### Step 4: Enable SSL/TLS

1. Go to **SSL/TLS** → **Overview**
2. Set to **Full (strict)**
3. Go to **Edge Certificates** → Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ TLS 1.3

### Step 5: Enable Security Features (Free)

**Firewall Rules** (Security → WAF):
```
# Block bad bots
(cf.client.bot) → Block

# Rate limit login
(http.request.uri.path contains "/api/auth/authenticate") → Rate Limit (10 req/min)
```

**Speed Optimizations** (Speed → Optimization):
- ✅ Auto Minify (JavaScript, CSS, HTML)
- ✅ Brotli Compression
- ✅ Rocket Loader (optional)

### Step 6: Page Rules (For SPA)

Create rule for `www.ilai.co.in/*`:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 4 hours

**Bypass cache for API**:
Rule for `www.ilai.co.in/api/*`:
- Cache Level: Bypass

---

## Part 2: AWS Setup (30 minutes)

### Prerequisites

1. AWS Account → [aws.amazon.com](https://aws.amazon.com)
2. AWS CLI installed:
```powershell
# Windows
winget install Amazon.AWSCLI
# or download from: https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure
aws configure
# Region: ap-south-1 (Mumbai - closest to India)
```

### Step 1: Create EC2 Instance

```bash
# Create key pair
aws ec2 create-key-pair \
    --key-name ilai-key \
    --query 'KeyMaterial' \
    --output text > ilai-key.pem

# Create security group
aws ec2 create-security-group \
    --group-name ilai-sg \
    --description "ILAI Security Group"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-name ilai-sg \
    --protocol tcp --port 22 --cidr YOUR_IP/32

aws ec2 authorize-security-group-ingress \
    --group-name ilai-sg \
    --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name ilai-sg \
    --protocol tcp --port 443 --cidr 0.0.0.0/0

# Launch EC2 (t2.micro = Free Tier)
aws ec2 run-instances \
    --image-id ami-0f5ee92e2d63afc18 \
    --instance-type t2.micro \
    --key-name ilai-key \
    --security-groups ilai-sg \
    --count 1
```

### Step 2: Create RDS PostgreSQL

1. AWS Console → **RDS** → **Create Database**
2. Settings:
   - ✅ Free tier
   - Engine: PostgreSQL 15
   - Instance: db.t3.micro
   - Storage: 20GB
   - Username: `postgres`
   - Password: (save securely!)
   - Public access: No (EC2 will connect internally)

### Step 3: SSH into EC2 and Setup

```bash
# Connect
ssh -i ilai-key.pem ec2-user@<EC2-PUBLIC-IP>

# Install Docker
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and re-login for docker group
exit
```

### Step 4: Deploy Application

```bash
ssh -i ilai-key.pem ec2-user@<EC2-PUBLIC-IP>

# Clone your repo
git clone https://github.com/YOUR_USERNAME/ilai.git
cd ilai

# Create production .env
cat > .env.production << 'EOF'
# Database (RDS)
DB_URL=jdbc:postgresql://<RDS-ENDPOINT>:5432/ilai
DB_USERNAME=postgres
DB_PASSWORD=<YOUR-RDS-PASSWORD>
DB_MAX_POOL_SIZE=10
DB_MIN_IDLE=5

# JWT Secrets (Generate new ones!)
JWT_SECRET=<YOUR-64-CHAR-SECRET>
JWT_ACCESS_SECRET=<YOUR-64-CHAR-SECRET>
JWT_REFRESH_SECRET=<YOUR-64-CHAR-SECRET>

# Email
MAIL_USERNAME=prasanthalaparthi32@gmail.com
MAIL_PASSWORD=<YOUR-APP-PASSWORD>

# AI Keys
GEMINI_API_KEY=<YOUR-KEY>
GROQ_API_KEY=<YOUR-KEY>
LLM_PROVIDER=groq

# Frontend
FRONTEND_BASE_URL=https://www.ilai.co.in

# Keycloak
KEYCLOAK_ISSUER_URI=https://www.ilai.co.in/realms/ilai
KEYCLOAK_JWKS_URI=https://www.ilai.co.in/realms/ilai/protocol/openid-connect/certs
EOF

# Copy production .env
cp .env.production .env

# Build and start
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Part 3: Cost Summary

### Cloudflare (FREE Plan)
| Feature | Status |
|---------|--------|
| CDN | ✅ Unlimited |
| DDoS Protection | ✅ Unlimited |
| SSL Certificate | ✅ Free |
| WAF (Basic) | ✅ Free |
| Rate Limiting | 10,000 requests/month |

### AWS (Free Tier - 12 months)
| Resource | Monthly Cost |
|----------|--------------|
| EC2 t2.micro | $0 |
| RDS db.t3.micro | $0 |
| S3 (5GB) | $0 |
| Data Transfer (15GB) | $0 |
| **Total** | **$0/month** |

### After Free Tier
| Resource | Monthly Cost |
|----------|--------------|
| EC2 t3.small | ~$15 |
| RDS db.t3.micro | ~$15 |
| Data Transfer | ~$5 |
| **Total** | **~$35-50/month** |

---

## Part 4: Verification Checklist

```
[ ] Cloudflare DNS propagated (check: nslookup www.ilai.co.in)
[ ] SSL shows Cloudflare certificate
[ ] Site loads at https://www.ilai.co.in
[ ] API responds at https://www.ilai.co.in/api/auth/health
[ ] Login/Register works
[ ] Notes can be created
[ ] Cloudflare Analytics showing traffic
```

---

## Troubleshooting

### "522 Connection Timed Out"
- EC2 is not responding on port 80
- Check: `curl http://<EC2-IP>` from your machine
- Fix: Check security group and docker containers

### "SSL Handshake Failed"
- Cloudflare SSL mode mismatch
- Fix: Set SSL/TLS to "Flexible" temporarily, then "Full"

### Docker containers not starting
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Database connection failed
```bash
# Test from EC2
docker exec -it muse-auth-service curl -v telnet://<RDS-ENDPOINT>:5432
```

---

## Next Steps

1. ✅ Create Cloudflare account
2. ✅ Add domain and update nameservers
3. ✅ Create AWS resources (EC2, RDS)
4. ✅ Deploy application
5. ⬜ Set up monitoring (CloudWatch)
6. ⬜ Configure backups (RDS automated)
7. ⬜ Set up CI/CD (GitHub Actions)
