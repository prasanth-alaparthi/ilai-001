#!/bin/bash

# verify_deployment.sh - Automated checks for Muse deployment

echo "========================================================"
echo "   Muse Platform - Deployment Verification Script"
echo "========================================================"

# 1. Check Prerequisites
echo "[1/5] Checking Prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Error: 'docker' command not found. Please install Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    # Try 'docker compose' plugin style
    if ! docker compose version &> /dev/null; then
        echo "❌ Error: 'docker-compose' not found. Please install Docker Compose."
        exit 1
    else
        DOCKER_COMPOSE="docker compose"
    fi
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "✅ Docker is available."
echo "✅ Using command: $DOCKER_COMPOSE"

# 2. Build Services
echo ""
echo "[2/5] Building Microservices..."
echo "This may take a few minutes..."
$DOCKER_COMPOSE build

if [ $? -ne 0 ]; then
    echo "❌ Build Failed! Please see the errors above."
    exit 1
fi
echo "✅ Build Successful."

# 3. Start Services
echo ""
echo "[3/5] Starting Services..."
$DOCKER_COMPOSE up -d

echo "Waiting 30 seconds for services to initialize..."
sleep 30

# 4. Check Container Status
echo ""
echo "[4/5] Checking Container Health..."

SERVICES=("muse-auth-service" "muse-notes-service" "muse-feed-service" "muse-classroom-service" "muse-frontend")
PORTS=("8081" "8082" "8083" "8090" "80")
HAS_ERROR=0

# Function to check health
check_health() {
    local service=$1
    local port=$2

    # Check if container is running
    local state=$($DOCKER_COMPOSE ps -q $service | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null)

    if [ "$state" == "running" ]; then
        echo "✅ $service is RUNNING."
        # Optional: Try to curl (might fail if inside docker network, but trying localhost)
        # curl -s http://localhost:$port/actuator/health > /dev/null
    else
        echo "❌ $service is NOT running (State: $state)."
        HAS_ERROR=1

        echo "--- Logs for $service ---"
        $DOCKER_COMPOSE logs --tail=20 $service
        echo "-------------------------"
    fi
}

for i in "${!SERVICES[@]}"; do
    check_health "${SERVICES[$i]}" "${PORTS[$i]}"
done

# 5. Summary
echo ""
echo "[5/5] Verification Complete"
if [ $HAS_ERROR -eq 1 ]; then
    echo "❌ Some services failed to start."
    echo "PLEASE COPY THE LOGS ABOVE AND SHARE THEM WITH ME."
    exit 1
else
    echo "✅ All core services appear to be running!"
    echo "You can access the app at http://localhost:80"
    exit 0
fi
