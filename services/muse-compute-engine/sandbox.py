"""
Docker Sandbox Executor
Secure Python execution with resource limits:
- 256MB RAM
- 0.5 CPU
- No network access
- 10 second timeout
"""

import subprocess
import tempfile
import os
import shutil
from typing import Dict, Any, Optional
import asyncio


# Check if Docker is available
def is_docker_available() -> bool:
    try:
        result = subprocess.run(
            ["docker", "version"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except:
        return False


DOCKER_AVAILABLE = is_docker_available()

# Sandbox configuration
SANDBOX_CONFIG = {
    "image": "python:3.11-slim",
    "memory_limit": "256m",
    "cpu_quota": 50000,      # 0.5 CPU (out of 100000)
    "cpu_period": 100000,
    "timeout": 10,           # seconds
    "network_disabled": True,
    "read_only": True,
    "no_new_privileges": True
}


async def run_sandboxed_python(code: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Execute Python code in a Docker container with strict resource limits.
    
    Args:
        code: Python code to execute
        timeout: Maximum execution time in seconds
    
    Returns:
        Dict with stdout, stderr, return_code, and execution info
    """
    if not DOCKER_AVAILABLE:
        return {
            "success": False,
            "error": "Docker not available on this system",
            "fallback": True
        }
    
    # Create temporary file for code
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        code_file = f.name
    
    try:
        # Build Docker command
        docker_cmd = [
            "docker", "run",
            "--rm",                                    # Auto-remove container
            f"--memory={SANDBOX_CONFIG['memory_limit']}",
            f"--memory-swap={SANDBOX_CONFIG['memory_limit']}",  # No swap
            f"--cpu-period={SANDBOX_CONFIG['cpu_period']}",
            f"--cpu-quota={SANDBOX_CONFIG['cpu_quota']}",
            "--network=none",                          # No network
            "--read-only",                             # Read-only filesystem
            "--security-opt=no-new-privileges",        # No privilege escalation
            "--pids-limit=50",                         # Limit processes
            "-v", f"{code_file}:/app/script.py:ro",    # Mount code read-only
            SANDBOX_CONFIG['image'],
            "python", "/app/script.py"
        ]
        
        # Run with timeout
        process = await asyncio.create_subprocess_exec(
            *docker_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode('utf-8', errors='replace'),
                "stderr": stderr.decode('utf-8', errors='replace'),
                "return_code": process.returncode,
                "sandboxed": True,
                "limits": {
                    "memory": SANDBOX_CONFIG['memory_limit'],
                    "cpu": "0.5",
                    "network": "disabled"
                }
            }
            
        except asyncio.TimeoutError:
            # Kill the process
            process.kill()
            await process.wait()
            
            return {
                "success": False,
                "error": f"Execution timed out after {timeout} seconds",
                "timeout": True,
                "sandboxed": True
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "sandboxed": True
        }
    finally:
        # Clean up temp file
        try:
            os.unlink(code_file)
        except:
            pass


def run_sandboxed_python_sync(code: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Synchronous wrapper for sandboxed Python execution
    """
    if not DOCKER_AVAILABLE:
        # Fallback to restricted local execution
        return run_restricted_local(code, timeout)
    
    return asyncio.run(run_sandboxed_python(code, timeout))


def run_restricted_local(code: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Fallback: Run code locally with restrictions when Docker unavailable.
    LESS SECURE - use only for development/testing.
    """
    # Forbidden imports and operations
    forbidden = [
        'import os', 'import sys', 'import subprocess', 'import socket',
        'import requests', 'import urllib', 'open(', 'exec(', 'eval(',
        '__import__', 'compile(', 'globals(', 'locals(',
        'import shutil', 'import pathlib'
    ]
    
    for f in forbidden:
        if f in code:
            return {
                "success": False,
                "error": f"Forbidden operation: {f}",
                "sandboxed": False,
                "restricted": True
            }
    
    try:
        # Create a restricted globals dict
        safe_globals = {
            '__builtins__': {
                'print': print,
                'range': range,
                'len': len,
                'str': str,
                'int': int,
                'float': float,
                'list': list,
                'dict': dict,
                'tuple': tuple,
                'set': set,
                'bool': bool,
                'abs': abs,
                'min': min,
                'max': max,
                'sum': sum,
                'sorted': sorted,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
                'round': round,
                'pow': pow,
                'True': True,
                'False': False,
                'None': None,
            }
        }
        
        # Capture stdout
        import io
        import sys
        old_stdout = sys.stdout
        sys.stdout = captured = io.StringIO()
        
        try:
            exec(code, safe_globals)
            stdout = captured.getvalue()
            
            return {
                "success": True,
                "stdout": stdout,
                "stderr": "",
                "return_code": 0,
                "sandboxed": False,
                "restricted": True,
                "warning": "Running in restricted local mode - less secure than Docker"
            }
        finally:
            sys.stdout = old_stdout
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "sandboxed": False,
            "restricted": True
        }


# Prebuilt safe code templates
SAFE_TEMPLATES = {
    "numpy_demo": """
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
print(f"Mean: {np.mean(arr)}")
print(f"Std: {np.std(arr)}")
""",
    "sympy_solve": """
from sympy import symbols, solve
x = symbols('x')
solutions = solve(x**2 - 4, x)
print(f"Solutions: {solutions}")
""",
    "matplotlib_plot": """
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
x = np.linspace(0, 10, 100)
plt.plot(x, np.sin(x))
plt.savefig('/tmp/plot.png')
print("Plot saved")
"""
}
