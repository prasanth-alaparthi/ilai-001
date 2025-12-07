# Google Cloud Backend Setup Guide

This guide details how to host your backend microservices on Google Cloud Platform (GCP) using a Compute Engine Virtual Machine (VM).

## Prerequisites
- A Google Cloud account (you get $300 free credit as a new user).
- Your project code pushed to GitHub (or ready to upload).
- A Supabase database connection string (from the previous step).

---

## Step 1: Create a Virtual Machine (VM)

1.  **Go to Console**: Log in to [console.cloud.google.com](https://console.cloud.google.com/).
2.  **Create Project**: Click the project dropdown (top left) -> **New Project**. Name it `ilai-backend`.
3.  **Navigate to Compute Engine**:
    *   In the search bar, type "Compute Engine" and verify the API is enabled.
    *   Go to **VM Instances**.
4.  **Create Instance**:
    *   Click **Create Instance**.
    *   **Name**: `ilai-server`.
    *   **Region**: Select a region close to your users (e.g., `asia-south1` for Mumbai).
    *   **Machine Configuration**:
        *   Series: **E2**
        *   Machine type: **e2-standard-2** (2 vCPU, 8 GB memory). *Note: Java services need RAM. 4GB might be tight for 5 services + DB, so 8GB is safer.*
    *   **Boot Disk**:
        *   Click **Change**.
        *   Operating System: **Ubuntu**.
        *   Version: **Ubuntu 22.04 LTS**.
        *   Size: **20 GB** (Standard Persistent Disk).
    *   **Firewall**:
        *   Check **Allow HTTP traffic**.
        *   Check **Allow HTTPS traffic**.
    *   Click **Create**.

---

## Step 2: Configure Firewall (Crucial)

By default, Google Cloud only allows port 80 (HTTP) and 443 (HTTPS). Since we are using Nginx as our gateway on port 80, this is perfect! We don't need to open ports 8081-8085 publicly.

---

## Step 3: Connect and Install Docker

1.  **SSH into VM**:
    *   In the VM Instances list, click the **SSH** button next to your `ilai-server`.
    *   A terminal window will open.

2.  **Install Docker**:
    Copy and paste these commands into the SSH window:

    ```bash
    # Update package list
    sudo apt update

    # Install Docker and Compose
    sudo apt install -y docker.io docker-compose

    # Start Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    ```

---

## Step 4: Deploy Your Code

1.  **Clone Your Repository**:
    *   If your code is on GitHub (replace with your repo URL):
        ```bash
        git clone https://github.com/YOUR_USERNAME/Muse-004.git
        cd Muse-004
        ```
    *   *Alternative*: If not on GitHub, you can upload files using the "Upload file" button in the SSH window (gear icon -> Upload file), but Git is much easier.

2.  **Configure Environment**:
    *   Create the `.env` file:
        ```bash
        nano .env
        ```
    *   Paste your environment variables. **Make sure to use your Supabase DB URL**:
        ```env
        DB_USERNAME=postgres
        DB_PASSWORD=[YOUR_SUPABASE_PASSWORD]
        # Use the Supabase connection string, but ensure port is 5432 and host is correct
        # Example: jdbc:postgresql://db.ref.supabase.co:5432/postgres
        DB_URL=jdbc:postgresql://[SUPABASE_HOST]:5432/postgres
        
        JWT_SECRET=your_super_secret_key_123
        JWT_ACCESS_SECRET=your_access_secret_key_456
        JWT_REFRESH_SECRET=your_refresh_secret_key_789
        GEMINI_API_KEY=your_google_ai_key
        ```
    *   Press `Ctrl+X`, then `Y`, then `Enter` to save.

3.  **Build and Run**:
    ```bash
    # Build the JAR files (skip if you uploaded built JARs, but usually you build on server or use a Docker multi-stage build)
    # Since our Dockerfiles expect JARs, we need to build them first.
    # Installing Maven on the server:
    sudo apt install -y maven
    
    # Build all services
    mvn clean package -DskipTests -f services/muse-auth-service/pom.xml
    mvn clean package -DskipTests -f services/muse-notes-service/pom.xml
    mvn clean package -DskipTests -f services/muse-feed-service/pom.xml
    mvn clean package -DskipTests -f services/muse-parental-service/pom.xml
    mvn clean package -DskipTests -f services/muse-journal-service/pom.xml
    
    # Start the containers
    sudo docker-compose up -d --build
    ```

---

## Step 5: Verify

1.  **Check Status**:
    ```bash
    sudo docker-compose ps
    ```
    You should see all services (auth, notes, feed, parental, journal, frontend) with status `Up`.

2.  **Get Public IP**:
    *   Go back to Google Cloud Console.
    *   Copy the **External IP** of your VM (e.g., `34.123.45.67`).

3.  **Test API**:
    *   Open your browser and try: `http://34.123.45.67/api/auth/me` (it might return 401 or 403, which is good—it means the server is reachable!).

---

## Step 6: Connect Domain (Final Step)

Now that your backend is running at `http://[YOUR-VM-IP]`, go back to the **Cloudflare** guide (`DOMAIN_SETUP.md`) and point your `api.ilai.co.in` DNS record to this IP address.
