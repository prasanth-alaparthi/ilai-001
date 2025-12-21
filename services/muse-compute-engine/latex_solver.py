# ===============================================================================
# LaTeX Solver Endpoint - Production Implementation
# Part of Phase 2: Scientific Brain
# ===============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
import sympy as sp
from sympy.parsing.latex import parse_latex
from sympy import latex, Symbol, diff, integrate, solve, simplify, limit, Float
import time
from decimal import Decimal

class LatexSolverRequest(BaseModel):
    latex_expression: str
    operation: str = "solve"  # solve, diff, integrate, simplify, limit, evaluate
    variable: Optional[str] = "x"
    limit_to: Optional[float] = None
    variables_dict: Optional[Dict[str, float]] = None

class LatexSolverResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    result_latex: Optional[str] = None
    steps: List[str] = []
    error_margin: Optional[float] = None
    execution_time_ms: float
    error: Optional[str] = None
    error_code: Optional[str] = None

@app.post("/api/solver/latex", response_model=LatexSolverResponse)
async def solve_latex(request: LatexSolverRequest):
    """
    Production LaTeX solver with SymPy engine.
    
    Features:
    - Parses LaTeX expressions
    - Executes symbolic operations
    - Calculates numerical error margins
    - Returns step-by-step solutions
    """
    start_time = time.time()
    
    try:
        # Parse LaTeX to SymPy expression
        expr = parse_latex(request.latex_expression)
        var = Symbol(request.variable)
        
        # Apply variable substitutions if provided
        if request.variables_dict:
            for var_name, val in request.variables_dict.items():
                expr = expr.subs(Symbol(var_name), val)
        
        steps = [f"Input: {request.latex_expression}"]
        
        # Execute operation
        if request.operation == "diff" or "\\frac{d}" in request.latex_expression:
            result = diff(expr, var)
            steps.append(f"Differentiate with respect to {request.variable}")
            steps.append(f"Result: {result}")
            derivation_latex = f"\\frac{{d}}{{d{request.variable}}}({latex(expr)}) = {latex(result)}"
            
        elif request.operation == "integrate" or "\\int" in request.latex_expression:
            result = integrate(expr, var)
            steps.append(f"Integrate with respect to {request.variable}")
            steps.append(f"Result: {result} + C")
            derivation_latex = f"\\int ({latex(expr)}) d{request.variable} = {latex(result)} + C"
            
        elif request.operation == "limit":
            limit_point = request.limit_to if request.limit_to is not None else 0
            result = limit(expr, var, limit_point)
            steps.append(f"Take limit as {request.variable} → {limit_point}")
            steps.append(f"Result: {result}")
            derivation_latex = f"\\lim_{{{request.variable} \\to {limit_point}}} ({latex(expr)}) = {latex(result)}"
            
        elif request.operation == "simplify":
            result = simplify(expr)
            steps.append(f"Simplify expression")
            steps.append(f"Result: {result}")
            derivation_latex = f"{latex(expr)} = {latex(result)}"
            
        elif request.operation == "solve":
            solutions = solve(expr, var)
            result = solutions if solutions else expr
            steps.append(f"Solve for {request.variable}")
            if solutions:
                steps.append(f"Solutions: {solutions}")
                derivation_latex = f"{latex(expr)} = 0 \\Rightarrow {request.variable} = {latex(solutions)}"
            else:
                derivation_latex = f"Evaluate: {latex(expr)}"
                
        else:  # evaluate
            result = expr.evalf() if hasattr(expr, 'evalf') else expr
            steps.append(f"Evaluate: {result}")
            derivation_latex = f"{latex(expr)} = {latex(result)}"
        
        # Calculate error margin for numerical results
        error_margin = calculate_error_margin(result)
        
        execution_time = (time.time() - start_time) * 1000
        
        return LatexSolverResponse(
            success=True,
            result=str(result),
            result_latex=latex(result),
            steps=steps,
            error_margin=error_margin,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution_time = (time.time() - start_time) * 1000
        error_code = classify_error(e)
        
        return LatexSolverResponse(
            success=False,
            error=str(e),
            error_code=error_code,
            execution_time_ms=execution_time
        )

def calculate_error_margin(result) -> Optional[float]:
    """
    Calculate numerical error margin based on machine precision.
    Returns None for symbolic results.
    """
    try:
        if isinstance(result, Float):
            # Machine epsilon for floating point
            return float(abs(result * 1e-15))
        elif isinstance(result, (int, Decimal)):
            return 0.0
        elif isinstance(result, list):
            # For multiple solutions, return max error
            errors = [calculate_error_margin(r) for r in result]
            valid_errors = [e for e in errors if e is not None]
            return max(valid_errors) if valid_errors else None
    except:
        pass
    return None

def classify_error(exception: Exception) -> str:
    """
    Classify errors into standard error codes.
    """
    error_str = str(exception).lower()
    
    if "convergence" in error_str or "diverge" in error_str:
        return "ERR_MATH_CONVERGENCE"
    elif "latex" in error_str or "parse" in error_str:
        return "ERR_LATEX_PARSE"
    elif "symbol" in error_str and "undefined" in error_str:
        return "ERR_UNDEFINED_SYMBOL"
    elif "timeout" in error_str:
        return "ERR_TIMEOUT"
    else:
        return "ERR_COMPUTATION_FAILED"
