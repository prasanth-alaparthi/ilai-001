# ILAI Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **GCP Project** created
3. **gcloud CLI** installed and authenticated

## Quick Start

### 1. Set Up GCP Infrastructure

```powershell
# Run the setup script
.\setup-gcp.ps1 -ProjectId "your-project-id" -DbPassword "your-secure-password"
```

This creates:
- Cloud SQL (PostgreSQL 15)
- Memorystore Redis
- Secret Manager secrets
- Required API permissions

### 2. Add API Keys

```bash
# Add your secrets
echo "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo "your-gemini-key" | gcloud secrets create gemini-key --data-file=-
echo "your-groq-key" | gcloud secrets create groq-key --data-file=-
echo "your-razorpay-key" | gcloud secrets create razorpay-key-id --data-file=-
echo "your-razorpay-secret" | gcloud secrets create razorpay-key-secret --data-file=-
```

### 3. Build and Deploy

```bash
# Deploy all services
gcloud builds submit --config=cloudbuild.yaml
```

### 4. Configure Custom Domain

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `ilai-frontend` service
3. Go to **Domain Mappings** → **Add Mapping**
4. Add `ilai.co.in` and `www.ilai.co.in`
5. Update DNS records as shown

---

## Service URLs

After deployment, your services will be available at:

| Service | URL |
|---------|-----|
| Frontend | `https://ilai-frontend-xxxx.run.app` |
| Auth | `https://muse-auth-service-xxxx.run.app` |
| Notes | `https://muse-notes-service-xxxx.run.app` |
| AI | `https://muse-ai-service-xxxx.run.app` |

---

## Environment Variables

Each service uses these environment variables (configured via secrets):

| Variable | Secret | Services |
|----------|--------|----------|
| `DB_URL` | db-url | All |
| `DB_PASSWORD` | db-password | All |
| `REDIS_HOST` | redis-host | AI |
| `JWT_SECRET` | jwt-secret | Auth |
| `GEMINI_API_KEY` | gemini-key | AI |
| `GROQ_API_KEY` | groq-key | AI |

---

## Cost Estimate

| Resource | Tier | Monthly |
|----------|------|---------|
| Cloud Run (5 services) | 512Mi-1Gi | ~$30-50 |
| Cloud SQL | db-f1-micro | ~$10 |
| Memorystore Redis | 1GB Basic | ~$35 |
| Cloud Build | 120 min free | $0 |
| **Total** | | **~$75-95** |

---

## Monitoring

View logs and metrics:

```bash
# View logs for a service
gcloud run services logs read muse-ai-service --region=asia-south1 --limit=50

# Open Cloud Console
gcloud run services describe muse-ai-service --region=asia-south1 --format="value(status.url)"
```

---

## Rollback

```bash
# List revisions
gcloud run revisions list --service=muse-ai-service --region=asia-south1

# Rollback to previous
gcloud run services update-traffic muse-ai-service \
    --to-revisions=muse-ai-service-00001-abc=100 \
    --region=asia-south1
```

---

## Troubleshooting

### Service not starting
```bash
gcloud run services logs read muse-auth-service --region=asia-south1 --limit=100
```

### Database connection issues
Make sure Cloud SQL connection is configured:
```bash
gcloud sql instances describe ilai-db
```

### Redis connection issues
```bash
gcloud redis instances describe ilai-redis --region=asia-south1
```
