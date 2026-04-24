/**
 * shops/rendering.js - Card and grid rendering logic
 * Separates rendering from main module orchestration
 */

import { escape as esc, safeHref as safeUrl, safeTel } from '../../lib/safe-dom.js';
import {
  countryByCode,
  countryName,
  regionName,
  isMarketArea,
  calculateConfidenceBadge,
  listingTypeLabel,
  contactQualityLabel,
} from './helpers.js';

export function renderCards(shops, STATE, SHOPS, t, isInShortlist, openModal) {
  const grid = document.getElementById('shops-grid');
  if (!grid) {
    console.warn('[shops] Element #shops-grid not found');
    return;
  }

  grid.innerHTML = shops
    .map((shop) => {
      const country = countryByCode(shop.countryCode);
      const specialties = (shop.specialties || [])
        .map((item) => `<span class="shop-tag">${esc(item)}</span>`)
        .join('');
      const isCluster = isMarketArea(shop);
      const confidenceBadge = calculateConfidenceBadge(shop);
      const clusterBadge = isCluster
        ? `<span class="shop-cluster-badge">${t('marketCluster')}</span>`
        : '';
      const listingTypeBadge = `<span class="shop-listing-type ${isCluster ? 'shop-listing-type--market' : 'shop-listing-type--store'}">${listingTypeLabel(shop, t)}</span>`;
      const inShortlist = isInShortlist(shop.id);
      const countryUrl = country?.slug ? `countries/${country.slug}.html` : '';
      const areaGuideUrl = `${location.pathname}?country=${encodeURIComponent(shop.countryCode)}&search=${encodeURIComponent(shop.market)}`;
      const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name}, ${shop.market}, ${shop.city}`)}`;
      const nextActionLabel = isCluster ? t('nextActionsMarket') : t('nextActionsStore');
      const contactQualityLbl = contactQualityLabel(shop, t);

      const contactParts = [];
      if (shop.phone) contactParts.push(`${t('phone')}: ${esc(shop.phone)}`);
      if (safeUrl(shop.website)) {
        contactParts.push(
          `<a href="${esc(safeUrl(shop.website))}" target="_blank" rel="noopener" class="shop-site-link">${t('visitWebsite')}</a>`
        );
      }

      return `
      <article class="shop-card${shop.featured ? ' shop-card--featured' : ''}${isCluster ? ' shop-card--cluster' : ''}" data-shop-id="${esc(shop.id)}">
        <header class="shop-card-head">
          <div>
            <h3>${esc(shop.name)}</h3>
            <div class="shop-card-badges">
              ${clusterBadge}
              ${listingTypeBadge}
              ${shop.featured ? `<span class="shop-featured">${t('featured')}</span>` : ''}
            </div>
          </div>
        </header>

        <section class="shop-confidence-block" aria-label="${t('listingConfidenceTitle')}">
          <p class="shop-confidence-title">${t('listingConfidenceTitle')}</p>
          <div class="shop-confidence-grid">
            <p class="shop-confidence-item">
              <span>${t('category')}</span>
              <strong>${listingTypeLabel(shop, t)}</strong>
            </p>
            <p class="shop-confidence-item">
              <span>${t('detailsConfidence')}</span>
              <strong class="shop-signal shop-signal--${esc(confidenceBadge.level)}" style="--confidence-color: var(--color-${esc(confidenceBadge.color)})">${esc(confidenceBadge.label)}</strong>
            </p>
            <p class="shop-confidence-item">
              <span>${t('contactQuality')}</span>
              <strong>${contactQualityLbl}</strong>
            </p>
          </div>
        </section>

        <div class="shop-meta-grid">
          <p class="shop-meta"><span>${t('location')}</span><strong>${esc(shop.city)}, ${countryName(country, STATE.lang)} · ${regionName(country.group, STATE.lang)}</strong></p>
          <p class="shop-meta"><span>${t('market')}</span><strong>${esc(shop.market)}</strong></p>
          <p class="shop-meta"><span>${t('category')}</span><strong>${esc(shop.category)}</strong></p>
        </div>

        <div class="shop-tags-wrap">
          <span class="shop-tag shop-tag--muted">${t('specialties')}</span>
          ${specialties || '<span class="shop-tag">—</span>'}
        </div>

        <p class="shop-notes">${esc(shop.notes)}</p>

        <div class="shop-next-action-label">${nextActionLabel}</div>
        <div class="shop-actions-row shop-actions-row--primary">
          ${
            isCluster
              ? `<a href="${esc(areaGuideUrl)}" class="shop-action-btn shop-action-btn--guide" aria-label="${t('areaGuide')}: ${esc(shop.market)}">
            <span class="shop-action-icon">🧭</span>
            <span class="shop-action-label">${t('areaGuide')}</span>
          </a>`
              : ''
          }
          ${
            !isCluster && shop.phone
              ? `<a href="tel:${esc(safeTel(shop.phone))}" class="shop-action-btn shop-action-btn--call" aria-label="${t('callShop')}">
            <span class="shop-action-icon">📞</span>
            <span class="shop-action-label">${t('callShop')}</span>
          </a>`
              : ''
          }
          ${
            !isCluster && safeUrl(shop.website)
              ? `<a href="${esc(safeUrl(shop.website))}" target="_blank" rel="noopener" class="shop-action-btn shop-action-btn--website" aria-label="${t('visitWebsite')}">
            <span class="shop-action-icon">🌐</span>
            <span class="shop-action-label">${t('visitWebsite')}</span>
          </a>`
              : ''
          }
          ${
            !isCluster
              ? `<a href="${esc(directionsUrl)}" target="_blank" rel="noopener" class="shop-action-btn shop-action-btn--directions" aria-label="${t('directions')}">
            <span class="shop-action-icon">🧭</span>
            <span class="shop-action-label">${t('directions')}</span>
          </a>`
              : ''
          }
          ${
            countryUrl
              ? `<a href="${countryUrl}" class="shop-action-btn shop-action-btn--country" aria-label="${t('viewCountryPage')}: ${countryName(country, STATE.lang)}">
            <span class="shop-action-icon">📄</span>
            <span class="shop-action-label">${countryName(country, STATE.lang)}</span>
          </a>`
              : ''
          }
        </div>

        <div class="shop-actions-row shop-actions-row--secondary">
          <button class="shop-action-btn shop-action-btn--save ${inShortlist ? 'is-saved' : ''}"
                  type="button" data-shop-id="${esc(shop.id)}" aria-label="${inShortlist ? t('removeFromShortlist') : t('saveToShortlist')}">
            <span class="shop-action-icon">${inShortlist ? '✓' : '+'}</span>
            <span class="shop-action-label">${inShortlist ? t('saved') : t('saveToShortlist')}</span>
          </button>
          <button class="shop-action-btn shop-action-btn--share" type="button" data-shop-id="${esc(shop.id)}" aria-label="${t('shareShop')}">
            <span class="shop-action-icon">↗</span>
            <span class="shop-action-label">${t('shareShop')}</span>
          </button>
        </div>

        <p class="shop-contact">${contactParts.join(' · ') || t('noContact')}</p>
      </article>
    `;
    })
    .join('');
}

export function bindShopCardHandlers(SHOPS, toggleShortlist, shareShop, openModal) {
  const grid = document.getElementById('shops-grid');
  if (!grid) return;

  grid.querySelectorAll('.shop-card').forEach((card) => {
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);

    newCard.addEventListener('click', (e) => {
      if (e.target.closest('.shop-action-btn')) return;
      const shopId = newCard.dataset.shopId;
      const shop = SHOPS.find((s) => s.id === shopId);
      if (shop) openModal(shop);
    });
  });

  grid.querySelectorAll('.shop-action-btn--save').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleShortlist(btn.dataset.shopId);
    });
  });

  grid.querySelectorAll('.shop-action-btn--share').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shop = SHOPS.find((s) => s.id === btn.dataset.shopId);
      if (shop) shareShop(shop);
    });
  });
}

export function renderFeaturedSection(shopsMatchingPrimaryFilters, STATE, t, openModal, SHOPS) {
  const featuredSection = document.getElementById('shops-featured');
  const featuredGrid = document.getElementById('shops-featured-grid');

  if (!featuredSection || !featuredGrid) {
    console.warn('[shops] Featured section elements not found');
    return;
  }

  const featured = shopsMatchingPrimaryFilters().filter((shop) => shop.featured);

  if (!featured.length) {
    featuredSection.hidden = true;
    return;
  }

  featuredSection.hidden = false;
  featuredGrid.innerHTML = featured
    .map((shop) => {
      const country = countryByCode(shop.countryCode);
      const specialties = (shop.specialties || [])
        .slice(0, 2)
        .map((item) => `<span class="featured-tag">${esc(item)}</span>`)
        .join('');
      return `
      <article class="featured-card" data-shop-id="${esc(shop.id)}" style="cursor: pointer;">
        <div class="featured-header">
          <h3>${esc(shop.name)}</h3>
          <span class="featured-location">${esc(shop.city)} · ${countryName(country, STATE.lang)}</span>
        </div>
        <p class="featured-market">${esc(shop.market)}</p>
        <div class="featured-tags">${specialties}</div>
      </article>
    `;
    })
    .join('');

  bindFeaturedCardHandlers(SHOPS, openModal);
}

function bindFeaturedCardHandlers(SHOPS, openModal) {
  const featuredGrid = document.getElementById('shops-featured-grid');
  if (!featuredGrid) return;

  featuredGrid.querySelectorAll('.featured-card').forEach((card) => {
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);

    newCard.addEventListener('click', () => {
      const shop = SHOPS.find((s) => s.id === newCard.dataset.shopId);
      if (shop) openModal(shop);
    });
  });
}
