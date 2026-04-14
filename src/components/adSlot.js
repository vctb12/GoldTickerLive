/**
 * components/adSlot.js
 * Lazy-loading Google AdSense ad slot component.
 * - Reserves fixed space before ad loads (prevents CLS)
 * - Uses IntersectionObserver for lazy load
 * - Skips on admin pages
 * - Placeholder publisher ID: ca-pub-XXXXXXXXXX (to be replaced)
 */

const AD_PUBLISHER_ID = 'ca-pub-8578581906562588';

const AD_DIMENSIONS = {
  leaderboard: { width: 728, height: 90, mobileWidth: 320, mobileHeight: 50 },
  rectangle: { width: 300, height: 250, mobileWidth: 300, mobileHeight: 250 },
  skyscraper: { width: 160, height: 600, mobileWidth: 0, mobileHeight: 0 },
};

const isMobile = () => window.innerWidth < 768;
const isAdminPage = () => window.location.pathname.includes('/admin');

/**
 * Render an AdSense slot in the given container.
 * @param {string} containerId  ID of the container element
 * @param {'leaderboard'|'rectangle'|'skyscraper'} adFormat
 * @param {string} adSlotId   AdSense slot ID (from AdSense dashboard)
 */
export function renderAdSlot(containerId, adFormat = 'rectangle', adSlotId = '') {
  if (isAdminPage()) return;
  if (typeof IntersectionObserver === 'undefined') return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const dims = AD_DIMENSIONS[adFormat];
  if (!dims) return;

  const mobile = isMobile();
  const w = mobile && dims.mobileWidth ? dims.mobileWidth : dims.width;
  const h = mobile && dims.mobileHeight ? dims.mobileHeight : dims.height;

  if (w === 0) return; // skyscraper hidden on mobile

  // Reserve space before ad loads to prevent CLS
  container.style.minHeight = h + 'px';
  container.style.width = '100%';
  container.style.maxWidth = w + 'px';
  container.style.margin = '0 auto';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.background = '#f8fafc';
  container.style.border = '1px solid #f1f5f9';
  container.style.borderRadius = '4px';
  container.style.overflow = 'hidden';
  container.setAttribute('aria-label', 'Advertisement');
  container.dataset.adFormat = adFormat;

  let loaded = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loaded) {
        loaded = true;
        observer.disconnect();
        _loadAd(container, adSlotId, adFormat);
      }
    },
    { rootMargin: '200px' }
  );

  observer.observe(container);
}

function _loadAd(container, slotId, adFormat) {
  // Ensure AdSense script is loaded
  if (!document.querySelector('script[data-adsense]')) {
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_PUBLISHER_ID}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsense = 'true';
    document.head.appendChild(script);
  }

  container.style.background = '';
  container.style.border = '';

  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.dataset.adClient = AD_PUBLISHER_ID;
  ins.dataset.adSlot = slotId || '';
  ins.dataset.adFormat = 'auto';
  ins.dataset.fullWidthResponsive = 'true';

  container.innerHTML = '';
  container.appendChild(ins);

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (_) {
    /* ignore ad push errors */
  }
}
