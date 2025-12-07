# Connecting Your Domain (ilai.co.in)

This guide explains how to connect your domain `ilai.co.in` to your new hybrid deployment.

## Scenario 1: Using Cloudflare for Everything (Recommended)

If you are using Cloudflare Pages for your frontend, the easiest way is to move your domain's DNS management to Cloudflare.

1.  **Add Site to Cloudflare**:
    *   Log in to your Cloudflare dashboard.
    *   Click **Add a Site** and enter `ilai.co.in`.
    *   Select the **Free Plan**.
    *   Cloudflare will scan your existing DNS records. Review them and click **Continue**.
    *   Cloudflare will give you two **Nameservers** (e.g., `bob.ns.cloudflare.com`).

2.  **Update Registrar**:
    *   Log in to where you bought your domain (GoDaddy, Namecheap, etc.).
    *   Find the **Nameservers** setting for `ilai.co.in`.
    *   Replace the existing nameservers with the two from Cloudflare.
    *   *Note: This can take up to 24 hours to propagate, but usually happens much faster.*

3.  **Connect Frontend (www.ilai.co.in)**:
    *   Go to **Cloudflare Pages** -> Your Project -> **Custom Domains**.
    *   Click **Set up a custom domain**.
    *   Enter `www.ilai.co.in` (and `ilai.co.in`).
    *   Cloudflare will automatically configure the DNS records for you.

4.  **Connect Backend (api.ilai.co.in)**:
    *   Go to **DNS** settings in Cloudflare for `ilai.co.in`.
    *   Add an **A Record**:
        *   **Name**: `api` (this creates `api.ilai.co.in`)
        *   **IPv4 Address**: [Your Google Cloud VM External IP]
        *   **Proxy status**: **Proxied** (Orange Cloud) - This gives you free SSL/HTTPS!

5.  **Update Frontend Code**:
    *   In `frontend/web/src/services/apiClient.js`, update the `baseURL` to:
        ```javascript
        baseURL: "https://api.ilai.co.in/api",
        ```
    *   Re-deploy your frontend.

---

## Scenario 2: Keeping DNS at Your Registrar

If you don't want to move your nameservers to Cloudflare:

1.  **Frontend (Cloudflare Pages)**:
    *   Go to your Cloudflare Pages project -> **Custom Domains**.
    *   Enter `ilai.co.in`.
    *   Cloudflare will give you a **CNAME** record to add.
    *   Go to your domain registrar's DNS settings and add that CNAME record pointing `www` to your Cloudflare Pages URL (e.g., `ilai.pages.dev`).

2.  **Backend (Google Cloud)**:
    *   Go to your domain registrar's DNS settings.
    *   Add an **A Record**:
        *   **Host/Name**: `api`
        *   **Value/IP**: [Your Google Cloud VM External IP]
    *   *Note: You won't get automatic SSL this way. You will need to install Nginx and Certbot (Let's Encrypt) on your Google Cloud VM to get HTTPS.*
