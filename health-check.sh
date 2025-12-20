#!/bin/bash
# ILAI AI Services Health Check Script
# Run on EC2: bash health-check.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================================="
echo "ILAI AI Microservices Health Check"
echo "=================================================="
echo ""

# Service endpoints to check
declare -A SERVICES=(
    ["auth"]="http://localhost:8081/actuator/health"
    ["notes"]="http://localhost:8082/actuator/health"
    ["ai"]="http://localhost:8088/actuator/health"
    ["social"]="http://localhost:8083/actuator/health"
    ["compute"]="http://localhost:8000/health"
)

# Lab API endpoints
declare -A LABS=(
    ["physics"]="http://localhost:8000/api/physics/solve"
    ["chemistry"]="http://localhost:8000/api/chemistry/analyze"
    ["biology"]="http://localhost:8000/api/biology/transcribe"
    ["economics"]="http://localhost:8000/api/economics/equilibrium"
    ["literature"]="http://localhost:8000/api/literature/scansion"
    ["language"]="http://localhost:8000/api/language/parse"
    ["fashion"]="http://localhost:8000/api/fashion/draft"
    ["culture"]="http://localhost:8000/api/culture/network"
)

FAILED=0

echo "[SERVICE HEALTH CHECKS]"
echo "-----------------------"
for service in "${!SERVICES[@]}"; do
    url="${SERVICES[$service]}"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ $service${NC}: $url -> $response OK"
    else
        echo -e "${RED}✗ $service${NC}: $url -> $response FAILED"
        FAILED=$((FAILED+1))
    fi
done

echo ""
echo "[LAB ENDPOINT TESTS]"
echo "--------------------"

# Test Physics (POST)
echo -n "Testing physics... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"equation":"x**2-4","equation_type":"algebraic","variable":"x"}' \
    http://localhost:8000/api/physics/solve 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Chemistry (POST)
echo -n "Testing chemistry... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"smiles":"CCO"}' \
    http://localhost:8000/api/chemistry/analyze 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Biology (POST)
echo -n "Testing biology... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"dna_sequence":"ATGCGATCG"}' \
    http://localhost:8000/api/biology/transcribe 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Economics (POST)
echo -n "Testing economics... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"supply_intercept":10,"supply_slope":2,"demand_intercept":100,"demand_slope":3}' \
    http://localhost:8000/api/economics/equilibrium 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Literature (POST)
echo -n "Testing literature... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"text":"Shall I compare thee to a summers day"}' \
    http://localhost:8000/api/literature/scansion 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Language (POST)
echo -n "Testing language... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"sentence":"The quick brown fox jumps over the lazy dog"}' \
    http://localhost:8000/api/language/parse 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Fashion (POST)
echo -n "Testing fashion... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"bust":90,"waist":70,"hips":95}' \
    http://localhost:8000/api/fashion/draft 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Test Culture (POST)
echo -n "Testing culture... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"edges":[["Alice","Bob"],["Bob","Charlie"]]}' \
    http://localhost:8000/api/culture/network 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

echo ""
echo "=================================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All services healthy!${NC}"
    exit 0
else
    echo -e "${RED}$FAILED service(s) failed!${NC}"
    echo ""
    echo "Check logs with: docker logs <container-name>"
    exit 1
fi
