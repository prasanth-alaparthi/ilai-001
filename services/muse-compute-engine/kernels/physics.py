"""
Physics Kernel - Pint Unit-Aware Math
Handles unit conversions and dimensional analysis
"""

import re
from typing import Dict, Any, Optional, Tuple

try:
    import pint
    ureg = pint.UnitRegistry()
    PINT_AVAILABLE = True
except ImportError:
    ureg = None
    PINT_AVAILABLE = False


def has_units(expr: str) -> bool:
    """
    Detect if expression contains units
    """
    # Common unit patterns
    unit_patterns = [
        r'\d+\s*m\b', r'\d+\s*cm\b', r'\d+\s*mm\b', r'\d+\s*km\b',  # Length
        r'\d+\s*g\b', r'\d+\s*kg\b', r'\d+\s*mg\b',                  # Mass
        r'\d+\s*s\b', r'\d+\s*ms\b', r'\d+\s*min\b', r'\d+\s*h\b',   # Time
        r'\d+\s*N\b', r'\d+\s*J\b', r'\d+\s*W\b',                    # Force/Energy/Power
        r'\d+\s*Pa\b', r'\d+\s*atm\b', r'\d+\s*bar\b',               # Pressure
        r'\d+\s*K\b', r'\d+\s*°C\b', r'\d+\s*°F\b',                  # Temperature
        r'\d+\s*A\b', r'\d+\s*V\b', r'\d+\s*Ω\b',                    # Electrical
        r'\d+\s*mol\b', r'\d+\s*L\b', r'\d+\s*mL\b',                 # Chemistry
    ]
    
    for pattern in unit_patterns:
        if re.search(pattern, expr, re.IGNORECASE):
            return True
    return False


def parse_with_units(expr: str) -> Dict[str, Any]:
    """
    Parse and evaluate expression with units
    """
    if not PINT_AVAILABLE:
        return {
            "success": False,
            "error": "Pint not installed - unit calculations unavailable"
        }
    
    try:
        # Clean expression
        expr = expr.strip()
        if expr.endswith('='):
            expr = expr[:-1].strip()
        
        # Replace common symbols
        expr = expr.replace('×', '*')
        expr = expr.replace('÷', '/')
        expr = expr.replace('^', '**')
        
        # Parse the expression
        result = ureg.parse_expression(expr)
        
        # Convert to base units for consistency
        base_result = result.to_base_units()
        
        # Try to simplify to common units
        simplified = simplify_units(result)
        
        return {
            "success": True,
            "subject": "Physics",
            "input": expr,
            "result": str(simplified),
            "result_base": str(base_result),
            "magnitude": float(simplified.magnitude),
            "units": str(simplified.units),
            "derivation_latex": f"{expr} = {simplified.magnitude:.4g} \\, \\text{{{simplified.units}}}",
            "steps": [
                f"Input: {expr}",
                f"Parse units",
                f"Result: {simplified}",
                f"Base units: {base_result}"
            ],
            "injectable_variables": [
                {"symbol": "result", "value": str(simplified.magnitude), "unit": str(simplified.units)}
            ]
        }
        
    except pint.DimensionalityError as e:
        return {
            "success": False,
            "error": f"Dimensional mismatch: {e}",
            "hint": "Cannot add quantities with different dimensions (e.g., meters + seconds)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def simplify_units(quantity) -> Any:
    """
    Try to simplify to common units
    """
    if not PINT_AVAILABLE:
        return quantity
    
    # Check dimensionality and convert to common units
    dim = quantity.dimensionality
    
    try:
        # Length
        if dim == ureg.meter.dimensionality:
            mag = quantity.to('meter').magnitude
            if abs(mag) >= 1000:
                return quantity.to('kilometer')
            elif abs(mag) < 0.01:
                return quantity.to('millimeter')
            elif abs(mag) < 1:
                return quantity.to('centimeter')
            return quantity.to('meter')
        
        # Mass  
        if dim == ureg.kilogram.dimensionality:
            mag = quantity.to('gram').magnitude
            if abs(mag) >= 1000:
                return quantity.to('kilogram')
            elif abs(mag) < 1:
                return quantity.to('milligram')
            return quantity.to('gram')
        
        # Time
        if dim == ureg.second.dimensionality:
            mag = quantity.to('second').magnitude
            if abs(mag) >= 3600:
                return quantity.to('hour')
            elif abs(mag) >= 60:
                return quantity.to('minute')
            return quantity.to('second')
        
        # Keep as is for other dimensions
        return quantity
        
    except:
        return quantity


def check_dimensional_consistency(expr1: str, expr2: str) -> Dict[str, Any]:
    """
    Formal verification: Check if two expressions have consistent dimensions
    """
    if not PINT_AVAILABLE:
        return {
            "consistent": None,
            "error": "Pint not available"
        }
    
    try:
        q1 = ureg.parse_expression(expr1)
        q2 = ureg.parse_expression(expr2)
        
        consistent = q1.dimensionality == q2.dimensionality
        
        return {
            "consistent": consistent,
            "expr1_dims": str(q1.dimensionality),
            "expr2_dims": str(q2.dimensionality),
            "message": "Dimensions match" if consistent else f"Dimensional mismatch: {q1.dimensionality} vs {q2.dimensionality}"
        }
        
    except Exception as e:
        return {
            "consistent": None,
            "error": str(e)
        }


# Common physics constants
PHYSICS_CONSTANTS = {
    "c": ("299792458", "m/s", "Speed of light"),
    "G": ("6.67430e-11", "m^3/(kg*s^2)", "Gravitational constant"),
    "h": ("6.62607015e-34", "J*s", "Planck constant"),
    "e": ("1.602176634e-19", "C", "Elementary charge"),
    "k_B": ("1.380649e-23", "J/K", "Boltzmann constant"),
    "N_A": ("6.02214076e23", "1/mol", "Avogadro number"),
    "R": ("8.314462618", "J/(mol*K)", "Gas constant"),
    "g": ("9.80665", "m/s^2", "Standard gravity"),
}


def get_constant(name: str) -> Optional[Tuple[str, str, str]]:
    """Get a physics constant by name"""
    return PHYSICS_CONSTANTS.get(name)
