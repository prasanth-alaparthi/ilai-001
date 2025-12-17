# 🚂 ILAI Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Railway CLI** (optional): `npm install -g @railway/cli`

---

## 🏗️ Architecture on Railway

```
Railway Project: ILAI
├── PostgreSQL (Railway Plugin)
├── Redis (Railway Plugin)
├── muse-auth-service
├── muse-notes-service
├── muse-feed-service
├── muse-ai-service
├── muse-chat-service
├── muse-parental-service
├── muse-classroom-service
├── muse-academic-service
├── muse-labs-service
└── muse-frontend
```

---

## 📋 Step-by-Step Deployment

### Step 1: Create Railway Project

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Name it: `ilai-production`

---

### Step 2: Add PostgreSQL

1. In your project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL instance
4. Note: Railway auto-creates `DATABASE_URL` variable

---

### Step 3: Add Redis

1. Click **"+ New"**
2. Select **"Database"** → **"Add Redis"**
3. Railway creates `REDIS_URL` variable

---

### Step 4: Create Databases

Railway creates one database. For multiple databases, connect and run:

```sql
-- Connect to Railway PostgreSQL
CREATE DATABASE muse_auth;
CREATE DATABASE muse_notes;
CREATE DATABASE muse_feed;
CREATE DATABASE muse_ai;
CREATE DATABASE muse_chat;
CREATE DATABASE muse_parental;
CREATE DATABASE muse_classroom;
CREATE DATABASE muse_academic;
CREATE DATABASE muse_labs;
```

---

### Step 5: Deploy Services (One by One)

**For each service:**

1. Click **"+ New"** → **"GitHub Repo"**
2. Connect your repository
3. In **Settings**:
   - **Root Directory**: `services/muse-auth-service` (adjust per service)
   - **Build Command**: Leave empty (uses Dockerfile)
   - **Watch Paths**: `services/muse-auth-service/**`
4. Add **Environment Variables** (see below)

---

## 🔐 Environment Variables

### Shared Variables (add to all Java services)

```env
# Database (Railway provides these automatically for the main DB)
DB_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
DB_USERNAME=${PGUSER}
DB_PASSWORD=${PGPASSWORD}

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_SECRET=your-access-secret-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters

# Redis
REDIS_HOST=${REDISHOST}
REDIS_PORT=${REDISPORT}
REDIS_PASSWORD=${REDISPASSWORD}

# Memory settings
JAVA_TOOL_OPTIONS=-Xms256m -Xmx512m

# Connection pool
DB_MAX_POOL_SIZE=10
DB_MIN_IDLE=3
```

### Per-Service Environment Variables

#### muse-auth-service
```env
SERVER_PORT=8081
DB_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/muse_auth
SENDGRID_API_KEY=your-sendgrid-key
SENDER_EMAIL_ADDRESS=noreply@ilai.co.in
FRONTEND_BASE_URL=https://your-frontend.railway.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_EMAIL_VERIFICATION_ENABLED=false
```

#### muse-notes-service
```env
SERVER_PORT=8082
DB_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/muse_notes
AUTH_SERVICE_URL=https://muse-auth-service.railway.internal:8081
GEMINI_API_KEY=your-gemini-api-key
```

#### muse-ai-service
```env
SERVER_PORT=8088
DB_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/muse_ai
GEMINI_API_KEY=your-gemini-api-key
AUTH_SERVICE_URL=https://muse-auth-service.railway.internal:8081
NOTES_SERVICE_URL=https://muse-notes-service.railway.internal:8082
FEED_SERVICE_URL=https://muse-feed-service.railway.internal:8083
CLASSROOM_SERVICE_URL=https://muse-classroom-service.railway.internal:8090
CHAT_SERVICE_URL=https://muse-chat-service.railway.internal:8086
```

#### muse-frontend
```env
# No special env vars needed - uses nginx.conf
```

---

## 🔗 Internal Service Communication

Railway provides private networking via `.railway.internal` domain.

In your Java services, use Railway reference variables:
```env
AUTH_SERVICE_URL=${{muse-auth-service.RAILWAY_PRIVATE_DOMAIN}}:8081
```

---

## 📁 Railway Configuration Files

Create a `railway.toml` in each service directory:

### services/muse-auth-service/railway.toml
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/actuator/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 5
```

---

## 🚀 Deployment Order

Deploy in this order (dependencies first):

1. **PostgreSQL** (plugin)
2. **Redis** (plugin)
3. **muse-auth-service** (no dependencies)
4. **muse-notes-service** (depends on auth)
5. **muse-feed-service** (depends on auth, notes)
6. **muse-ai-service** (depends on all)
7. **muse-chat-service**
8. **muse-parental-service**
9. **muse-classroom-service**
10. **muse-academic-service**
11. **muse-labs-service**
12. **muse-frontend** (last)

---

## 🌐 Custom Domain (Optional)

1. Go to service **Settings** → **Networking**
2. Click **"Add Custom Domain"**
3. Add your domain: `api.ilai.co.in`, `app.ilai.co.in`
4. Add DNS records as shown by Railway

---

## 💰 Cost Estimate

| Component | Est. Cost |
|-----------|-----------|
| PostgreSQL | $5-10/month |
| Redis | $3-5/month |
| Services (10x) | $20-50/month |
| **Total** | **~$30-70/month** |

Railway offers $5 free credit monthly on the Hobby plan.

---

## ⚠️ Important Notes

1. **Free Tier Limits**: Railway pauses services after inactivity
2. **Upgrade to Hobby**: $5/month for always-on services
3. **Resource Limits**: Adjust memory per service as needed
4. **Build Times**: First build takes 5-10 min, subsequent builds faster

---

## 🔧 Troubleshooting

### Build Fails
- Check Dockerfile paths
- Verify root directory setting
- Check logs in Railway dashboard

### Service Can't Connect to Database
- Verify DB_URL format
- Check if database exists
- Verify connection pool settings

### Services Can't Communicate
- Use `.railway.internal` for private networking
- Check port numbers in URLs
- Verify health checks pass first
