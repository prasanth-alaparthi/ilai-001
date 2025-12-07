# Connecting `ilai.co.in` to Firebase

Congratulations on getting **ilai.co.in**! That is a great, short name.

Here are the exact steps to connect it to your app.

## Phase 1: Firebase Console

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Go to **Hosting**.
3.  Click **Add Custom Domain**.
4.  Enter `ilai.co.in`.
5.  Check the box **"Redirect www.ilai.co.in to ilai.co.in"**.
6.  Click **Continue**.
7.  Firebase will show you a **TXT Record** (looks like `google-site-verification=...`). **Copy this.**

## Phase 2: DNS Settings (GoDaddy)

1.  Log in to your GoDaddy account.
2.  Go to **My Products** > **Domains**.
3.  Find `ilai.co.in` and click **DNS** (or "Manage DNS").
4.  **Add the TXT Record:**
    *   Click **Add New Record**.
    *   Type: **TXT**
    *   Name: **@**
    *   Value: **[Paste the google-site-verification code here]**
    *   TTL: **1 Hour** (or default)
    *   Click **Save**.

5.  **Go back to Firebase** and click **Verify**.
    *   *Note: If it fails, wait 5 minutes and try again.*

## Phase 3: Pointing the Traffic

Once verified, Firebase will show you **two IP addresses** (A Records).

1.  Back in GoDaddy DNS:
2.  **Delete** any existing "A" records for `@` (if they exist).
3.  **Add First IP:**
    *   Type: **A**
    *   Name: **@**
    *   Value: **[First IP from Firebase]**
    *   TTL: **1 Hour**
4.  **Add Second IP:**
    *   Type: **A**
    *   Name: **@**
    *   Value: **[Second IP from Firebase]**
    *   TTL: **1 Hour**
5.  Click **Save**.

## Phase 4: You're Done!

*   Wait about **1 hour** for the SSL certificate to generate.
*   Your app will be live at `https://ilai.co.in`.
*   Your API will be at `https://ilai.co.in/api`.

---

## Important: Production Config

I have already created a `.env.production` file for you with the correct setting:

```env
VITE_API_BASE_URL=https://ilai.co.in/api
```

When you run `npm run build`, Vite will automatically use this URL so your frontend knows where to talk to the backend!
