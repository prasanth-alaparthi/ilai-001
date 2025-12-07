# Hybrid Cloud Deployment Guide

This guide explains how to deploy Ilai using a modern, hybrid cloud approach. This splits your application into three parts for better performance and easier management.

## The Stack
1.  **Frontend**: Hosted on **Cloudflare Pages** (Free, extremely fast, global CDN).
2.  **Database**: Hosted on **Supabase** or **Neon** (Managed PostgreSQL, generous free tier).
3.  **Backend**: Hosted on **Google Cloud Compute Engine** (Virtual Machine) running Docker.

---

## Part 1: The Database (Supabase)

1.  Go to [supabase.com](https://supabase.com/) and create a free account.
2.  Create a new project.
3.  Once created, go to **Project Settings** -> **Database**.
4.  Copy the **Connection String (URI)**. It looks like:
    `postgresql://postgres:[YOUR-PASSWORD]@db.ref.supabase.co:5432/postgres`
5.  Save this string. You will need it for your backend configuration.

---

## Part 2: The Backend (Google Cloud)

Since you have 5 microservices, the easiest way to run them on Google Cloud is using a **Compute Engine** VM.

1.  **Create a VM**:
    *   Go to Google Cloud Console -> **Compute Engine**.
    *   Create an Instance.
    *   **Region**: Choose one close to you (e.g., `asia-south1` for Mumbai).
    *   **Machine Type**: `e2-standard-2` (2 vCPU, 8GB memory) is recommended for Java microservices.
    *   **OS**: Ubuntu 22.04 LTS.
    *   **Firewall**: Allow HTTP and HTTPS traffic.

2.  **Setup the Server**:
    *   Click **SSH** to connect to your new VM.
    *   Install Docker:
        ```bash
        sudo apt update
        sudo apt install -y docker.io docker-compose
        ```

3.  **Deploy Code**:
    *   Clone your repository or copy your project files to the VM.
    *   Create a `.env` file in the project root on the server.
    *   **Crucial Step**: Update `DB_URL` in your `.env` (or `docker-compose.yml`) to point to your **Supabase** database instead of the local `postgres` container.
    *   Run the backend:
        ```bash
        sudo docker-compose up -d --build
        ```
    *   *Note: You can remove the `postgres` service from `docker-compose.yml` since you are using Supabase.*

4.  **Get Public IP**:
    *   Note the **External IP** of your VM from the Google Cloud Console.
    *   Your backend API is now accessible at `http://[YOUR-VM-IP]`.

---

## Part 3: The Frontend (Cloudflare Pages)

1.  **Prepare Code**:
    *   Open `frontend/web/src/services/apiClient.js`.
    *   Change the `baseURL` to point to your Google Cloud VM IP:
        ```javascript
        // Replace with your actual Google Cloud VM IP
        baseURL: "http://[YOUR-VM-IP]/api", 
        ```
    *   Commit and push your changes to GitHub.

2.  **Deploy**:
    *   Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**.
    *   Click **Create Application** -> **Pages** -> **Connect to Git**.
    *   Select your GitHub repository.
    *   **Build Settings**:
        *   **Framework Preset**: Vite / React
        *   **Build Command**: `npm run build`
        *   **Output Directory**: `dist`
    *   Click **Save and Deploy**.

## Summary
- Your users will visit your site via the **Cloudflare** URL (fast!).
- The frontend will talk to your backend on **Google Cloud**.
- Your backend will store data in **Supabase**.
