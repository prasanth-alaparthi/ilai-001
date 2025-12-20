"""
MUSE Agentic RAG Service
Global Research Agent with Multi-hop Retrieval, Cross-Encoder Reranking, and Multimodal Vision

Features:
- LangGraph Control Loop with autonomous decision making
- Tavily API for real-world web search
- BGE-Reranker for hybrid result fusion
- Gemini-2.5-Flash Vision for diagram analysis
- SSE Streaming for real-time "thinking" visualization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
from datetime import datetime

# Import agent components
from agent.graph import create_agent_graph, AgentState
from agent.search import TavilySearcher, HybridSearcher
from agent.vision import VisionAnalyzer

app = FastAPI(
    title="MUSE Agentic RAG Service",
    description="Global Research Agent with Multi-hop Retrieval",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Request/Response Models ====================

class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    include_private_notes: bool = True
    max_hops: int = 3
    include_vision: bool = True

class VisionRequest(BaseModel):
    image_url: str
    context: Optional[str] = None
    extract_for: str = "physics"  # physics, chemistry, math

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float
    source: str  # "tavily", "notes", "hybrid"

class AgentResponse(BaseModel):
    query: str
    answer: str
    sources: List[Dict[str, Any]]
    iterations: int
    lab_data: Optional[Dict[str, Any]] = None
    vision_analysis: Optional[Dict[str, Any]] = None

# ==================== Health Check ====================

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "muse-agentic-rag",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY")),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
    }

# ==================== SSE Streaming Search ====================

async def generate_search_stream(request: SearchRequest):
    """
    Generator for Server-Sent Events streaming
    Yields real-time status updates as the agent thinks and searches
    """
    
    def format_sse(data: dict) -> str:
        """Format data as SSE event"""
        return f"data: {json.dumps(data)}\n\n"
    
    try:
        # Initialize state
        yield format_sse({
            "type": "thinking",
            "message": "Analyzing your query...",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        await asyncio.sleep(0.3)  # Small delay for UX
        
        # Initialize searchers
        tavily_searcher = TavilySearcher()
        hybrid_searcher = HybridSearcher(include_notes=request.include_private_notes)
        vision_analyzer = VisionAnalyzer() if request.include_vision else None
        
        # Create agent graph
        agent = create_agent_graph(
            tavily_searcher=tavily_searcher,
            hybrid_searcher=hybrid_searcher,
            vision_analyzer=vision_analyzer,
            max_hops=request.max_hops
        )
        
        # Initial state
        state = AgentState(
            query=request.query,
            refined_query=request.query,
            results=[],
            iteration=0,
            max_iterations=request.max_hops,
            should_continue=True,
            thinking_log=[],
            final_answer=None,
            lab_data=None,
            vision_analysis=None
        )
        
        # Run agent with streaming updates
        current_iteration = 0
        
        while state.should_continue and current_iteration < request.max_hops:
            current_iteration += 1
            
            # Search phase
            yield format_sse({
                "type": "searching",
                "iteration": current_iteration,
                "query": state.refined_query,
                "source": "tavily",
                "message": f"Searching the web for: {state.refined_query}"
            })
            
            # Perform Tavily search
            web_results = await tavily_searcher.search(state.refined_query)
            
            yield format_sse({
                "type": "results",
                "iteration": current_iteration,
                "count": len(web_results),
                "source": "tavily"
            })
            
            # Private notes search (if enabled)
            if request.include_private_notes:
                yield format_sse({
                    "type": "searching",
                    "iteration": current_iteration,
                    "query": state.refined_query,
                    "source": "notes",
                    "message": "Searching your private notes..."
                })
                
                notes_results = await hybrid_searcher.search_notes(
                    state.refined_query, 
                    user_id=request.user_id
                )
                
                yield format_sse({
                    "type": "results",
                    "iteration": current_iteration,
                    "count": len(notes_results),
                    "source": "notes"
                })
            else:
                notes_results = []
            
            # Reranking phase
            all_results = web_results + notes_results
            if all_results:
                yield format_sse({
                    "type": "reranking",
                    "count": len(all_results),
                    "message": "Applying cross-encoder reranking..."
                })
                
                reranked_results = await hybrid_searcher.rerank(
                    state.refined_query, 
                    all_results
                )
                state.results = reranked_results
            
            # Decision phase - should we continue?
            yield format_sse({
                "type": "thinking",
                "iteration": current_iteration,
                "message": "Evaluating result quality..."
            })
            
            # Run the agent's decision node
            state = await agent.adecide(state)
            
            if state.should_continue and current_iteration < request.max_hops:
                yield format_sse({
                    "type": "refining",
                    "iteration": current_iteration,
                    "reason": state.thinking_log[-1] if state.thinking_log else "Need more specific results",
                    "new_query": state.refined_query,
                    "message": f"Refining search query to: {state.refined_query}"
                })
                await asyncio.sleep(0.2)
            else:
                state.should_continue = False
        
        # Vision analysis if results contain images
        if request.include_vision and vision_analyzer:
            image_results = [r for r in state.results if r.get("image_url")]
            if image_results:
                yield format_sse({
                    "type": "vision",
                    "message": "Analyzing diagrams with Gemini Vision...",
                    "count": len(image_results)
                })
                
                for img_result in image_results[:3]:  # Limit to 3 images
                    analysis = await vision_analyzer.analyze(
                        img_result["image_url"],
                        context=request.query
                    )
                    if analysis:
                        state.vision_analysis = analysis
                        yield format_sse({
                            "type": "vision_result",
                            "image_url": img_result["image_url"],
                            "analysis": analysis
                        })
        
        # Generate final answer
        yield format_sse({
            "type": "generating",
            "message": "Synthesizing final answer..."
        })
        
        state = await agent.agenerate_answer(state)
        
        # Final result
        yield format_sse({
            "type": "result",
            "query": request.query,
            "answer": state.final_answer,
            "sources": state.results[:10],  # Top 10 sources
            "iterations": current_iteration,
            "lab_data": state.lab_data,
            "vision_analysis": state.vision_analysis
        })
        
        yield format_sse({"type": "done"})
        
    except Exception as e:
        yield format_sse({
            "type": "error",
            "message": str(e)
        })

@app.post("/api/rag/search")
async def search_stream(request: SearchRequest):
    """
    Agentic RAG search with SSE streaming
    Returns real-time updates as the agent thinks, searches, and refines
    """
    return StreamingResponse(
        generate_search_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ==================== Non-Streaming Search ====================

@app.post("/api/rag/search/sync", response_model=AgentResponse)
async def search_sync(request: SearchRequest):
    """
    Synchronous search endpoint (non-streaming)
    Use /api/rag/search for streaming experience
    """
    try:
        # Initialize components
        tavily_searcher = TavilySearcher()
        hybrid_searcher = HybridSearcher(include_notes=request.include_private_notes)
        vision_analyzer = VisionAnalyzer() if request.include_vision else None
        
        # Create and run agent
        agent = create_agent_graph(
            tavily_searcher=tavily_searcher,
            hybrid_searcher=hybrid_searcher,
            vision_analyzer=vision_analyzer,
            max_hops=request.max_hops
        )
        
        result = await agent.arun(
            query=request.query,
            user_id=request.user_id
        )
        
        return AgentResponse(
            query=request.query,
            answer=result.final_answer,
            sources=result.results[:10],
            iterations=result.iteration,
            lab_data=result.lab_data,
            vision_analysis=result.vision_analysis
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Vision Analysis ====================

@app.post("/api/rag/vision/analyze")
async def analyze_vision(request: VisionRequest):
    """
    Analyze an image (diagram, circuit, molecule) using Gemini Vision
    Extracts variables and data for Labs integration
    """
    try:
        vision_analyzer = VisionAnalyzer()
        
        analysis = await vision_analyzer.analyze(
            image_url=request.image_url,
            context=request.context,
            extract_for=request.extract_for
        )
        
        return {
            "success": True,
            "image_url": request.image_url,
            "analysis": analysis,
            "lab_data": analysis.get("extracted_variables", {})
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# ==================== Startup Event ====================

@app.on_event("startup")
async def startup():
    """Initialize components on startup"""
    # Verify API keys
    if not os.getenv("TAVILY_API_KEY"):
        print("WARNING: TAVILY_API_KEY not set - web search will be disabled")
    if not os.getenv("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY not set - vision analysis will be disabled")
    
    print("MUSE Agentic RAG Service started successfully")
