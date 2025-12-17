#!/bin/bash
# ILAI Production Deployment Script
# Run this after VM setup to deploy all services

set -e

echo "=========================================="
echo "  ILAI Production Deployment"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.prod to .env and fill in your values"
    exit 1
fi

# Load environment variables
source .env

# Build frontend
echo "[1/5] Building frontend..."
cd frontend/web
npm install
npm run build
cd ../..

# Build backend services
echo "[2/5] Building backend services..."
./build-all.sh package

# Build Docker images
echo "[3/5] Building Docker images..."
docker compose -f docker-compose.prod.yml build

# Stop existing containers
echo "[4/5] Stopping existing containers..."
docker compose -f docker-compose.prod.yml down || true

# Start services
echo "[5/5] Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for health checks
echo ""
echo "Waiting for services to be healthy..."
sleep 30

# Check service status
echo ""
echo "=========================================="
echo "  Deployment Status"
echo "=========================================="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "  Service URLs"
echo "=========================================="
echo "Frontend:  http://localhost"
echo "Auth:      http://localhost:8081/actuator/health"
echo "Notes:     http://localhost:8082/actuator/health"
echo "AI:        http://localhost:8088/actuator/health"
echo "Academic:  http://localhost:8090/actuator/health"
echo "Social:    http://localhost:8086/actuator/health"
echo ""
echo "View logs: docker compose -f docker-compose.prod.yml logs -f"
echo ""
