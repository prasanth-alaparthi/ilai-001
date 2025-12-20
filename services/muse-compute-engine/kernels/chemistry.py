"""
Chemistry Kernel - RDKit Integration
Handles SMILES input, molecular weight, logP calculations
"""

import re
from typing import Dict, Any, Optional

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False


def is_smiles(expr: str) -> bool:
    """
    Detect if input is a SMILES string
    SMILES: Simplified Molecular Input Line Entry System
    """
    if not expr or len(expr) < 2:
        return False
    
    # Remove whitespace
    expr = expr.strip()
    
    # SMILES pattern: letters, numbers, brackets, special chars
    smiles_pattern = r'^[A-Za-z0-9@+\-\[\]\(\)\\/#=%\.]+$'
    
    if not re.match(smiles_pattern, expr):
        return False
    
    # Quick validation: try to parse with RDKit
    if RDKIT_AVAILABLE:
        try:
            mol = Chem.MolFromSmiles(expr)
            return mol is not None
        except:
            return False
    
    # Heuristic check for common SMILES patterns
    common_patterns = ['C', 'O', 'N', 'c', 'n', 'o', '(', ')', '=', '#']
    return any(p in expr for p in common_patterns)


def analyze_molecule(smiles: str) -> Dict[str, Any]:
    """
    Analyze a molecule from SMILES string
    Returns molecular properties
    """
    if not RDKIT_AVAILABLE:
        return {
            "success": False,
            "error": "RDKit not installed"
        }
    
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return {
                "success": False,
                "error": f"Invalid SMILES string: {smiles}"
            }
        
        # Calculate properties
        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        formula = rdMolDescriptors.CalcMolFormula(mol)
        num_atoms = mol.GetNumAtoms()
        num_bonds = mol.GetNumBonds()
        num_rings = rdMolDescriptors.CalcNumRings(mol)
        hbd = rdMolDescriptors.CalcNumHBD(mol)  # H-bond donors
        hba = rdMolDescriptors.CalcNumHBA(mol)  # H-bond acceptors
        tpsa = rdMolDescriptors.CalcTPSA(mol)   # Topological polar surface area
        
        # Try to get InChI
        try:
            inchi = Chem.MolToInchi(mol)
        except:
            inchi = None
        
        return {
            "success": True,
            "subject": "Chemistry",
            "input": smiles,
            "formula": formula,
            "molecular_weight": round(mw, 4),
            "logP": round(logp, 4),
            "num_atoms": num_atoms,
            "num_bonds": num_bonds,
            "num_rings": num_rings,
            "hbd": hbd,
            "hba": hba,
            "tpsa": round(tpsa, 2),
            "inchi": inchi,
            "derivation_latex": f"\\text{{Formula: }} {formula} \\quad MW = {mw:.2f} \\text{{ g/mol}} \\quad \\log P = {logp:.2f}",
            "steps": [
                f"Input SMILES: {smiles}",
                f"Molecular Formula: {formula}",
                f"Molecular Weight: {mw:.4f} g/mol",
                f"LogP (lipophilicity): {logp:.4f}",
                f"Ring Count: {num_rings}",
                f"H-Bond Donors: {hbd}, Acceptors: {hba}"
            ],
            "injectable_variables": [
                {"symbol": "MW", "value": str(round(mw, 4)), "unit": "g/mol"},
                {"symbol": "logP", "value": str(round(logp, 4)), "unit": None}
            ]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Common molecules lookup
COMMON_MOLECULES = {
    "water": "O",
    "ethanol": "CCO",
    "methane": "C",
    "benzene": "c1ccccc1",
    "aspirin": "CC(=O)OC1=CC=CC=C1C(=O)O",
    "caffeine": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    "glucose": "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O",
    "sucrose": "OC[C@H]1O[C@H](O[C@]2(CO)O[C@H](CO)[C@@H](O)[C@@H]2O)[C@H](O)[C@@H](O)[C@@H]1O"
}


def get_smiles_for_name(name: str) -> Optional[str]:
    """Convert common molecule name to SMILES"""
    return COMMON_MOLECULES.get(name.lower())
