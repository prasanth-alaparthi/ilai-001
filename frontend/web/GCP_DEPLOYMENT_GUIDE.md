# GCP Deployment Guide for Muse

This guide outlines the steps to deploy your Muse web application (React Frontend + Spring Boot Backend) to Google Cloud Platform (GCP) with the secure domain `muse.com`.

## Architecture Overview

*   **Frontend**: Deployed to **Firebase Hosting** (Recommended for SPAs) or **Google Cloud Storage** with Cloud CDN. This handles the static assets, SSL, and global content delivery.
*   **Backend**: Containerized and deployed to **Google Cloud Run**. This provides a serverless environment that scales automatically.
*   **Database**: **Google Cloud SQL** for PostgreSQL.
*   **Domain**: `muse.com` managed via Cloud DNS or your domain registrar, connected to Firebase Hosting (frontend) and Cloud Run (backend via Custom Domain mapping or Load Balancer).

---

## Prerequisites

1.  **GCP Account**: A billing-enabled Google Cloud Platform project.
2.  **Domain Name**: Ownership of `muse.com`.
3.  **Google Cloud SDK**: Installed and authenticated (`gcloud auth login`).
4.  **Docker**: Installed for building backend images.

---

## Part 1: Database Setup (Cloud SQL)

1.  **Create Instance**:
    *   Go to Cloud SQL in GCP Console.
    *   Create a **PostgreSQL** instance.
    *   Set a secure password for the `postgres` user.
2.  **Create Database**:
    *   Create a database named `muse_notes` (or whatever your app expects).
3.  **Connection**:
    *   Note the **Connection Name** (e.g., `project-id:region:instance-name`).
    *   Enable **Public IP** (for easiest setup, secure with authorized networks) or **Private IP** (requires VPC connector for Cloud Run).

---

## Part 2: Backend Deployment (Cloud Run)

### 1. Containerize the Backend
Ensure your Spring Boot backend has a `Dockerfile`. If not, create one in the backend root:

```dockerfile
FROM eclipse-temurin:17-jdk-alpine
VOLUME /tmp
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

### 2. Build and Push Image
Run these commands from your backend directory:

```bash
# Enable Artifact Registry
gcloud services enable artifactregistry.googleapis.com

# Create a repository
gcloud artifacts repositories create muse-repo --repository-format=docker --location=us-central1

# Build the image (replace PROJECT_ID)
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/muse-repo/muse-backend .
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy muse-backend \
  --image us-central1-docker.pkg.dev/PROJECT_ID/muse-repo/muse-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME \
  --set-env-vars SPRING_DATASOURCE_URL=jdbc:postgresql:///<DB_NAME>?cloudSqlInstance=PROJECT_ID:REGION:INSTANCE_NAME&socketFactory=com.google.cloud.sql.postgres.SocketFactory \
  --set-env-vars SPRING_DATASOURCE_USERNAME=postgres \
  --set-env-vars SPRING_DATASOURCE_PASSWORD=YOUR_DB_PASSWORD \
  --set-env-vars APP_JWT_ACCESS_SECRET=YOUR_SECURE_SECRET
```

*   **Note**: Copy the URL provided after deployment (e.g., `https://muse-backend-xyz.a.run.app`). This is your `API_BASE_URL`.

---

## Part 3: Frontend Deployment (Firebase Hosting)

Firebase Hosting is the easiest way to host a React app with free SSL and custom domains.

### 1. Initialize Firebase
In your `frontend/web` directory:

```bash
npm install -g firebase-tools
firebase login
firebase init
```

*   **Hosting**: Select "Configure files for Firebase Hosting".
*   **Project**: Select your GCP project.
*   **Public directory**: Type `dist` (since Vite builds to `dist`).
*   **Single-page app**: Yes.
*   **Automatic builds**: Optional.

### 2. Configure Production Environment
Create a `.env.production` file in `frontend/web`:

```env
VITE_API_BASE_URL=https://muse-backend-xyz.a.run.app/api
```

*   *Update your `vite.config.js` or `apiClient.js` to use this variable in production.*

### 3. Build and Deploy

```bash
npm run build
firebase deploy
```

---

## Part 4: Domain Configuration (muse.com)

### 1. Frontend Domain
*   Go to the **Firebase Console** > Hosting.
*   Click **Add Custom Domain**.
*   Enter `muse.com` (and `www.muse.com`).
*   Follow the instructions to add the **TXT** records to your DNS provider (GoDaddy, Namecheap, Cloud DNS, etc.) to verify ownership.
*   Add the **A** records provided by Firebase to point your domain to their servers.
*   **SSL**: Firebase automatically provisions an SSL certificate (this may take up to 24 hours).

### 2. Backend Domain (Optional but Recommended)
If you want your API to be `api.muse.com`:
*   Go to **Cloud Run** > Manage Custom Domains.
*   Map `muse-backend` service to `api.muse.com`.
*   Update DNS records as instructed.
*   Update `VITE_API_BASE_URL` in your frontend to `https://api.muse.com/api`.

---

## Summary Checklist

- [ ] Database created and accessible.
- [ ] Backend containerized and running on Cloud Run.
- [ ] Frontend built with production API URL.
- [ ] Frontend deployed to Firebase Hosting.
- [ ] DNS records updated for `muse.com`.
- [ ] SSL certificates active.
