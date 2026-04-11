/**
 * Breadcrumbs Component
 * Renders breadcrumb navigation with schema.org markup
 * Usage: renderBreadcrumbs(element, breadcrumbArray)
 */

export function renderBreadcrumbs(container, items) {
  if (!container || !items || items.length === 0) {
    return;
  }

  // Create breadcrumb nav
  const nav = document.createElement('nav');
  nav.className = 'breadcrumbs';
  nav.setAttribute('aria-label', 'Breadcrumb navigation');

  // Create ol with schema.org markup
  const ol = document.createElement('ol');
  ol.className = 'breadcrumbs-list';
  ol.setAttribute('itemscope', '');
  ol.setAttribute('itemtype', 'https://schema.org/BreadcrumbList');

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item';
    li.setAttribute('itemprop', 'itemListElement');
    li.setAttribute('itemscope', '');
    li.setAttribute('itemtype', 'https://schema.org/ListItem');

    const position = index + 1;
    li.setAttribute('data-position', position);

    if (item.url && index < items.length - 1) {
      // Link for non-current items
      const link = document.createElement('a');
      link.href = item.url;
      link.className = 'breadcrumbs-link';
      link.textContent = item.label;
      link.setAttribute('itemprop', 'item');

      li.innerHTML = `
        <a href="${item.url}" class="breadcrumbs-link" itemprop="item">
          <span itemprop="name">${item.label}</span>
        </a>
      `;
    } else {
      // Current item (no link)
      li.innerHTML = `
        <span class="breadcrumbs-current" itemprop="item">
          <span itemprop="name">${item.label}</span>
        </span>
      `;
    }

    // Add position meta
    const positionMeta = document.createElement('meta');
    positionMeta.setAttribute('itemprop', 'position');
    positionMeta.content = position.toString();
    li.appendChild(positionMeta);

    ol.appendChild(li);
  });

  nav.appendChild(ol);
  container.appendChild(nav);
}

/**
 * Get breadcrumbs for common pages
 * Returns array of { label, url } objects
 */
export function getBreadcrumbs(pageName, extra = {}) {
  const breadcrumbs = [
    { label: 'Home', url: '/' }
  ];

  const pageMap = {
    'shops': [
      { label: 'Shops & Markets', url: '/shops.html' }
    ],
    'calculator': [
      { label: 'Calculator', url: '/calculator.html' }
    ],
    'learn': [
      { label: 'Learn', url: '/learn.html' }
    ],
    'insights': [
      { label: 'Insights', url: '/insights.html' }
    ],
    'methodology': [
      { label: 'Methodology', url: '/methodology.html' }
    ],
    'invest': [
      { label: 'Invest', url: '/invest.html' }
    ],
    'tracker': [
      { label: 'Tracker', url: '/tracker.html' }
    ],
    'country': [
      { label: 'Countries', url: '/tracker.html' },
      { label: extra.countryName || 'Country', url: extra.countryUrl || '#' }
    ]
  };

  if (pageMap[pageName]) {
    breadcrumbs.push(...pageMap[pageName]);
  }

  return breadcrumbs;
}

/**
 * Auto-inject breadcrumbs into a page
 * Call at top of page-specific JS (after nav injection)
 */
export function injectBreadcrumbs(pageName, extra = {}) {
  // Wait for nav to be injected if needed
  const breadcrumbContainer = document.querySelector('.page-breadcrumbs');
  if (!breadcrumbContainer) {
    return;
  }

  const breadcrumbs = getBreadcrumbs(pageName, extra);
  renderBreadcrumbs(breadcrumbContainer, breadcrumbs);
}

/**
 * Generate JSON-LD BreadcrumbList from breadcrumb items.
 * @param {Array<{label: string, href: string}>} items
 * @param {string} baseUrl
 * @returns {string} script tag HTML
 */
export function generateBreadcrumbSchema(items, baseUrl = 'https://vctb12.github.io/Gold-Prices') {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.label || item.name,
      'item': item.href?.startsWith('http') ? item.href : `${baseUrl}${item.href}`,
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
