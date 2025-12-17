# ILAI - Google Cloud Platform Setup Script
# Run this script to set up GCP infrastructure for Cloud Run deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [string]$Region = "asia-south1",
    
    [string]$DbPassword
)

Write-Host "`n=== ILAI GCP Setup ===" -ForegroundColor Magenta

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI is not installed. Install from: https://cloud.google.com/sdk/install"
    exit 1
}

# Set project
Write-Host "`n[1/8] Setting project: $ProjectId" -ForegroundColor Cyan
gcloud config set project $ProjectId

# Enable required APIs
Write-Host "`n[2/8] Enabling APIs..." -ForegroundColor Cyan
$apis = @(
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com"
)
foreach ($api in $apis) {
    Write-Host "  Enabling $api..."
    gcloud services enable $api --quiet
}

# Create Cloud SQL instance
Write-Host "`n[3/8] Creating Cloud SQL (PostgreSQL)..." -ForegroundColor Cyan
$dbInstance = "ilai-db"
gcloud sql instances create $dbInstance `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=$Region `
    --root-password=$DbPassword `
    --storage-size=10GB `
    --storage-auto-increase `
    --quiet

# Create databases
Write-Host "`n[4/8] Creating databases..." -ForegroundColor Cyan
$databases = @("muse_auth", "muse_notes", "muse_ai", "muse_academic", "muse_social")
foreach ($db in $databases) {
    Write-Host "  Creating database: $db"
    gcloud sql databases create $db --instance=$dbInstance --quiet
}

# Create Redis instance (Memorystore)
Write-Host "`n[5/8] Creating Redis (Memorystore)..." -ForegroundColor Cyan
gcloud redis instances create ilai-redis `
    --size=1 `
    --region=$Region `
    --tier=basic `
    --quiet

# Get connection info
$dbConnectionName = gcloud sql instances describe $dbInstance --format="value(connectionName)"
$redisHost = gcloud redis instances describe ilai-redis --region=$Region --format="value(host)"

# Create secrets
Write-Host "`n[6/8] Creating secrets..." -ForegroundColor Cyan

# Database URL
$dbUrl = "jdbc:postgresql:///$muse_auth?cloudSqlInstance=$dbConnectionName&socketFactory=com.google.cloud.sql.postgres.SocketFactory&user=postgres&password=$DbPassword"
echo $dbUrl | gcloud secrets create db-url --data-file=- --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    echo $dbUrl | gcloud secrets versions add db-url --data-file=-
}

# DB Password
echo $DbPassword | gcloud secrets create db-password --data-file=- --quiet 2>$null

# Redis Host
echo $redisHost | gcloud secrets create redis-host --data-file=- --quiet 2>$null

Write-Host "`n[7/8] You need to add these secrets manually:" -ForegroundColor Yellow
Write-Host "  - jwt-secret: Your JWT signing key"
Write-Host "  - gemini-key: Your Gemini API key"
Write-Host "  - groq-key: Your Groq API key"
Write-Host "  - razorpay-key-id: Your Razorpay key ID"
Write-Host "  - razorpay-key-secret: Your Razorpay secret"

Write-Host "`nExample:"
Write-Host '  echo "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-'

# Grant Cloud Run access to secrets
Write-Host "`n[8/8] Granting permissions..." -ForegroundColor Cyan
$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$serviceAccount = "$projectNumber-compute@developer.gserviceaccount.com"

$secrets = @("db-url", "db-password", "redis-host", "jwt-secret", "gemini-key", "groq-key")
foreach ($secret in $secrets) {
    gcloud secrets add-iam-policy-binding $secret `
        --member="serviceAccount:$serviceAccount" `
        --role="roles/secretmanager.secretAccessor" `
        --quiet 2>$null
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nConnection Info:" -ForegroundColor Yellow
Write-Host "  Cloud SQL: $dbConnectionName"
Write-Host "  Redis:     $redisHost"
Write-Host "  Region:    $Region"

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Add remaining secrets (jwt-secret, gemini-key, groq-key)"
Write-Host "  2. Run: gcloud builds submit --config=cloudbuild.yaml"
Write-Host "  3. Map custom domain in Cloud Run console"
