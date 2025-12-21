# Rate Limiting & API Protection - Implementation Plan

## Goal
Implement production-grade rate limiting, internal API protection, and a Redis-based "cooling-off" jail system to prevent API cost spikes.

---

## 1. Nginx Rate Limiting

#### [MODIFY] [nginx.conf](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/frontend/web/nginx.conf)

Add rate limit zones at the top of the config:
```nginx
# Rate limiting zones (10r/m = 1 request every 6 seconds)
limit_req_zone $binary_remote_addr zone=solver_limit:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=rag_limit:10m rate=10r/m;
```

Apply to `/api/solver` and `/api/rag` endpoints:
```nginx
limit_req zone=solver_limit burst=5 nodelay;
limit_req zone=rag_limit burst=5 nodelay;
```

> [!IMPORTANT]
> The `burst=5` allows 5 quick requests before throttling kicks in.

---

## 2. Internal API Key Protection

#### [MODIFY] [main.py (compute-engine)](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-compute-engine/main.py)

Add middleware to verify `X-Internal-Secret` header:
```python
from fastapi import Header, HTTPException

INTERNAL_SECRET = os.getenv("INTERNAL_API_SECRET", "ilai-internal-2024")

async def verify_internal_secret(x_internal_secret: str = Header(None)):
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Invalid internal secret")
```

#### [MODIFY] [nginx.conf](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/frontend/web/nginx.conf)

Add header to proxy passes:
```nginx
proxy_set_header X-Internal-Secret "ilai-internal-2024";
```

---

## 3. Redis Cooling-Off Jail System

#### [NEW] [rate_limiter.py](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-compute-engine/rate_limiter.py)

Redis-based violation tracking:
```python
class RateLimitJail:
    async def record_violation(user_id: str) -> dict
    async def check_jailed(user_id: str) -> dict | None
    async def get_jail_duration(offense_count: int) -> int
```

Jail duration escalation:
- 1st offense: 1 hour
- 2nd offense: 24 hours
- 3rd+ offense: 7 days

#### [MODIFY] [main.py](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-compute-engine/main.py)

Add middleware to check jail status before processing:
```python
@app.middleware("http")
async def jail_check_middleware(request, call_next):
    # Check if user is jailed
    # Return 403 with retry_after if jailed
```

---

## 4. Frontend Cooling-Off Modal

#### [NEW] [CoolingOffModal.jsx](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/frontend/web/src/components/CoolingOffModal.jsx)

- Display countdown timer
- Show reason for suspension
- Explain resource protection

#### [MODIFY] [ResearchLab.jsx](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/frontend/web/src/pages/Labs/ResearchLab.jsx)

Handle 429/403 responses:
```jsx
if (response.status === 429 || response.data?.jail) {
    setShowCoolingModal(true);
    setJailInfo(response.data);
}
```

---

## Verification Plan

### Test Script
```bash
# Fire 20 requests rapidly - should see 429 after ~5
for i in {1..20}; do
  curl -X POST http://localhost/api/solver/solve \
    -H "Content-Type: application/json" \
    -d '{"expression": "1+1"}' &
done
wait
```

### Expected Behavior
1. First 5 requests: Succeed (burst allowance)
2. Requests 6-10: 429 Too Many Requests
3. After 5 violations: User jailed for 1 hour
