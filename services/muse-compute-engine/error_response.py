"""
ScientificErrorResponse - Standardized Error Response Model for Python Services

This module provides a consistent error response structure across all Python
microservices (Compute Engine, Agentic RAG) to match the Java services' error handling.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ErrorCode(str, Enum):
    """Standard error codes for scientific computation services"""
    
    # Mathematical computation errors
    ERR_MATH_CONVERGENCE = "ERR_MATH_CONVERGENCE"
    ERR_MATH_OVERFLOW = "ERR_MATH_OVERFLOW"
    ERR_MATH_UNDERFLOW = "ERR_MATH_UNDERFLOW"
    ERR_MATH_DOMAIN = "ERR_MATH_DOMAIN"
    ERR_MATH_SINGULARITY = "ERR_MATH_SINGULARITY"
    
    # Parsing errors
    ERR_LATEX_PARSE = "ERR_LATEX_PARSE"
    ERR_SYNTAX = "ERR_SYNTAX"
    ERR_UNDEFINED_SYMBOL = "ERR_UNDEFINED_SYMBOL"
    
    # Execution errors
    ERR_TIMEOUT = "ERR_TIMEOUT"
    ERR_MEMORY_LIMIT = "ERR_MEMORY_LIMIT"
    ERR_COMPUTATION_FAILED = "ERR_COMPUTATION_FAILED"
    
    # Input validation errors
    ERR_INVALID_INPUT = "ERR_INVALID_INPUT"
    ERR_MISSING_PARAMETER = "ERR_MISSING_PARAMETER"
    
    # System errors
    ERR_INTERNAL = "ERR_INTERNAL"
    ERR_SERVICE_UNAVAILABLE = "ERR_SERVICE_UNAVAILABLE"
    ERR_RATE_LIMIT = "ERR_RATE_LIMIT"
    
    # Security errors
    ERR_UNAUTHORIZED = "ERR_UNAUTHORIZED"
    ERR_FORBIDDEN = "ERR_FORBIDDEN"


class ScientificErrorResponse(BaseModel):
    """
    Standardized error response model for scientific computation services.
    
    Attributes:
        success: Always False for error responses
        error_code: Standard error code from ErrorCode enum
        message: User-friendly error message
        technical_details: Technical details for debugging (optional)
        timestamp: ISO 8601 timestamp when error occurred
        request_id: Unique request identifier for tracing (optional)
        metadata: Additional context-specific information (optional)
    """
    
    success: bool = False
    error_code: ErrorCode
    message: str
    technical_details: Optional[str] = None
    timestamp: str
    request_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        use_enum_values = True
        
    @classmethod
    def create(
        cls,
        error_code: ErrorCode,
        message: str,
        technical_details: Optional[str] = None,
        request_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> "ScientificErrorResponse":
        """
        Factory method to create error responses.
        
        Example:
            error = ScientificErrorResponse.create(
                error_code=ErrorCode.ERR_MATH_CONVERGENCE,
                message="The equation did not converge within iteration limit",
                technical_details="Max iterations (1000) exceeded for Newton-Raphson method"
            )
        """
        return cls(
            error_code=error_code,
            message=message,
            technical_details=technical_details,
            timestamp=datetime.utcnow().isoformat() + "Z",
            request_id=request_id,
            metadata=metadata
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "success": self.success,
            "error_code": self.error_code,
            "message": self.message,
            "technical_details": self.technical_details,
            "timestamp": self.timestamp,
            "request_id": self.request_id,
            "metadata": self.metadata
        }


# Convenience functions for common error types
def math_convergence_error(details: str = "Solution did not converge") -> ScientificErrorResponse:
    """Create convergence error response"""
    return ScientificErrorResponse.create(
        error_code=ErrorCode.ERR_MATH_CONVERGENCE,
        message="The mathematical computation did not converge",
        technical_details=details
    )


def latex_parse_error(details: str) -> ScientificErrorResponse:
    """Create LaTeX parsing error response"""
    return ScientificErrorResponse.create(
        error_code=ErrorCode.ERR_LATEX_PARSE,
        message="Failed to parse LaTeX expression",
        technical_details=details
    )


def timeout_error(details: str = "Computation exceeded time limit") -> ScientificErrorResponse:
    """Create timeout error response"""
    return ScientificErrorResponse.create(
        error_code=ErrorCode.ERR_TIMEOUT,
        message="Computation timed out",
        technical_details=details
    )


def invalid_input_error(details: str) -> ScientificErrorResponse:
    """Create invalid input error response"""
    return ScientificErrorResponse.create(
        error_code=ErrorCode.ERR_INVALID_INPUT,
        message="Invalid input provided",
        technical_details=details
    )


def internal_error(details: str = "An unexpected error occurred") -> ScientificErrorResponse:
    """Create internal server error response"""
    return ScientificErrorResponse.create(
        error_code=ErrorCode.ERR_INTERNAL,
        message="Internal server error",
        technical_details=details
    )
