"""
Search Module
Implements Tavily web search, private notes search, and BGE-Reranker
With academic domain filtering for arXiv, MIT OpenCourseWare, etc.
"""

from typing import List, Dict, Any, Optional
import os
import asyncio

# Tavily client
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

# Sentence transformers for reranking
try:
    from sentence_transformers import CrossEncoder
except ImportError:
    CrossEncoder = None


# Academic domain configuration
ACADEMIC_DOMAINS = [
    "arxiv.org",
    "mit.edu", 
    "stanford.edu",
    "nature.com",
    "sciencedirect.com",
    "pubmed.ncbi.nlm.nih.gov",
    "scholar.google.com",
    "ieee.org",
    "acm.org",
    "springer.com",
    "wiley.com",
    "cambridge.org",
    "oxford.ac.uk",
    "jstor.org"
]

# Physics/Science constants domains
CONSTANTS_DOMAINS = [
    "nist.gov",
    "physics.nist.gov",
    "hyperphysics.phy-astr.gsu.edu",
    "wolframalpha.com",
    "physicsconstants.com"
]


class TavilySearcher:
    """
    Tavily API wrapper for web search
    Provides real-world research indexing capabilities
    With academic domain filtering
    """
    
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        self.client = None
        if self.api_key and TavilyClient:
            self.client = TavilyClient(api_key=self.api_key)
    
    async def search(
        self, 
        query: str, 
        max_results: int = 10,
        search_depth: str = "advanced",
        search_mode: str = "general"  # "general", "academic", "constants"
    ) -> List[Dict[str, Any]]:
        """
        Search the web using Tavily API
        
        Args:
            query: Search query
            max_results: Maximum number of results
            search_depth: "basic" or "advanced"
            search_mode: "general", "academic", or "constants"
            
        Returns:
            List of search results with title, url, content, score
        """
        if not self.client:
            return self._mock_results(query)
        
        try:
            # Prepare search kwargs
            search_kwargs = {
                "query": query,
                "max_results": max_results,
                "search_depth": search_depth,
                "include_images": True,
                "include_answer": True
            }
            
            # Add domain filtering based on mode
            if search_mode == "academic":
                search_kwargs["include_domains"] = ACADEMIC_DOMAINS
            elif search_mode == "constants":
                search_kwargs["include_domains"] = CONSTANTS_DOMAINS + ACADEMIC_DOMAINS[:5]
            
            # Run Tavily search in thread pool (it's synchronous)
            response = await asyncio.to_thread(
                self.client.search,
                **search_kwargs
            )
            
            results = []
            for item in response.get("results", []):
                # Determine if source is academic
                url = item.get("url", "")
                is_academic = any(domain in url for domain in ACADEMIC_DOMAINS)
                
                results.append({
                    "title": item.get("title", ""),
                    "url": url,
                    "content": item.get("content", ""),
                    "score": item.get("score", 0.5),
                    "source": "tavily",
                    "is_academic": is_academic,
                    "image_url": item.get("image_url")
                })
            
            return results
            
        except Exception as e:
            print(f"Tavily search error: {e}")
            return []
    
    async def search_academic(
        self,
        query: str,
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Convenience method for academic-only search
        Filters to arXiv, MIT, Stanford, Nature, etc.
        """
        return await self.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            search_mode="academic"
        )
    
    async def search_constants(
        self,
        query: str,
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for physical constants and scientific values
        Filters to NIST, HyperPhysics, etc.
        """
        # Enhance query for constants
        enhanced_query = f"{query} value constant unit"
        return await self.search(
            query=enhanced_query,
            max_results=max_results,
            search_depth="advanced",
            search_mode="constants"
        )
    
    def _mock_results(self, query: str) -> List[Dict[str, Any]]:
        """Mock results when Tavily is not configured"""
        return [{
            "title": f"Mock result for: {query}",
            "url": "https://example.com",
            "content": f"This is a mock search result for the query: {query}. Configure TAVILY_API_KEY for real results.",
            "score": 0.5,
            "source": "mock",
            "is_academic": False
        }]


class BGEReranker:
    """
    BGE-Reranker cross-encoder for result reranking
    Uses BAAI/bge-reranker-base or bge-reranker-large
    """
    
    def __init__(self, model_name: str = "BAAI/bge-reranker-base"):
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the cross-encoder model"""
        if CrossEncoder:
            try:
                self.model = CrossEncoder(self.model_name, max_length=512)
            except Exception as e:
                print(f"Error loading BGE-Reranker: {e}")
    
    async def rerank(
        self, 
        query: str, 
        results: List[Dict[str, Any]],
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Rerank results using cross-encoder
        
        Args:
            query: Original query
            results: List of search results
            top_k: Number of top results to return
            
        Returns:
            Reranked results with updated scores
        """
        if not self.model or not results:
            return results[:top_k]
        
        try:
            # Prepare pairs for cross-encoder
            pairs = [(query, r.get("content", r.get("title", ""))) for r in results]
            
            # Score pairs (run in thread pool - it's CPU intensive)
            scores = await asyncio.to_thread(self.model.predict, pairs)
            
            # Combine with original results
            scored_results = []
            for i, result in enumerate(results):
                result = result.copy()
                result["rerank_score"] = float(scores[i])
                scored_results.append(result)
            
            # Sort by rerank score
            scored_results.sort(key=lambda x: x["rerank_score"], reverse=True)
            
            return scored_results[:top_k]
            
        except Exception as e:
            print(f"Reranking error: {e}")
            return results[:top_k]


class PrivateNotesSearcher:
    """
    Search private user notes using vector similarity
    Integrates with the notes service/database
    """
    
    def __init__(self, notes_api_url: str = None):
        self.notes_api_url = notes_api_url or os.getenv(
            "NOTES_SERVICE_URL", 
            "http://muse-notes-service:8083"
        )
    
    async def search_notes(
        self, 
        query: str, 
        user_id: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search user's private notes
        
        Args:
            query: Search query
            user_id: User ID to filter notes
            limit: Max results
            
        Returns:
            List of matching notes
        """
        # TODO: Implement actual notes search via API or vector DB
        # For now, return empty - will be connected to notes service
        
        # In production, this would:
        # 1. Call notes service search API
        # 2. Or query a vector DB (ChromaDB) with user's note embeddings
        
        return []


class HybridSearcher:
    """
    Hybrid search combining web search + private notes
    Uses Reciprocal Rank Fusion (RRF) for merging results
    """
    
    def __init__(self, include_notes: bool = True):
        self.tavily = TavilySearcher()
        self.notes = PrivateNotesSearcher()
        self.reranker = BGEReranker()
        self.include_notes = include_notes
    
    async def search(
        self, 
        query: str, 
        user_id: Optional[str] = None,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search across web and private notes
        """
        # Parallel search
        tasks = [self.tavily.search(query, max_results=max_results)]
        
        if self.include_notes and user_id:
            tasks.append(self.notes.search_notes(query, user_id))
        
        results = await asyncio.gather(*tasks)
        
        # Flatten results
        all_results = []
        for result_set in results:
            all_results.extend(result_set)
        
        # Apply RRF fusion if we have multiple sources
        if len(results) > 1:
            all_results = self._rrf_fusion(all_results)
        
        return all_results
    
    async def search_notes(
        self, 
        query: str, 
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search only private notes"""
        return await self.notes.search_notes(query, user_id)
    
    async def rerank(
        self, 
        query: str, 
        results: List[Dict[str, Any]],
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """Rerank results using BGE cross-encoder"""
        return await self.reranker.rerank(query, results, top_k)
    
    def _rrf_fusion(
        self, 
        results: List[Dict[str, Any]], 
        k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Reciprocal Rank Fusion for combining multiple result sets
        
        Formula: score(d) = Σ 1/(k + rank(d))
        """
        # Group by source
        by_source = {}
        for r in results:
            source = r.get("source", "unknown")
            if source not in by_source:
                by_source[source] = []
            by_source[source].append(r)
        
        # Calculate RRF scores
        rrf_scores = {}
        for source, items in by_source.items():
            for rank, item in enumerate(items):
                url = item.get("url", id(item))
                if url not in rrf_scores:
                    rrf_scores[url] = {"item": item, "score": 0}
                rrf_scores[url]["score"] += 1 / (k + rank + 1)
        
        # Sort by RRF score
        fused = sorted(
            rrf_scores.values(), 
            key=lambda x: x["score"], 
            reverse=True
        )
        
        return [f["item"] for f in fused]
