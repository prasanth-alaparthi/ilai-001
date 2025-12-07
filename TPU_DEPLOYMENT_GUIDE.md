# Self-Hosting AI Models on Google Cloud TPU v5e

## ⚠️ CRITICAL PRICING WARNING
**Please double-check the pricing.**
The price of **₹87 (approx $1.04 USD)** for TPU v5e is **PER HOUR**, not per month.

*   **Hourly Cost:** ~₹100 ($1.20 USD)
*   **Daily Cost:** ~₹2,400 ($28.80 USD)
*   **Monthly Cost:** ~₹72,000 ($864 USD)

**DO NOT** leave this running 24/7 unless you are prepared for this bill.
For a cheaper alternative, consider:
1.  **Google Colab Pro** (fixed monthly fee, but not for production hosting).
2.  **Groq API** (Pay per token, much cheaper for low usage).
3.  **CPU/GPU Spot Instances** (Cheaper but less powerful).

---

## Overview
This guide explains how to provision a Google Cloud TPU v5e VM, deploy an open-source model (like Llama 3), and connect it to the Muse backend.

## Prerequisites
1.  **Google Cloud Project** with billing enabled.
2.  **TPU API Enabled**: Enable the "Cloud TPU API".
3.  **Quota**: You need quota for `TPU v5 Lite Pod` in your chosen region (e.g., `us-west1`, `us-east1`, or `asia-southeast1` if available).

## Step 1: Create the TPU VM
Run this command in your local terminal (with gcloud CLI installed) or Cloud Shell:

```bash
# Create a TPU v5e (1 chip) VM
gcloud compute tpus tpu-vm create muse-ai-node \
  --zone=us-west1-c \
  --accelerator-type=v5litepod-1 \
  --version=tpu-vm-pt-2.0 \
  --project=YOUR_PROJECT_ID
```

*Note: Change zone to where you have quota.*

## Step 2: SSH into the VM
```bash
gcloud compute tpus tpu-vm ssh muse-ai-node --zone=us-west1-c
```

## Step 3: Install Dependencies & Serving Engine
We recommend using **vLLM** or **JetStream** which offer OpenAI-compatible API servers. This makes integration with Muse easy.

Inside the TPU VM:
```bash
# Install vLLM (check for TPU-specific installation instructions as they change frequently)
pip install vllm

# Or use a Docker container (Recommended)
# Note: You might need to install Docker first
```

## Step 4: Run the Model Server
Run vLLM to serve Llama 3 (8B is good for a single chip).

```bash
python3 -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Meta-Llama-3-8B-Instruct \
  --port 8000 \
  --host 0.0.0.0
```

*Note: You will need a HuggingFace token to download Llama 3.*

## Step 5: Expose the Port
1.  Go to **VPC Network** > **Firewall**.
2.  Create a rule to allow **TCP 8000** from `0.0.0.0/0` (or restrict to your backend's IP).
3.  Get the **External IP** of your TPU VM.

## Step 6: Connect Muse Backend
Update your `muse-notes-service` configuration to point to your new TPU server instead of Groq.

**File:** `services/muse-notes-service/src/main/resources/application.properties`

```properties
# Point to your TPU VM IP
gemini.api.url=http://<YOUR_TPU_VM_IP>:8000/v1
# API Key can be anything if you haven't set up auth on vLLM
gemini.api.key=self-hosted
```

**File:** `AIController.java`
You might need to adjust the `groqModel` variable to match the model name you deployed (e.g., `meta-llama/Meta-Llama-3-8B-Instruct`).

## Alternative: Serverless (Cheaper for Low Usage)
If you don't have high traffic, running a dedicated TPU 24/7 is wasteful. Consider:
1.  **Vertex AI Endpoints**: Auto-scaling (scales to 0).
2.  **Groq / OpenAI**: Pay per token (cheaper for low volume).
