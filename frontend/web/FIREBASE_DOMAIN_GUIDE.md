# How to Connect a Custom Domain in Firebase Hosting

Firebase Hosting does not sell domains directly. You typically buy your domain (like `muse.com`) from a **Domain Registrar** (like GoDaddy, Namecheap, Google Domains/Squarespace, or Cloudflare) and then **connect** it to Firebase.

Here is the step-by-step process.

---

## Step 1: Buy Your Domain
If you haven't already, purchase `muse.com` from a registrar.
*   **Popular Registrars**: Namecheap, GoDaddy, Cloudflare, Squarespace.
*   *Note: Google Domains has been sold to Squarespace, so you might be redirected there.*

---

## Step 2: Connect Domain in Firebase Console

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**Muse**).
3.  In the left sidebar, click on **Hosting**.
4.  Click the **Add Custom Domain** button.
5.  Enter your domain name: `muse.com`.
6.  Check the box "Redirect `www.muse.com` to `muse.com`" (recommended) or add `www.muse.com` separately later if you want them to be the same.
7.  Click **Continue**.

---

## Step 3: Verify Ownership (DNS Records)

Firebase needs to prove you own the domain. It will show you a **TXT Record** to add to your DNS settings.

1.  **Log in** to your Domain Registrar (where you bought the domain).
2.  Find the **DNS Settings** or **DNS Management** page for your domain.
3.  **Add a New Record**:
    *   **Type**: `TXT`
    *   **Host/Name**: `@` (or leave blank)
    *   **Value/Content**: Paste the string provided by Firebase (looks like `google-site-verification=...`).
    *   **TTL**: Default or 3600.
4.  Save the record.
5.  Go back to Firebase Console and click **Verify**.
    *   *Note: This might take a few minutes to propagate.*

---

## Step 4: Point Domain to Firebase (A Records)

Once verified, Firebase will give you **A Records** (IP addresses) to point your domain traffic to their servers.

1.  In your Registrar's DNS Settings:
2.  **Delete** any existing A records for `@` or `www` if they point to "parked" pages.
3.  **Add the A Records** provided by Firebase. Usually, there are two IP addresses.
    *   **Record 1**:
        *   Type: `A`
        *   Host: `@`
        *   Value: `199.36.158.100` (Example - use the one Firebase gives you!)
    *   **Record 2**:
        *   Type: `A`
        *   Host: `@`
        *   Value: `199.36.158.101` (Example - use the one Firebase gives you!)
4.  Save the records.

---

## Step 5: Wait for SSL (HTTPS)

*   Once the DNS changes propagate (can take 1 hour to 24 hours, but usually fast), Firebase will automatically provision a **free SSL Certificate** for you.
*   Your site will be accessible at `https://muse.com`.

---

## Summary
1.  **Buy** domain at a Registrar.
2.  **Add** domain in Firebase Console.
3.  **Add TXT record** at Registrar to verify ownership.
4.  **Add A records** at Registrar to point traffic to Firebase.
