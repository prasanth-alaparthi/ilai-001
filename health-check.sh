#!/bin/bash
# =============================================
# ILAI Complete AI Services Health Check
# =============================================
# Run on EC2: bash health-check.sh
# Tests all microservices and lab API endpoints

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

FAILED=0
PASSED=0

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   ILAI AI Microservices Health Check${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Check if running with sudo (needed for docker commands)
if [ "$EUID" -ne 0 ]; then 
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

# ==========================================
# PART 1: Docker Container Status
# ==========================================
echo -e "${YELLOW}[1/4] Docker Container Status${NC}"
echo "-----------------------------------------------"
$DOCKER_CMD ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20
echo ""

# ==========================================
# PART 2: Spring Boot Health Endpoints
# ==========================================
echo -e "${YELLOW}[2/4] Spring Boot Microservices${NC}"
echo "-----------------------------------------------"

declare -A SPRING_SERVICES=(
    ["auth"]="http://localhost:8081/actuator/health"
    ["notes"]="http://localhost:8082/actuator/health"
    ["social"]="http://localhost:8083/actuator/health"
    ["ai"]="http://localhost:8088/actuator/health"
)

for service in "${!SPRING_SERVICES[@]}"; do
    url="${SPRING_SERVICES[$service]}"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ $service${NC} -> $response OK"
        PASSED=$((PASSED+1))
    else
        echo -e "${RED}✗ $service${NC} -> $response FAILED"
        FAILED=$((FAILED+1))
        echo "  Check logs: $DOCKER_CMD logs muse-${service}-service"
    fi
done
echo ""

# ==========================================
# PART 3: Python Compute Engine (Labs)
# ==========================================
echo -e "${YELLOW}[3/4] Compute Engine (Labs Backend)${NC}"
echo "-----------------------------------------------"

# Health check
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/health" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓ compute-engine health${NC} -> $response OK"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗ compute-engine health${NC} -> $response FAILED"
    FAILED=$((FAILED+1))
fi

# Physics Lab (SymPy)
echo -n "Testing physics/solve... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"equation":"x**2-4","equation_type":"algebraic","variable":"x"}' \
    "http://localhost:8000/api/physics/solve" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Chemistry Lab (RDKit)
echo -n "Testing chemistry/analyze... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"smiles":"CCO"}' \
    "http://localhost:8000/api/chemistry/analyze" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response (may need RDKit)"
    FAILED=$((FAILED+1))
fi

# Biology Lab (BioPython)
echo -n "Testing biology/transcribe... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"dna_sequence":"ATGCGATCG"}' \
    "http://localhost:8000/api/biology/transcribe" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Economics Lab (SciPy)
echo -n "Testing economics/equilibrium... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"supply_intercept":10,"supply_slope":2,"demand_intercept":100,"demand_slope":3}' \
    "http://localhost:8000/api/economics/equilibrium" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Literature Lab (NLTK)
echo -n "Testing literature/scansion... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"text":"Shall I compare thee to a summers day"}' \
    "http://localhost:8000/api/literature/scansion" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Language Lab (SpaCy)
echo -n "Testing language/parse... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"sentence":"The quick brown fox jumps"}' \
    "http://localhost:8000/api/language/parse" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Fashion Lab
echo -n "Testing fashion/draft... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"bust":90,"waist":70,"hips":95}' \
    "http://localhost:8000/api/fashion/draft" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi

# Culture Lab (NetworkX)
echo -n "Testing culture/network... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"edges":[["A","B"],["B","C"]]}' \
    "http://localhost:8000/api/culture/network" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} $response"
    PASSED=$((PASSED+1))
else
    echo -e "${RED}✗${NC} $response"
    FAILED=$((FAILED+1))
fi
echo ""

# ==========================================
# PART 4: Frontend Nginx Proxy Routes
# ==========================================
echo -e "${YELLOW}[4/4] Nginx Proxy Routes (from frontend)${NC}"
echo "-----------------------------------------------"

# Test if Nginx is proxying correctly
PROXY_ROUTES=(
    "/api/auth/health:Auth Proxy"
    "/api/notes:Notes Proxy"
    "/api/physics/solve:Physics Proxy"
)

for route_info in "${PROXY_ROUTES[@]}"; do
    IFS=':' read -r route name <<< "$route_info"
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:80$route" 2>/dev/null || echo "000")
    
    # 401/403 means proxy works but needs auth, 200 is good, 502/503/504 means proxy failed
    if [[ "$response" == "200" || "$response" == "401" || "$response" == "403" || "$response" == "405" ]]; then
        echo -e "${GREEN}✓ $name${NC} -> $response (proxy working)"
        PASSED=$((PASSED+1))
    else
        echo -e "${RED}✗ $name${NC} -> $response (proxy may be broken)"
        FAILED=$((FAILED+1))
    fi
done
echo ""

# ==========================================
# Summary
# ==========================================
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   SUMMARY${NC}"
echo -e "${CYAN}============================================${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All services healthy! AI features should work.${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED check(s) failed.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check container logs: sudo docker logs <container-name>"
    echo "  2. Restart services: sudo docker-compose -f docker-compose.prod.yml restart"
    echo "  3. Check .env file has correct values"
    exit 1
fi
