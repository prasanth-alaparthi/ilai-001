# GoDaddy Domain Guide: Purchase & Connection

You asked: *"I am taking domain in GoDaddy, is it ok and what is the process?"*

**Yes, GoDaddy is perfectly fine.** They are one of the largest domain registrars in the world. They are reliable and have good support.

Here is the step-by-step process to buy your domain and connect it to your Muse app (Firebase).

---

## Part 1: Buying the Domain

1.  **Search**: Go to [GoDaddy.com](https://www.godaddy.com/) and type in your desired name (e.g., `musescholar.com`).
2.  **Select**: If it's available, click **Add to Cart**.
3.  **Checkout**: Click **Continue to Cart**.
    *   ⚠️ **Watch out for Upsells**: GoDaddy will try to sell you "Domain Protection", "Email", and "Website Builder".
    *   **Domain Protection**: Optional. "Full Domain Protection" hides your personal info (Whois Privacy). Recommended if you don't want spam calls, but not strictly necessary for the app to work.
    *   **Email**: Skip for now (you can add it later).
    *   **Website Builder**: **NO**. Uncheck this. You are building your own app!
4.  **Term**: Select "1 Year" (or more if you want to lock it in).
5.  **Pay**: Complete the payment.

---

## Part 2: Connecting to Firebase (The Important Part)

Once you own the domain, you need to point it to your Firebase app.

### 1. Start in Firebase
1.  Go to **Firebase Console** -> **Hosting**.
2.  Click **Add Custom Domain**.
3.  Enter your new domain (e.g., `musescholar.com`).
4.  Click **Continue**. Firebase will show you a **TXT Record** (e.g., `google-site-verification=...`).

### 2. Configure GoDaddy DNS
1.  Log in to GoDaddy.
2.  Go to **My Products**.
3.  Find your domain and click **DNS** (or "Manage DNS").
4.  **Add the TXT Record**:
    *   Click **Add New Record**.
    *   **Type**: `TXT`
    *   **Name**: `@`
    *   **Value**: Paste the `google-site-verification=...` string from Firebase.
    *   **TTL**: `1 Hour` (or default).
    *   Click **Save**.
5.  **Verify in Firebase**:
    *   Go back to Firebase and click **Verify**. (It might take a few minutes).

### 3. Point Traffic (A Records)
Once verified, Firebase will give you **two IP addresses** (A Records).

1.  Back in GoDaddy DNS:
2.  **Delete** any existing `A` records with Name `@` (if they point to a "Parked" page).
3.  **Add First A Record**:
    *   **Type**: `A`
    *   **Name**: `@`
    *   **Value**: `199.36.158.100` (Copy the exact IP Firebase gives you).
    *   **TTL**: `1 Hour`.
4.  **Add Second A Record**:
    *   **Type**: `A`
    *   **Name**: `@`
    *   **Value**: `199.36.158.101` (Copy the exact IP Firebase gives you).
5.  Click **Save**.

### 4. Done!
Wait roughly 1 hour. Firebase will issue an SSL certificate, and your site will be live at `https://musescholar.com`!
