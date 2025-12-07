# Deployment Instructions

## Prerequisites
1.  **Docker Desktop** (or Docker Engine + Docker Compose) installed.
2.  **Environment Variables**: You MUST create a `.env` file in the root directory.

## Step 1: Configure Environment
Copy `.env.example` to `.env` and fill in the values.
```bash
cp .env.example .env
# Edit .env with your real secrets and API keys
```

## Step 2: Build and Run
Run the following command in the root directory:
```bash
docker-compose up --build -d
```
*   `--build`: Forces a rebuild of the images.
*   `-d`: Runs in detached mode (background).

## Step 3: Verify
*   **Frontend**: Open `http://localhost` in your browser.
*   **Logs**: Check logs with `docker-compose logs -f`.

## Step 4: Production Deployment (Cloud)
For a real production deployment (AWS, GCP, DigitalOcean):
1.  **Database**: Use a managed database service (RDS, Cloud SQL) instead of the local `postgres` container. Update `DB_URL` in `.env`.
2.  **Secrets**: Use a secret manager or inject environment variables securely in your CI/CD pipeline.
3.  **Orchestration**: Use Kubernetes (EKS, GKE) or a container service (ECS, Cloud Run) instead of `docker-compose` for better scalability (100k users).
    *   For 100k users, you will need multiple instances (replicas) of `muse-notes-service` and `muse-auth-service`.
    *   Configure a Load Balancer in front of them.
