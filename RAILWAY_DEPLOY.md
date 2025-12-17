# ILAI Railway Deployment Guide

## Overview

Deploy ILAI to Railway with PostgreSQL, Redis, and external free-tier services.

**Monthly Cost**: ~$5-10 (Railway) + Free tier services

---

## Pre-requisites

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

---

## Step 1: Create Railway Project

```bash
# Create new project
railway init

# Select "Empty Project"
```

---

## Step 2: Add Databases

In Railway Dashboard:

1. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the connection string

2. **Add Redis**
   - Click "New" → "Database" → "Redis"
   - Copy the connection string

---

## Step 3: Configure Environment Variables

Create these variables in Railway (Settings → Variables):

### Shared Variables (All Services)
```env
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=your-secure-jwt-secret-min-32-chars
```

### Database URL (from Railway PostgreSQL)
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
```

### Redis (from Railway Redis)
```env
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
```

### AI Service Specific
```env
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

---

## Step 4: Deploy Services

### Option A: Deploy from CLI

```powershell
# Navigate to project root
cd c:\Users\prasanth\Desktop\muse-ilai\ilai-001

# Build all JARs first
.\build-all.ps1 package

# Deploy Auth Service
cd services/muse-auth-service
railway up --service muse-auth-service

# Deploy Notes Service
cd ../muse-notes-service
railway up --service muse-notes-service

# Deploy AI Service
cd ../muse-ai-service
railway up --service muse-ai-service

# Deploy Academic Service
cd ../muse-academic-service
railway up --service muse-academic-service

# Deploy Social Service
cd ../muse-social-service
railway up --service muse-social-service
```

### Option B: Deploy from GitHub

1. Connect GitHub repo in Railway Dashboard
2. Railway auto-deploys on push

---

## Step 5: Deploy Frontend

### Option A: Railway

```bash
cd frontend/web
railway up --service ilai-frontend
```

### Option B: Vercel (Recommended - Free)

```bash
npm install -g vercel
cd frontend/web
vercel
```

---

## Step 6: Configure Domains

In Railway Dashboard for each service:

1. Go to Settings → Domains
2. Generate Railway domain: `service-name.up.railway.app`
3. Or add custom domain: `api.ilai.co.in`

### DNS Configuration (for ilai.co.in)

| Type | Name | Value |
|------|------|-------|
| CNAME | api | `muse-ai-service.up.railway.app` |
| CNAME | www | `ilai-frontend.up.railway.app` |

---

## Service Ports

| Service | Internal Port | Railway URL |
|---------|---------------|-------------|
| Auth | 8081 | `muse-auth-service.up.railway.app` |
| Notes | 8082 | `muse-notes-service.up.railway.app` |
| AI | 8088 | `muse-ai-service.up.railway.app` |
| Academic | 8090 | `muse-academic-service.up.railway.app` |
| Social | 8086 | `muse-social-service.up.railway.app` |
| Frontend | 80 | `ilai-frontend.up.railway.app` |

---

## Frontend Environment

Update `frontend/web/.env.production`:

```env
VITE_API_URL=https://muse-ai-service.up.railway.app
VITE_AUTH_URL=https://muse-auth-service.up.railway.app
VITE_NOTES_URL=https://muse-notes-service.up.railway.app
```

---

## External Free Tier Services

### File Storage: Cloudflare R2 (10GB Free)

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET=ilai-uploads
```

### Event Streaming: Upstash Kafka (Free Tier)

```env
KAFKA_BOOTSTRAP_SERVERS=your-upstash-kafka-url
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
```

---

## Monitoring

Railway provides built-in:
- **Logs**: Real-time service logs
- **Metrics**: CPU, Memory, Network
- **Alerts**: Configure in settings

---

## Migration to GCP Later

When ready to move to GCP:

```bash
# 1. Export PostgreSQL
railway run pg_dump -Fc > backup.dump

# 2. Import to Cloud SQL
gcloud sql import pg ilai-db gs://bucket/backup.dump

# 3. Update environment variables
# 4. Deploy to Cloud Run
```

---

## Troubleshooting

### Service not starting

```bash
railway logs --service muse-auth-service
```

### Database connection issues

Check connection string:
```bash
railway variables --service muse-auth-service
```

### Build failures

```bash
railway logs --service muse-auth-service --build
```

---

## Quick Commands

```bash
# View all services
railway status

# View logs
railway logs

# Open dashboard
railway open

# Restart service
railway redeploy --service muse-auth-service
```
