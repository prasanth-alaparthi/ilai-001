/**
 * ILAI Hyper Platform - Quantum Worker
 * 
 * Web Worker for parallel quantum simulation.
 * Receives gate chunks and applies them to shared state.
 * 
 * NOTE: Uses direct Float64Array access since Atomics only supports
 * integer typed arrays. For true thread safety, use locks or
 * process non-overlapping state ranges per worker.
 */

// Handle messages from main thread
self.onmessage = async (event) => {
    const { type, gates, qubits, stateBuffer, chunkIndex } = event.data;

    if (type === 'SIMULATE') {
        try {
            const state = new Float64Array(stateBuffer);

            // Apply gates sequentially within this chunk
            for (const gate of gates) {
                applyGate(gate, state, qubits);
            }

            self.postMessage({
                result: {
                    chunkIndex,
                    completed: true
                }
            });
        } catch (error) {
            self.postMessage({
                error: error.message
            });
        }
    }
};

/**
 * Apply a quantum gate
 */
function applyGate(gate, state, qubits) {
    const { type, target, control } = gate;
    const stateSize = Math.pow(2, qubits);

    switch (type) {
        case 'H':
            applyHadamard(state, target, stateSize);
            break;
        case 'X':
            applyPauliX(state, target, stateSize);
            break;
        case 'Y':
            applyPauliY(state, target, stateSize);
            break;
        case 'Z':
            applyPauliZ(state, target, stateSize);
            break;
        case 'CNOT':
            applyCNOT(state, control, target, stateSize);
            break;
        case 'T':
            applyTGate(state, target, stateSize);
            break;
        case 'S':
            applySGate(state, target, stateSize);
            break;
        case 'RX':
            applyRX(state, target, gate.angle, stateSize);
            break;
        case 'RY':
            applyRY(state, target, gate.angle, stateSize);
            break;
        case 'RZ':
            applyRZ(state, target, gate.angle, stateSize);
            break;
    }
}

// Gate implementations - using direct array access (not Atomics)
// SharedArrayBuffer provides memory sharing, gates are applied sequentially per chunk
function applyHadamard(state, target, stateSize) {
    const factor = 1 / Math.sqrt(2);
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) continue;
        const j = i | (1 << target);
        const realI = state[i * 2];
        const imagI = state[i * 2 + 1];
        const realJ = state[j * 2];
        const imagJ = state[j * 2 + 1];

        state[i * 2] = factor * (realI + realJ);
        state[i * 2 + 1] = factor * (imagI + imagJ);
        state[j * 2] = factor * (realI - realJ);
        state[j * 2 + 1] = factor * (imagI - imagJ);
    }
}

function applyPauliX(state, target, stateSize) {
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) continue;
        const j = i | (1 << target);
        const tempReal = state[i * 2];
        const tempImag = state[i * 2 + 1];
        state[i * 2] = state[j * 2];
        state[i * 2 + 1] = state[j * 2 + 1];
        state[j * 2] = tempReal;
        state[j * 2 + 1] = tempImag;
    }
}

function applyPauliY(state, target, stateSize) {
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) continue;
        const j = i | (1 << target);
        const realI = state[i * 2];
        const imagI = state[i * 2 + 1];
        const realJ = state[j * 2];
        const imagJ = state[j * 2 + 1];

        state[i * 2] = imagJ;
        state[i * 2 + 1] = -realJ;
        state[j * 2] = -imagI;
        state[j * 2 + 1] = realI;
    }
}

function applyPauliZ(state, target, stateSize) {
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) {
            state[i * 2] = -state[i * 2];
            state[i * 2 + 1] = -state[i * 2 + 1];
        }
    }
}

function applyCNOT(state, control, target, stateSize) {
    for (let i = 0; i < stateSize; i++) {
        if (!((i >> control) & 1)) continue;
        if ((i >> target) & 1) continue;
        const j = i | (1 << target);
        const tempReal = state[i * 2];
        const tempImag = state[i * 2 + 1];
        state[i * 2] = state[j * 2];
        state[i * 2 + 1] = state[j * 2 + 1];
        state[j * 2] = tempReal;
        state[j * 2 + 1] = tempImag;
    }
}

function applyTGate(state, target, stateSize) {
    const cos = Math.cos(Math.PI / 4);
    const sin = Math.sin(Math.PI / 4);
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) {
            const real = state[i * 2];
            const imag = state[i * 2 + 1];
            state[i * 2] = cos * real - sin * imag;
            state[i * 2 + 1] = sin * real + cos * imag;
        }
    }
}

function applySGate(state, target, stateSize) {
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) {
            const real = state[i * 2];
            const imag = state[i * 2 + 1];
            state[i * 2] = -imag;
            state[i * 2 + 1] = real;
        }
    }
}

function applyRX(state, target, angle, stateSize) {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) continue;
        const j = i | (1 << target);
        const realI = state[i * 2];
        const imagI = state[i * 2 + 1];
        const realJ = state[j * 2];
        const imagJ = state[j * 2 + 1];

        state[i * 2] = cos * realI + sin * imagJ;
        state[i * 2 + 1] = cos * imagI - sin * realJ;
        state[j * 2] = cos * realJ + sin * imagI;
        state[j * 2 + 1] = cos * imagJ - sin * realI;
    }
}

function applyRY(state, target, angle, stateSize) {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    for (let i = 0; i < stateSize; i++) {
        if ((i >> target) & 1) continue;
        const j = i | (1 << target);
        const realI = state[i * 2];
        const imagI = state[i * 2 + 1];
        const realJ = state[j * 2];
        const imagJ = state[j * 2 + 1];

        state[i * 2] = cos * realI - sin * realJ;
        state[i * 2 + 1] = cos * imagI - sin * imagJ;
        state[j * 2] = sin * realI + cos * realJ;
        state[j * 2 + 1] = sin * imagI + cos * imagJ;
    }
}

function applyRZ(state, target, angle, stateSize) {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    for (let i = 0; i < stateSize; i++) {
        const phase = ((i >> target) & 1) ? sin : -sin;
        const real = state[i * 2];
        const imag = state[i * 2 + 1];
        state[i * 2] = cos * real + phase * imag;
        state[i * 2 + 1] = cos * imag - phase * real;
    }
}

console.log('[Quantum Worker] Ready');
