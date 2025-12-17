import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense Ad Component
 * 
 * SETUP INSTRUCTIONS:
 * 1. Sign up at https://www.google.com/adsense/
 * 2. Add your site and get approved
 * 3. Get your Publisher ID (ca-pub-XXXXXXXXXX)
 * 4. Add the AdSense script to index.html:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
 * 5. Replace ADSENSE_CLIENT and slot IDs below
 */

// TODO: Replace with your AdSense Publisher ID
const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXXXX';

// Slot IDs for different ad placements
const AD_SLOTS = {
  feedNative: 'XXXXXXXXXX',      // In-feed native ad
  feedBanner: 'XXXXXXXXXX',      // Banner in feed
  sidebar: 'XXXXXXXXXX',         // Sidebar ad
  articleBottom: 'XXXXXXXXXX',   // Below article content
};

export function FeedAd({ slot = 'feedNative', style = {} }) {
  const adRef = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Only load ad once
    if (isLoaded.current) return;
    
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  const slotId = AD_SLOTS[slot] || AD_SLOTS.feedNative;

  return (
    <div className="ad-container" style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />
      <style>{`
        .ad-container {
          width: 100%;
          min-height: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          overflow: hidden;
          margin: 16px 0;
        }

        .ad-container ins {
          width: 100%;
        }

        .ad-label {
          position: absolute;
          top: 4px;
          left: 8px;
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

export function BannerAd({ slot = 'feedBanner' }) {
  const adRef = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className="banner-ad-container">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={AD_SLOTS[slot]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <style>{`
        .banner-ad-container {
          width: 100%;
          min-height: 90px;
          margin: 20px 0;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export function SidebarAd() {
  const adRef = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className="sidebar-ad-container">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={AD_SLOTS.sidebar}
        data-ad-format="auto"
      />
      <style>{`
        .sidebar-ad-container {
          width: 300px;
          min-height: 250px;
          margin: 20px 0;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// Placeholder ad for development/testing (when AdSense not configured)
export function PlaceholderAd({ type = 'native' }) {
  return (
    <div className={`placeholder-ad ${type}`}>
      <div className="ad-label">Sponsored</div>
      <div className="ad-content">
        <div className="ad-icon">📢</div>
        <div className="ad-text">
          <p className="ad-title">Advertisement Space</p>
          <p className="ad-desc">Configure AdSense to show real ads here</p>
        </div>
      </div>
      <style>{`
        .placeholder-ad {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
          border: 1px dashed rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          position: relative;
        }

        .placeholder-ad .ad-label {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 10px;
          color: #8b5cf6;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .placeholder-ad .ad-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .placeholder-ad .ad-icon {
          font-size: 32px;
        }

        .placeholder-ad .ad-title {
          color: #e2e8f0;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .placeholder-ad .ad-desc {
          color: #a0aec0;
          font-size: 13px;
          margin: 0;
        }

        .placeholder-ad.banner {
          text-align: center;
          padding: 24px;
        }

        .placeholder-ad.banner .ad-content {
          justify-content: center;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}

// Helper to check if AdSense is configured
export function isAdSenseConfigured() {
  return ADSENSE_CLIENT !== 'ca-pub-XXXXXXXXXXXXXXXXXX' && 
         typeof window !== 'undefined' && 
         window.adsbygoogle;
}

// Smart Ad component that shows placeholder if AdSense not configured
export default function Ad({ type = 'native', slot, style }) {
  if (!isAdSenseConfigured()) {
    return <PlaceholderAd type={type} />;
  }

  switch (type) {
    case 'banner':
      return <BannerAd slot={slot} />;
    case 'sidebar':
      return <SidebarAd />;
    default:
      return <FeedAd slot={slot} style={style} />;
  }
}
