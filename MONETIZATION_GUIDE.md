# Monetization Guide: Running Ads on Ilai

This guide explains how to integrate advertisements into your React application to generate revenue. The most popular and easiest network to start with is **Google AdSense**.

## Option 1: Google AdSense (Recommended)

### Step 1: Sign Up
1.  Go to [Google AdSense](https://adsense.google.com/).
2.  Sign up with your Google account.
3.  Add your site: `ilai.co.in`.
4.  Google will give you a **verification script**.

### Step 2: Add Script to `index.html`
Open `frontend/web/index.html` and paste the script tag inside the `<head>` section.

```html
<head>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
     crossorigin="anonymous"></script>
  <!-- ... other tags ... -->
</head>
```
*Replace `YOUR_PUBLISHER_ID` with the ID from your AdSense dashboard.*

### Step 3: Create an Ad Component
Create a reusable component to place ads anywhere in your app.

**File**: `frontend/web/src/components/ui/AdBanner.jsx`

```jsx
import React, { useEffect } from 'react';

export default function AdBanner({ dataAdSlot }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div className="my-4 flex justify-center overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
      <ins className="adsbygoogle"
           style={{ display: 'block', minWidth: '300px', minHeight: '250px' }}
           data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
           data-ad-slot={dataAdSlot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
```

### Step 4: Place Ads in Your App
Good places to put ads without ruining the user experience:
1.  **Feed**: Between posts (e.g., every 5th post).
2.  **Sidebar**: At the bottom of the navigation sidebar.
3.  **Home Dashboard**: A banner at the top or bottom.

**Example: Adding to Feed (`frontend/web/src/pages/feed.jsx`)**

```jsx
import AdBanner from '../components/ui/AdBanner';

// Inside your map function:
{posts.map((post, index) => (
  <React.Fragment key={post.id}>
    <PostCard post={post} />
    {/* Show ad after every 5th post */}
    {(index + 1) % 5 === 0 && (
      <AdBanner dataAdSlot="1234567890" />
    )}
  </React.Fragment>
))}
```

---

## Option 2: Carbon Ads (For Tech Audiences)
If your users are developers or tech-savvy, **Carbon Ads** is cleaner and more "premium" looking.
- **Pros**: Looks beautiful, high quality ads.
- **Cons**: Harder to get accepted (you need traffic first).

## Option 3: Sponsored Content
Since you have a "Feed" and "Journal", you can build your own native ad system.
- **How**: Create a "Sponsored Post" type in your database.
- **Revenue**: Charge companies directly to pin a post in the feed.
- **Benefit**: No Google taking a 30-40% cut.

## Important Tips
1.  **Don't Overdo It**: Too many ads will make users leave.
2.  **Mobile Friendly**: Ensure your ads don't break the layout on phones.
3.  **Privacy Policy**: You MUST update your Privacy Policy to say you use cookies for ads (GDPR/CCPA compliance).
