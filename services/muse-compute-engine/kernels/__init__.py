"""
Kernels Package
Subject-specific computation engines
"""

from .chemistry import is_smiles, analyze_molecule, get_smiles_for_name, COMMON_MOLECULES
from .physics import has_units, parse_with_units, check_dimensional_consistency, get_constant, PHYSICS_CONSTANTS

__all__ = [
    # Chemistry
    'is_smiles',
    'analyze_molecule', 
    'get_smiles_for_name',
    'COMMON_MOLECULES',
    
    # Physics
    'has_units',
    'parse_with_units',
    'check_dimensional_consistency',
    'get_constant',
    'PHYSICS_CONSTANTS'
]
