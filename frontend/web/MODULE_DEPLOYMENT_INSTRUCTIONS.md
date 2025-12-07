# Deployment Instructions for Modules

This guide explains how to deploy your **Auth** and **Notes** modules using the files I just created.

## 1. Frontend Deployment (Firebase)

The `firebase.json` file is now configured to:
1.  Serve your React app from the `dist` folder.
2.  Rewrite API calls (`/api/auth/...`, `/api/notes/...`) to your Cloud Run services.

**Steps:**
1.  Build the frontend:
    ```bash
    npm run build
    ```
2.  Deploy to Firebase:
    ```bash
    firebase deploy
    ```

---

## 2. Backend Deployment (Cloud Run)

I have created `Dockerfile.auth` and `Dockerfile.notes` in your frontend folder. You need to move these to your backend folders or point to them during build.

### A. Deploy Auth Service

1.  Navigate to your **Auth Service** source code folder.
2.  Copy `Dockerfile.auth` there and rename it to `Dockerfile`.
3.  Build the JAR file:
    ```bash
    ./mvnw clean package -DskipTests
    ```
4.  Build and Push the Docker image:
    ```bash
    gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/muse-repo/muse-auth-service .
    ```
5.  Deploy to Cloud Run:
    ```bash
    gcloud run deploy muse-auth-service \
      --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/muse-repo/muse-auth-service \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars SPRING_PROFILES_ACTIVE=prod
    ```

### B. Deploy Notes Service

1.  Navigate to your **Notes Service** source code folder.
2.  Copy `Dockerfile.notes` there and rename it to `Dockerfile`.
3.  Build the JAR file:
    ```bash
    ./mvnw clean package -DskipTests
    ```
4.  Build and Push the Docker image:
    ```bash
    gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/muse-repo/muse-notes-service .
    ```
5.  Deploy to Cloud Run:
    ```bash
    gcloud run deploy muse-notes-service \
      --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/muse-repo/muse-notes-service \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars SPRING_PROFILES_ACTIVE=prod
    ```

---

## 3. Verify Connection

Once deployed:
1.  Go to `https://muse.com` (your Firebase URL).
2.  Try to Login.
    *   The request goes to `https://muse.com/api/auth/login`.
    *   Firebase rewrites this to `muse-auth-service` on Cloud Run.
    *   Success!
3.  Try to Create a Note.
    *   The request goes to `https://muse.com/api/notes`.
    *   Firebase rewrites this to `muse-notes-service` on Cloud Run.
    *   Success!
