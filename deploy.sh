#!/bin/bash
# ILAI Deployment Script for EC2
# Usage: ./deploy.sh [service_name]
# Example: ./deploy.sh auth  or  ./deploy.sh all

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Pull latest code
pull_code() {
    log_info "Pulling latest code from git..."
    git pull
}

# Build a Java service using Docker
build_service() {
    local service=$1
    local service_dir="services/muse-${service}-service"
    
    if [ ! -d "$service_dir" ]; then
        log_error "Service directory $service_dir not found!"
        return 1
    fi
    
    log_info "Building $service service..."
    
    # Build JAR using Maven Docker image
    docker run --rm \
        -v "$(pwd)/$service_dir:/app" \
        -v maven-cache:/root/.m2 \
        -w /app \
        maven:3.9-eclipse-temurin-21 \
        mvn clean package -DskipTests -q
    
    # Build Docker image
    docker build -t "ilai-001_muse-${service}-service:latest" "./$service_dir"
    
    log_info "$service service built successfully!"
}

# Build Python service (compute-engine / labs)
build_python_service() {
    local service=$1
    local service_dir="services/muse-${service}"
    
    if [ ! -d "$service_dir" ]; then
        log_error "Service directory $service_dir not found!"
        return 1
    fi
    
    log_info "Building $service Python service..."
    
    # Build Docker image directly (no Maven needed)
    docker build -t "ilai-001_muse-${service}:latest" "./$service_dir"
    
    log_info "$service Python service built successfully!"
}

# Deploy a Python service
deploy_python_service() {
    local service=$1
    local port=$2
    local container_name="muse-${service}"
    local image_name="ilai-001_muse-${service}:latest"
    
    log_info "Deploying $service Python service..."
    
    # Stop and remove existing container
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    # Run new container with environment variables
    docker run -d \
        --name "$container_name" \
        --network ilai-001_muse-network \
        --env-file .env \
        -e "PYTHONUNBUFFERED=1" \
        -p "${port}:${port}" \
        --restart always \
        "$image_name"
    
    log_info "$service service deployed on port $port!"
}

# Deploy a service
deploy_service() {
    local service=$1
    local port=$2
    local db_name=$3
    local container_name="muse-${service}-service"
    local image_name="ilai-001_muse-${service}-service:latest"
    
    log_info "Deploying $service service..."
    
    # Stop and remove existing container
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name "$container_name" \
        --network ilai-001_muse-network \
        --env-file .env \
        -e "DB_URL=jdbc:postgresql://muse-postgres:5432/${db_name}" \
        -e "FRONTEND_BASE_URL=${FRONTEND_BASE_URL:-https://ilai.co.in}" \
        -p "${port}:${port}" \
        --restart always \
        "$image_name"
    
    log_info "$service service deployed on port $port!"
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend..."
    
    # Pull from GitHub Container Registry
    docker pull ghcr.io/prasanth-alaparthi/ilai-frontend:latest
    
    docker stop muse-frontend 2>/dev/null || true
    docker rm muse-frontend 2>/dev/null || true
    
    docker run -d \
        --name muse-frontend \
        --network ilai-001_muse-network \
        -p 80:80 \
        --restart always \
        ghcr.io/prasanth-alaparthi/ilai-frontend:latest
    
    log_info "Frontend deployed on port 80!"
}

# Check service health
check_health() {
    local service=$1
    local port=$2
    
    log_info "Checking $service health..."
    sleep 10
    
    if curl -s "http://localhost:$port/actuator/health" | grep -q "UP"; then
        log_info "$service is healthy!"
    else
        log_warn "$service health check failed. Check logs: docker logs muse-${service}-service"
    fi
}

# Main deployment logic
case "${1:-all}" in
    auth)
        pull_code
        build_service "auth"
        deploy_service "auth" 8081 "muse-auth"
        check_health "auth" 8081
        ;;
    notes)
        pull_code
        build_service "notes"
        deploy_service "notes" 8082 "muse_notes"
        check_health "notes" 8082
        ;;
    ai)
        pull_code
        build_service "ai"
        deploy_service "ai" 8088 "muse_ai"
        check_health "ai" 8088
        ;;
    social)
        pull_code
        build_service "social"
        deploy_service "social" 8083 "muse_social"
        check_health "social" 8083
        ;;
    labs)
        pull_code
        build_python_service "compute-engine"
        deploy_python_service "compute-engine" 8000
        log_info "Checking labs health..."
        sleep 5
        if curl -s "http://localhost:8000/health" | grep -q "ok"; then
            log_info "Labs (compute-engine) is healthy!"
        else
            log_warn "Labs health check failed. Check logs: docker logs muse-compute-engine"
        fi
        ;;
    frontend)
        deploy_frontend
        ;;
    all)
        pull_code
        build_service "auth"
        build_service "notes"
        build_service "social"
        build_service "ai"
        build_python_service "compute-engine"
        deploy_service "auth" 8081 "muse-auth"
        deploy_service "notes" 8082 "muse_notes"
        deploy_service "social" 8083 "muse_social"
        deploy_service "ai" 8088 "muse_ai"
        deploy_python_service "compute-engine" 8000
        deploy_frontend
        check_health "auth" 8081
        check_health "notes" 8082
        check_health "social" 8083
        check_health "ai" 8088
        ;;
    status)
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    logs)
        docker logs -f "muse-${2:-auth}-service"
        ;;
    *)
        echo "Usage: $0 {auth|notes|social|ai|labs|frontend|all|status|logs [service]}"
        exit 1
        ;;
esac

log_info "Deployment complete!"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
