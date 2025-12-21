# Production Finalization: ILAI 7 Core Services

This plan outlines the implementation of production-ready logic for all 7 core services, removing placeholders and implementing functional, error-handled code.

---

## User Review Required

> [!IMPORTANT]
> **Breaking Changes & Design Decisions**
> - Service-to-Service authentication will require internal API endpoints to validate caller IP/token
> - Circuit breakers may cause degr degradation in functionality when services are down (by design)
> - Usage metering will track every AI/Compute call for billing purposes
> - Redis caching is critical for tier checking - Redis downtime will block feature access

> [!WARNING]
> **Performance Impact**
> - Every AI/Compute request will emit a billing event (adds ~5ms latency)
> - FeatureFlagInterceptor adds Redis lookup to every protected endpoint (~2-3ms)
> - Circuit breakers add overhead but prevent cascade failures

---

## Phase 1: Living Sync & Connectivity

### 1.1 NoteShareOrchestrator Enhancement

#### [MODIFY] [BountySolveOrchestrator.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-social-service/src/main/java/com/muse/social/application/orchestrator/BountySolveOrchestrator.java)

**Current State**: Basic orchestration without tier verification or error handling

**Changes**:
```java
// Add tier verification via Redis
private final RedisTemplate<String, String> redisTemplate;

public void orchestrateSolve(...) {
    // 1. Verify solver tier
    String solverTier = getTierFromRedis(solverId);
    if ("free".equals(solverTier)) {
        throw new InsufficientTierException("Bounty solving requires General tier or higher");
    }
    
    // 2. Award points with rollback capability
    try {
        reputationService.addPoints(...);
    } catch (Exception e) {
        log.error("Failed to award points, rolling back");
        throw new OrchestrationException("Point award failed", e);
    }
    
    // 3. Inject note with retry logic
    Mono<Void> injection = notesClient.injectSharedNote(...)
        .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)))
        .doOnError(e -> {
            // Compensate: Deduct awarded points
            reputationService.addPoints(solverId, -rewardPoints, "Rollback", "system", null);
        });
        
    injection.block(Duration.ofSeconds(10));
}

private String getTierFromRedis(Long userId) {
    String tier = redisTemplate.opsForValue().get("user:" + userId + ":tier");
    return tier != null ? tier : "free";
}
```

---

### 1.2 Service-to-Service Authentication

#### [NEW] [InternalServiceInterceptor.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-notes-service/src/main/java/com/muse/notes/security/InternalServiceInterceptor.java)

```java
@Component
public class InternalServiceInterceptor implements HandlerInterceptor {
    
    @Value("${internal.service.ips:127.0.0.1,10.0.0.0/8}")
    private String allowedIps;
    
    @Value("${internal.service.token}")
    private String internalToken;
    
    @Override
    public boolean preHandle(HttpServletRequest request, ...) {
        String requestIp = getClientIp(request);
        String token = request.getHeader("X-Internal-Token");
        
        if (!isIpAllowed(requestIp) || !internalToken.equals(token)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\":\"Unauthorized service call\"}");
            return false;
        }
        return true;
    }
}
```

#### [MODIFY] [WebSecurityConfig.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-notes-service/src/main/java/com/muse/notes/config/WebSecurityConfig.java)

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/internal/**").hasRole("INTERNAL_SERVICE")
        .anyRequest().authenticated()
    );
}
```

---

## Phase 2: Scientific Brain

### 2.1 Compute Engine - LaTeX/SymPy Execution

#### [MODIFY] [main.py](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-compute-engine/main.py)

**Add LaTeX parsing and execution**:
```python
from sympy.parsing.latex import parse_latex
from sympy import *
import numpy as np

@app.post("/api/solver/latex")
async def solve_latex(request: LatexRequest):
    try:
        # Parse LaTeX to SymPy expression
        expr = parse_latex(request.latex_expression)
        
        # Execute based on operation
        if request.operation == "solve":
            result = solve(expr, Symbol('x'))
        elif request.operation == "evaluate":
            result = expr.evalf()
        elif request.operation == "derivative":
            result = diff(expr, Symbol('x'))
            
        # Calculate error margin (numerical stability)
        error_margin = calculate_error_margin(result)
        
        return {
            "success": True,
            "result": str(result),
            "result_latex": latex(result),
            "error_margin": error_margin,
            "execution_time_ms": ...
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "ERR_MATH_CONVERGENCE"
        }
        
def calculate_error_margin(result):
    # For numerical results, check floating point precision
    if isinstance(result, Float):
        return abs(result * 1e-15)  # Machine epsilon
    return 0.0
```

---

### 2.2 Agentic RAG - LangGraph Research Loop

#### [NEW] [research_agent.py](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-agentic-rag/research_agent.py)

```python
from langgraph.graph import StateGraph, END
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_openai import ChatOpenAI

class ResearchState(TypedDict):
    question: str
    notes_context: str
    search_results: List[dict]
    synthesis: str
    citations: List[str]

def create_research_graph():
    workflow = StateGraph(ResearchState)
    
    # Node 1: Fetch notes context
    async def fetch_notes_context(state: ResearchState):
        user_id = state.get("user_id")
        context = await notes_client.get_relevant_notes(
            user_id, 
            state["question"],
            limit=5
        )
        return {"notes_context": context}
    
    # Node 2: Academic search via Tavily
    async def search_academic(state: ResearchState):
        tavily = TavilySearchResults(max_results=10)
        results = await tavily.ainvoke({
            "query": state["question"] + " site:arxiv.org OR site:scholar.google.com"
        })
        return {"search_results": results}
    
    # Node 3: Synthesize with citations
    async def synthesize_answer(state: ResearchState):
        llm = ChatOpenAI(model="gpt-4-turbo")
        prompt = f"""
        Question: {state['question']}
        User's Notes: {state['notes_context']}
        Academic Sources: {state['search_results']}
        
        Provide a comprehensive answer with inline citations [1], [2], etc.
        """
        response = await llm.ainvoke(prompt)
        
        citations = extract_citations(state["search_results"])
        return {"synthesis": response.content, "citations": citations}
    
    workflow.add_node("fetch_context", fetch_notes_context)
    workflow.add_node("search", search_academic)
    workflow.add_node("synthesize", synthesize_answer)
    
    workflow.add_edge("fetch_context", "search")
    workflow.add_edge("search", "synthesize")
    workflow.add_edge("synthesize", END)
    
    return workflow.compile()

# FastAPI endpoint
@app.post("/api/research")
async def research(request: ResearchRequest):
    graph = create_research_graph()
    result = await graph.ainvoke({
        "question": request.question,
        "user_id": request.user_id
    })
    return result
```

---

### 2.3 AI Service - ReAct Agent Decision Logic

#### [NEW] [ReActAgent.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-ai-service/src/main/java/com/muse/ai/agent/ReActAgent.java)

```java
@Service
public class ReActAgent {
    
    private final WebClient computeClient;
    private final WebClient ragClient;
    private final GroqClient groqClient;
    
    public Mono<AgentResponse> decide(String userQuery, Long userId) {
        // Step 1: Classify intent
        String intent = classifyIntent(userQuery);
        
        return switch (intent) {
            case "MATH_SOLVE" -> callComputeEngine(userQuery);
            case "RESEARCH" -> callRAG(userQuery, userId);
            case "FLASHCARD" -> generateFlashcards(userQuery);
            default -> Mono.just(new AgentResponse("I didn't understand that"));
        };
    }
    
    private String classifyIntent(String query) {
        // Use regex + keywords for fast classification
        if (query.matches(".*\\b(solve|calculate|integrate|derivative)\\b.*")) {
            return "MATH_SOLVE";
        }
        if (query.matches(".*\\b(research|explain|teach me|what is)\\b.*")) {
            return "RESEARCH";
        }
        if (query.contains("flashcard") || query.contains("quiz")) {
            return "FLASHCARD";
        }
        return "UNKNOWN";
    }
    
    private Mono<AgentResponse> callComputeEngine(String query) {
        return computeClient.post()
            .uri("/api/solver/solve")
            .bodyValue(Map.of("expression", query))
            .retrieve()
            .bodyToMono(ComputeResponse.class)
            .map(r -> new AgentResponse(r.getResult(), "math"));
    }
}
```

---

## Phase 3: Financial Guardrail

### 3.1 FeatureFlagInterceptor

#### [NEW] [FeatureFlagInterceptor.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-labs-service/src/main/java/com/muse/labs/security/FeatureFlagInterceptor.java)

```java
@Component
public class FeatureFlagInterceptor implements HandlerInterceptor {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    @Override
    public boolean preHandle(HttpServletRequest request, ...) {
        RequireTier annotation = getAnnotation(request);
        if (annotation == null) return true;
        
        Long userId = extractUserId(request);
        String userTier = getTier(userId);
        
        if (!hasAccess(userTier, annotation.value())) {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                "{\"error\":\"Feature requires %s tier\",\"upgrade_url\":\"/pricing\"}",
                annotation.value()
            ));
            return false;
        }
        return true;
    }
    
    private boolean hasAccess(String userTier, String requiredTier) {
        Map<String, Integer> tierLevels = Map.of(
            "free", 0, "general", 1, "pro", 2, "phd", 3
        );
        return tierLevels.getOrDefault(userTier, 0) >= 
               tierLevels.getOrDefault(requiredTier, 99);
    }
}

// Usage
@RestController
public class LabsController {
    @RequireTier("pro")
    @GetMapping("/api/labs/dl-kernel")
    public Mono<KernelResponse> runDLKernel() { ... }
}
```

---

### 3.2 Usage Metering

#### [MODIFY] [AIService.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-ai-service/src/main/java/com/muse/ai/service/AIService.java)

```java
private final ApplicationEventPublisher eventPublisher;

public Mono<AIResponse> generate(String prompt, Long userId) {
    return geminiClient.generate(prompt)
        .doOnSuccess(response -> {
            // Emit usage event for billing
            UsageEvent event = UsageEvent.builder()
                .userId(userId)
                .serviceType("ai")
                .inputTokens(response.getInputTokens())
                .outputTokens(response.getOutputTokens())
                .timestamp(Instant.now())
                .build();
            eventPublisher.publishEvent(event);
        });
}
```

#### [NEW] [UsageEventListener.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-social-service/src/main/java/com/muse/social/billing/UsageEventListener.java)

```java
@Component
public class UsageEventListener {
    
    private final TokenUsageService tokenUsageService;
    
    @EventListener
    @Async
    public void handleUsageEvent(UsageEvent event) {
        tokenUsageService.trackUsage(
            event.getUserId(),
            event.getInputTokens(),
            event.getOutputTokens()
        );
    }
}
```

---

## Phase 4: Alive UI

### 4.1 useSocketSync Hook

#### [NEW] [useSocketSync.js](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/frontend/web/src/hooks/useSocketSync.js)

```javascript
import { useEffect } from 'react';
import { useStompClient } from './useStompClient';
import { useDispatch } from 'react-redux';

export const useSocketSync = () => {
    const { stompClient } = useStompClient();
    const dispatch = useDispatch();
    
    useEffect(() => {
        if (!stompClient) return;
        
        const subscription = stompClient.subscribe('/user/topic/sync', (message) => {
            const payload = JSON.parse(message.body);
            
            switch (payload.type) {
                case 'REFRESH_SIDEBAR':
                    dispatch({ type: 'SIDEBAR_REFRESH', payload: payload.folderId });
                    break;
                case 'NEW_BOUNTY':
                    dispatch({ type: 'BOUNTY_ADDED', payload: payload.bounty });
                    break;
            }
        });
        
        return () => subscription.unsubscribe();
    }, [stompClient, dispatch]);
};
```

---

### 4.2 Glow Effect

#### [MODIFY] [SectionTree.jsx](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/frontend/web/src/components/notes/SectionTree.jsx)

```javascript
import { motion } from 'framer-motion';

const SectionTree = ({ highlightedId }) => {
    return sections.map(section => (
        <motion.div
            key={section.id}
            animate={section.id === highlightedId ? {
                backgroundColor: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)'],
                boxShadow: ['0 0 0px rgba(59, 130, 246, 0.5)', '0 0 20px rgba(59, 130, 246, 0.8)', '0 0 0px rgba(59, 130, 246, 0.5)']
            } : {}}
            transition={{ duration: 2, repeat: 5 }}
        >
            {section.name}
        </motion.div>
    ));
};
```

---

## Phase 5: Production Hardening

### 5.1 Resilience4j Circuit Breakers

#### [NEW] [pom.xml](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-notes-service/pom.xml)

```xml
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.2.0</version>
</dependency>
```

#### [MODIFY] [NotesServiceClient.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-social-service/src/main/java/com/muse/social/infrastructure/client/NotesServiceClient.java)

```java
@CircuitBreaker(name = "notesService", fallbackMethod = "injectSharedNoteFallback")
public Mono<Void> injectSharedNote(...) {
    return webClient.post()
        .uri("/api/internal/notes/inject")
        .bodyValue(...)
        .retrieve()
        .bodyToMono(Void.class);
}

private Mono<Void> injectSharedNoteFallback(Throwable t) {
    log.warn("Notes service unavailable, queueing for retry: {}", t.getMessage());
    // Queue in Redis for later processing
    return Mono.empty();
}
```

#### [NEW] [application.yml](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-social-service/src/main/resources/application.yml)

```yaml
resilience4j:
  circuitbreaker:
    instances:
      notesService:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
```

---

### 5.2 Global Error Handling

#### [NEW] [ScientificErrorResponse.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-ai-service/src/main/java/com/muse/ai/dto/ScientificErrorResponse.java)

```java
@Data
@Builder
public class ScientificErrorResponse {
    private String errorCode;
    private String message;
    private String technicalDetails;
    private Instant timestamp;
    private String requestId;
}
```

#### [NEW] [GlobalExceptionHandler.java](file:///c:/Users/prasanth/Desktop/muse-ilai/ilai-001/services/muse-ai-service/src/main/java/com/muse/ai/exception/GlobalExceptionHandler.java)

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MathConvergenceException.class)
    public ResponseEntity<ScientificErrorResponse> handleMathConvergence(MathConvergenceException e) {
        return ResponseEntity.status(422).body(
            ScientificErrorResponse.builder()
                .errorCode("ERR_MATH_CONVERGENCE")
                .message("The mathematical expression did not converge")
                .technicalDetails(e.getMessage())
                .timestamp(Instant.now())
                .build()
        );
    }
    
    @ExceptionHandler(InsufficientTierException.class)
    public ResponseEntity<ScientificErrorResponse> handleInsufficientTier(InsufficientTierException e) {
        return ResponseEntity.status(403).body(
            ScientificErrorResponse.builder()
                .errorCode("ERR_TIER_INSUFFICIENT")
                .message("This feature requires a" + e.getRequiredTier() + " subscription")
                .build()
        );
    }
}
```

---

## Verification Plan

### Automated Tests

1. **Integration Test: Bounty Solve Flow**
   ```java
   @Test
   void testCompleteBountySolveFlow() {
       // Create bounty
       // Submit solution
       // Accept solution
       // Verify points awarded
       // Verify note injected
       // Verify WebSocket notification sent
   }
   ```

2. **Circuit Breaker Test**
   ```java
   @Test
   void testNotesServiceCircuitBreaker() {
       // Simulate Notes Service down
       // Verify fallback triggered
       // Verify queuing mechanism
   }
   ```

3. **Tier Access Test**
   ```java
   @Test
   void testFeatureFlagInterceptor() {
       // Free user tries PRO feature
       // Expect 403 with upgrade prompt
   }
   ```

### Manual Verification

1. **WebSocket Real-Time Update**
   - User A solves bounty
   - User B (creator) sees folder appear with pulse animation
   - No page reload required

2. **Usage Metering**
   - Make AI request
   - Verify event emitted to BillingService
   - Check Stripe dashboard for usage record

3. **Circuit Breaker Behavior**
   - Stop AI Service
   - Notes Service continues to function
   - Error messages are user-friendly
