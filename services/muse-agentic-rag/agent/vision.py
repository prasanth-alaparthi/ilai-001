"""
Vision Analysis Module
Uses Gemini-2.5-Flash Vision to analyze diagrams, circuits, molecules
and extract variables for Labs integration
"""

from typing import Dict, Any, Optional, List
import os
import asyncio
import base64
import httpx

# Gemini SDK
try:
    import google.generativeai as genai
except ImportError:
    genai = None


class VisionAnalyzer:
    """
    Multimodal STEM Intelligence using Gemini Vision
    Analyzes diagrams and extracts structured data for Labs
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        self._init_model()
    
    def _init_model(self):
        """Initialize Gemini Vision model"""
        if self.api_key and genai:
            genai.configure(api_key=self.api_key)
            # Use gemini-2.0-flash for vision tasks
            self.model = genai.GenerativeModel("gemini-2.0-flash")
    
    async def analyze(
        self,
        image_url: str,
        context: Optional[str] = None,
        extract_for: str = "physics"
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze an image and extract STEM-relevant information
        
        Args:
            image_url: URL of the image to analyze
            context: Optional context about what to look for
            extract_for: Target domain - "physics", "chemistry", "math"
            
        Returns:
            Dictionary with analysis and extracted variables
        """
        if not self.model:
            return {"error": "Gemini Vision not configured"}
        
        try:
            # Fetch image
            image_data = await self._fetch_image(image_url)
            if not image_data:
                return {"error": "Could not fetch image"}
            
            # Create prompt based on domain
            prompt = self._create_extraction_prompt(context, extract_for)
            
            # Analyze with Gemini Vision
            response = await asyncio.to_thread(
                self.model.generate_content,
                [prompt, image_data]
            )
            
            # Parse response
            analysis = self._parse_response(response.text, extract_for)
            
            return {
                "success": True,
                "domain": extract_for,
                "raw_analysis": response.text,
                "extracted_variables": analysis.get("variables", {}),
                "equations": analysis.get("equations", []),
                "components": analysis.get("components", []),
                "description": analysis.get("description", "")
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def _fetch_image(self, url: str) -> Optional[Any]:
        """Fetch image from URL and prepare for Gemini"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()
                
                # Get content type
                content_type = response.headers.get("content-type", "image/jpeg")
                
                # Return as Gemini-compatible image part
                if genai:
                    return {
                        "mime_type": content_type,
                        "data": base64.b64encode(response.content).decode()
                    }
                    
        except Exception as e:
            print(f"Image fetch error: {e}")
            return None
    
    def _create_extraction_prompt(
        self, 
        context: Optional[str], 
        extract_for: str
    ) -> str:
        """Create domain-specific extraction prompt"""
        
        base_prompt = "Analyze this image carefully and extract relevant information.\n\n"
        
        if context:
            base_prompt += f"Context: {context}\n\n"
        
        if extract_for == "physics":
            return base_prompt + """
            This appears to be a physics-related diagram.
            
            Please identify and extract:
            1. **Variables**: Any labeled values (e.g., R=10Ω, V=5V, m=2kg, F=10N)
            2. **Equations**: Any visible formulas or relationships
            3. **Components**: What physical elements are shown (resistors, capacitors, masses, springs, etc.)
            4. **Circuit/System Type**: (e.g., series circuit, parallel, free body diagram, wave diagram)
            
            Format your response as:
            VARIABLES: var1=value1, var2=value2, ...
            EQUATIONS: eq1, eq2, ...
            COMPONENTS: component1, component2, ...
            DESCRIPTION: Brief description of the diagram
            """
        
        elif extract_for == "chemistry":
            return base_prompt + """
            This appears to be a chemistry-related diagram.
            
            Please identify and extract:
            1. **Molecules**: Molecular formulas (e.g., H2O, CH4, NaCl)
            2. **Bonds**: Types of bonds shown
            3. **Reactions**: Any chemical equations
            4. **Structure Type**: (e.g., Lewis structure, molecular geometry, reaction mechanism)
            
            Format your response as:
            MOLECULES: mol1, mol2, ...
            BONDS: bond_type1, bond_type2, ...
            REACTIONS: reaction1, reaction2, ...
            DESCRIPTION: Brief description of the diagram
            """
        
        elif extract_for == "math":
            return base_prompt + """
            This appears to be a mathematical diagram.
            
            Please identify and extract:
            1. **Variables**: Any labeled points, lengths, angles (e.g., x=5, θ=30°)
            2. **Equations**: Any visible equations or expressions
            3. **Shapes**: Geometric shapes present
            4. **Relationships**: Mathematical relationships shown
            
            Format your response as:
            VARIABLES: var1=value1, var2=value2, ...
            EQUATIONS: eq1, eq2, ...
            SHAPES: shape1, shape2, ...
            DESCRIPTION: Brief description of the diagram
            """
        
        return base_prompt + "Extract any relevant values, labels, and descriptions from this image."
    
    def _parse_response(
        self, 
        response_text: str, 
        domain: str
    ) -> Dict[str, Any]:
        """Parse Gemini response into structured data"""
        result = {
            "variables": {},
            "equations": [],
            "components": [],
            "description": ""
        }
        
        lines = response_text.split("\n")
        
        for line in lines:
            line = line.strip()
            
            if line.startswith("VARIABLES:"):
                # Parse variables like "R=10Ω, V=5V"
                vars_str = line.replace("VARIABLES:", "").strip()
                for var_pair in vars_str.split(","):
                    if "=" in var_pair:
                        name, value = var_pair.split("=", 1)
                        result["variables"][name.strip()] = value.strip()
            
            elif line.startswith("EQUATIONS:"):
                eq_str = line.replace("EQUATIONS:", "").strip()
                result["equations"] = [e.strip() for e in eq_str.split(",") if e.strip()]
            
            elif line.startswith("COMPONENTS:") or line.startswith("MOLECULES:") or line.startswith("SHAPES:"):
                prefix = line.split(":")[0]
                comp_str = line.replace(f"{prefix}:", "").strip()
                result["components"] = [c.strip() for c in comp_str.split(",") if c.strip()]
            
            elif line.startswith("DESCRIPTION:"):
                result["description"] = line.replace("DESCRIPTION:", "").strip()
        
        return result
    
    async def analyze_batch(
        self,
        image_urls: List[str],
        context: Optional[str] = None,
        extract_for: str = "physics"
    ) -> List[Dict[str, Any]]:
        """Analyze multiple images in parallel"""
        tasks = [
            self.analyze(url, context, extract_for) 
            for url in image_urls
        ]
        return await asyncio.gather(*tasks)
