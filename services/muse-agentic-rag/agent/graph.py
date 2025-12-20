"""
LangGraph Agent Graph
Implements the agentic control loop with multi-hop retrieval and decision making
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import os
import asyncio

# LangGraph imports
try:
    from langgraph.graph import StateGraph, END
    from langchain_core.messages import HumanMessage, AIMessage
except ImportError:
    # Fallback for when langgraph is not installed
    StateGraph = None
    END = "end"

# LLM imports
try:
    from groq import Groq
except ImportError:
    Groq = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None


@dataclass
class AgentState:
    """State object for the agentic RAG workflow"""
    query: str
    refined_query: str = ""
    results: List[Dict[str, Any]] = field(default_factory=list)
    iteration: int = 0
    max_iterations: int = 3
    should_continue: bool = True
    thinking_log: List[str] = field(default_factory=list)
    final_answer: Optional[str] = None
    lab_data: Optional[Dict[str, Any]] = None
    vision_analysis: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if not self.refined_query:
            self.refined_query = self.query


class AgentGraph:
    """
    LangGraph-style agent with control loop for multi-hop retrieval
    """
    
    def __init__(
        self,
        tavily_searcher=None,
        hybrid_searcher=None,
        vision_analyzer=None,
        max_hops: int = 3
    ):
        self.tavily_searcher = tavily_searcher
        self.hybrid_searcher = hybrid_searcher
        self.vision_analyzer = vision_analyzer
        self.max_hops = max_hops
        
        # Initialize LLM for decision making
        self.groq_client = None
        self.gemini_model = None
        self._init_llm()
    
    def _init_llm(self):
        """Initialize LLM client for query refinement and answer generation"""
        groq_key = os.getenv("GROQ_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")
        
        if groq_key and Groq:
            self.groq_client = Groq(api_key=groq_key)
        
        if gemini_key and genai:
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
    
    async def _llm_call(self, prompt: str, system: str = "") -> str:
        """Make LLM call with fallback chain: Groq -> Gemini"""
        try:
            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system} if system else None,
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1024
                )
                return response.choices[0].message.content
        except Exception as e:
            print(f"Groq error: {e}")
        
        try:
            if self.gemini_model:
                full_prompt = f"{system}\n\n{prompt}" if system else prompt
                response = await asyncio.to_thread(
                    self.gemini_model.generate_content, full_prompt
                )
                return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
        
        return "Unable to process with LLM"
    
    async def adecide(self, state: AgentState) -> AgentState:
        """
        Decision node: Should we continue searching or generate answer?
        Implements the 'control loop' logic
        """
        state.iteration += 1
        
        # Check if we've hit max iterations
        if state.iteration >= state.max_iterations:
            state.should_continue = False
            state.thinking_log.append(f"Reached max iterations ({state.max_iterations})")
            return state
        
        # Check if we have enough quality results
        if len(state.results) >= 5:
            # Ask LLM to evaluate result quality
            eval_prompt = f"""
            Query: {state.query}
            
            Current search results:
            {self._format_results_for_llm(state.results[:5])}
            
            Evaluate if these results are sufficient to answer the query comprehensively.
            If yes, respond with: SUFFICIENT
            If no, respond with: REFINE: [new search query that would help]
            """
            
            evaluation = await self._llm_call(
                eval_prompt,
                system="You are a research assistant evaluating search result quality."
            )
            
            if "SUFFICIENT" in evaluation.upper():
                state.should_continue = False
                state.thinking_log.append("Results are sufficient for a comprehensive answer")
            elif "REFINE:" in evaluation.upper():
                # Extract new query
                new_query = evaluation.split("REFINE:")[-1].strip()
                state.refined_query = new_query
                state.should_continue = True
                state.thinking_log.append(f"Refining search to: {new_query}")
        else:
            # Not enough results, continue searching
            state.should_continue = True
            state.thinking_log.append("Not enough results, continuing search")
        
        return state
    
    async def agenerate_answer(self, state: AgentState) -> AgentState:
        """
        Generate final answer from collected results
        """
        if not state.results:
            state.final_answer = "I couldn't find relevant information for your query."
            return state
        
        # Format results for answer generation
        sources_text = self._format_results_for_llm(state.results[:10])
        
        answer_prompt = f"""
        Based on the following search results, provide a comprehensive answer to the query.
        
        Query: {state.query}
        
        Sources:
        {sources_text}
        
        Provide a well-structured answer with:
        1. Direct answer to the query
        2. Key supporting information from the sources
        3. Any relevant equations, formulas, or data (if applicable)
        
        Format any mathematical expressions in LaTeX where appropriate.
        """
        
        # Check for STEM-specific content to extract lab data
        if state.vision_analysis:
            answer_prompt += f"\n\nDiagram analysis: {state.vision_analysis}"
        
        state.final_answer = await self._llm_call(
            answer_prompt,
            system="You are a PhD-level research assistant specializing in STEM subjects."
        )
        
        # Extract lab data if relevant
        state.lab_data = self._extract_lab_data(state)
        
        return state
    
    def _format_results_for_llm(self, results: List[Dict[str, Any]]) -> str:
        """Format search results for LLM consumption"""
        formatted = []
        for i, r in enumerate(results, 1):
            title = r.get("title", "Untitled")
            content = r.get("content", r.get("snippet", ""))[:500]
            url = r.get("url", "")
            formatted.append(f"[{i}] {title}\nURL: {url}\n{content}\n")
        return "\n".join(formatted)
    
    def _extract_lab_data(self, state: AgentState) -> Optional[Dict[str, Any]]:
        """
        Extract structured data for Labs integration
        Looks for physics equations, chemistry formulas, etc.
        """
        lab_data = {}
        
        # Check vision analysis for extracted variables
        if state.vision_analysis and "extracted_variables" in state.vision_analysis:
            lab_data["variables"] = state.vision_analysis["extracted_variables"]
        
        # Check for common STEM patterns in results
        for result in state.results[:5]:
            content = result.get("content", "")
            
            # Physics: Look for F=ma, E=mc², etc.
            if "=" in content and any(var in content for var in ["F", "E", "v", "a", "m"]):
                lab_data["physics_hints"] = True
            
            # Chemistry: Look for molecular formulas
            if any(elem in content for elem in ["H₂", "O₂", "CO₂", "NaCl"]):
                lab_data["chemistry_hints"] = True
        
        return lab_data if lab_data else None
    
    async def arun(self, query: str, user_id: Optional[str] = None) -> AgentState:
        """
        Run the full agent workflow
        """
        state = AgentState(
            query=query,
            refined_query=query,
            max_iterations=self.max_hops
        )
        
        while state.should_continue and state.iteration < self.max_hops:
            # Search phase
            if self.tavily_searcher:
                web_results = await self.tavily_searcher.search(state.refined_query)
                state.results.extend(web_results)
            
            if self.hybrid_searcher:
                notes_results = await self.hybrid_searcher.search_notes(
                    state.refined_query, user_id
                )
                state.results.extend(notes_results)
                
                # Rerank all results
                state.results = await self.hybrid_searcher.rerank(
                    state.refined_query, state.results
                )
            
            # Decision phase
            state = await self.adecide(state)
        
        # Generate final answer
        state = await self.agenerate_answer(state)
        
        return state


def create_agent_graph(
    tavily_searcher=None,
    hybrid_searcher=None,
    vision_analyzer=None,
    max_hops: int = 3
) -> AgentGraph:
    """
    Factory function to create the agent graph
    """
    return AgentGraph(
        tavily_searcher=tavily_searcher,
        hybrid_searcher=hybrid_searcher,
        vision_analyzer=vision_analyzer,
        max_hops=max_hops
    )
