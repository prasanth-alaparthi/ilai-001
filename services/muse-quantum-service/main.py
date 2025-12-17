# Quantum Computing Service for MUSE Labs
# Uses Qiskit Aer for local quantum simulation

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import traceback
import re

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

app = FastAPI(
    title="MUSE Quantum Service",
    description="Quantum computing simulation for educational purposes",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class CircuitRequest(BaseModel):
    num_qubits: int = 2
    gates: list  # List of gate operations
    shots: int = 1024

class CodeRequest(BaseModel):
    code: str
    shots: int = 1024

class GateOperation(BaseModel):
    gate: str  # h, x, y, z, cx, cz, t, s, etc.
    qubits: list  # [0] for single qubit, [0, 1] for two-qubit gates


# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "muse-quantum-service"}


# Run circuit from visual builder
@app.post("/api/quantum/run-circuit")
def run_circuit(request: CircuitRequest):
    """
    Execute a quantum circuit from visual builder gates
    """
    try:
        qc = QuantumCircuit(request.num_qubits, request.num_qubits)
        
        for gate_op in request.gates:
            gate = gate_op.get("gate", "").lower()
            qubits = gate_op.get("qubits", [0])
            
            if gate == "h":
                qc.h(qubits[0])
            elif gate == "x":
                qc.x(qubits[0])
            elif gate == "y":
                qc.y(qubits[0])
            elif gate == "z":
                qc.z(qubits[0])
            elif gate == "t":
                qc.t(qubits[0])
            elif gate == "s":
                qc.s(qubits[0])
            elif gate == "cx" or gate == "cnot":
                qc.cx(qubits[0], qubits[1])
            elif gate == "cz":
                qc.cz(qubits[0], qubits[1])
            elif gate == "swap":
                qc.swap(qubits[0], qubits[1])
        
        # Measure all qubits
        qc.measure_all()
        
        # Run on simulator
        simulator = AerSimulator()
        transpiled = transpile(qc, simulator)
        job = simulator.run(transpiled, shots=request.shots)
        result = job.result()
        counts = result.get_counts()
        
        # Calculate probabilities
        probabilities = {k: v / request.shots for k, v in counts.items()}
        
        return {
            "success": True,
            "counts": counts,
            "probabilities": probabilities,
            "shots": request.shots,
            "num_qubits": request.num_qubits,
            "circuit_depth": qc.depth(),
            "gate_count": len(request.gates)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Run Qiskit code (advanced mode)
@app.post("/api/quantum/run-code")
def run_code(request: CodeRequest):
    """
    Execute user-written Qiskit code (with safe imports)
    """
    try:
        # Security: Check for dangerous patterns
        sanitize_code(request.code)
        
        # Pre-process code to replace imports with our safe versions
        processed_code = preprocess_imports(request.code)
        
        # Create execution environment with safe Qiskit modules
        safe_globals = create_safe_environment()
        safe_locals = {}
        
        # Execute user code
        exec(processed_code, safe_globals, safe_locals)
        
        # Get the circuit (user must define 'circuit', 'qc', or we extract from execute)
        circuit = safe_locals.get("circuit") or safe_locals.get("qc")
        
        # Check if user used execute() - get result from there
        if "result" in safe_locals and hasattr(safe_locals["result"], "get_counts"):
            counts = safe_locals["result"].get_counts()
            shots = request.shots
            probabilities = {k: v / sum(counts.values()) for k, v in counts.items()}
            return {
                "success": True,
                "counts": counts,
                "probabilities": probabilities,
                "shots": sum(counts.values()),
                "num_qubits": circuit.num_qubits if circuit else "unknown",
                "circuit_depth": circuit.depth() if circuit else "unknown"
            }
        
        if circuit is None:
            raise ValueError("No circuit found. Define a variable named 'circuit' or 'qc'")
        
        if not isinstance(circuit, QuantumCircuit):
            raise ValueError("'circuit' must be a QuantumCircuit object")
        
        # Add measurements if not present
        if circuit.num_clbits == 0:
            circuit.measure_all()
        
        # Run simulation
        simulator = AerSimulator()
        transpiled = transpile(circuit, simulator)
        job = simulator.run(transpiled, shots=request.shots)
        result = job.result()
        counts = result.get_counts()
        
        probabilities = {k: v / request.shots for k, v in counts.items()}
        
        return {
            "success": True,
            "counts": counts,
            "probabilities": probabilities,
            "shots": request.shots,
            "num_qubits": circuit.num_qubits,
            "circuit_depth": circuit.depth()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


def create_safe_environment():
    """
    Create a Python environment with pre-imported Qiskit modules
    """
    from qiskit import QuantumCircuit as QC
    from qiskit_aer import AerSimulator
    
    # Create a mock Aer that works like the real one
    class SafeAer:
        @staticmethod
        def get_backend(name):
            if name in ['qasm_simulator', 'aer_simulator', 'statevector_simulator']:
                return AerSimulator()
            raise ValueError(f"Backend '{name}' not available in sandbox")
    
    # Safe execute function
    def safe_execute(circuit, backend, shots=1024, **kwargs):
        if not isinstance(circuit, QC):
            raise ValueError("First argument must be a QuantumCircuit")
        transpiled = transpile(circuit, backend)
        return backend.run(transpiled, shots=shots)
    
    return {
        # Qiskit essentials
        "QuantumCircuit": QC,
        "Aer": SafeAer,
        "execute": safe_execute,
        "AerSimulator": AerSimulator,
        
        # Basic Python builtins (safe ones only)
        "range": range,
        "len": len,
        "print": lambda *args: None,  # Capture but don't output
        "list": list,
        "dict": dict,
        "int": int,
        "float": float,
        "str": str,
        "True": True,
        "False": False,
        "None": None,
        
        # Math
        "abs": abs,
        "min": min,
        "max": max,
        "sum": sum,
        "round": round,
        
        "__builtins__": {},  # Block dangerous builtins
    }


def preprocess_imports(code: str) -> str:
    """
    Remove import statements since we provide pre-imported modules
    """
    lines = code.split('\n')
    processed = []
    for line in lines:
        stripped = line.strip()
        # Skip import lines - we provide these pre-loaded
        if stripped.startswith('from qiskit') or stripped.startswith('import qiskit'):
            processed.append('# ' + line + '  # (pre-loaded)')
        elif stripped.startswith('from ') or stripped.startswith('import '):
            # Block other imports
            processed.append('# ' + line + '  # (blocked for security)')
        else:
            processed.append(line)
    return '\n'.join(processed)


def sanitize_code(code: str) -> str:
    """
    Remove potentially dangerous code
    """
    # Block dangerous operations
    dangerous_patterns = [
        r"import\s+os",
        r"import\s+sys",
        r"import\s+subprocess",
        r"__import__",
        r"eval\s*\(",
        r"exec\s*\(",
        r"open\s*\(",
        r"file\s*\(",
        r"input\s*\(",
        r"globals\s*\(",
        r"locals\s*\(",
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, code, re.IGNORECASE):
            raise ValueError(f"Forbidden operation detected: {pattern}")
    
    return code


# Get available gates
@app.get("/api/quantum/gates")
def get_gates():
    """
    Return list of available quantum gates
    """
    return {
        "single_qubit": [
            {"name": "H", "id": "h", "description": "Hadamard - Creates superposition"},
            {"name": "X", "id": "x", "description": "Pauli-X - Bit flip (NOT gate)"},
            {"name": "Y", "id": "y", "description": "Pauli-Y - Rotation around Y axis"},
            {"name": "Z", "id": "z", "description": "Pauli-Z - Phase flip"},
            {"name": "T", "id": "t", "description": "T gate - π/4 phase rotation"},
            {"name": "S", "id": "s", "description": "S gate - π/2 phase rotation"},
        ],
        "two_qubit": [
            {"name": "CNOT", "id": "cx", "description": "Controlled-NOT - Entanglement"},
            {"name": "CZ", "id": "cz", "description": "Controlled-Z - Phase entanglement"},
            {"name": "SWAP", "id": "swap", "description": "Swap qubit states"},
        ]
    }


# Example circuits
@app.get("/api/quantum/examples")
def get_examples():
    """
    Return example quantum circuits for learning
    """
    return {
        "examples": [
            {
                "name": "Bell State",
                "description": "Create an entangled pair of qubits",
                "code": """# Bell State - Quantum Entanglement
circuit = QuantumCircuit(2, 2)
circuit.h(0)      # Superposition on qubit 0
circuit.cx(0, 1)  # Entangle with qubit 1
circuit.measure([0, 1], [0, 1])
""",
                "gates": [
                    {"gate": "h", "qubits": [0]},
                    {"gate": "cx", "qubits": [0, 1]}
                ]
            },
            {
                "name": "Superposition",
                "description": "Put a qubit in superposition",
                "code": """# Superposition - 50/50 probability
circuit = QuantumCircuit(1, 1)
circuit.h(0)
circuit.measure(0, 0)
""",
                "gates": [
                    {"gate": "h", "qubits": [0]}
                ]
            },
            {
                "name": "GHZ State",
                "description": "3-qubit entangled state",
                "code": """# GHZ State - 3 entangled qubits
circuit = QuantumCircuit(3, 3)
circuit.h(0)
circuit.cx(0, 1)
circuit.cx(0, 2)
circuit.measure([0, 1, 2], [0, 1, 2])
""",
                "gates": [
                    {"gate": "h", "qubits": [0]},
                    {"gate": "cx", "qubits": [0, 1]},
                    {"gate": "cx", "qubits": [0, 2]}
                ]
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8092)
