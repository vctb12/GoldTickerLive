import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.js';
import { injectNav } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';

const depth = 2;
const urlLang = new URLSearchParams(location.search).get('lang');
const lang = urlLang === 'ar' ? 'ar' : 'en';
if (lang === 'ar') {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
}
injectNav(lang, depth);
injectFooter(lang, depth);

const form = document.getElementById('submit-shop-form');
const statusEl = document.getElementById('submit-shop-status');

function setStatus(message, state = 'info') {
  if (!statusEl) return;
  statusEl.hidden = false;
  statusEl.dataset.state = state;
  statusEl.textContent = message;
}

function getValue(name) {
  return form?.elements[name]?.value?.trim() || '';
}

function normalizeUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

async function submitShop(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shop_submissions`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Supabase returned ${res.status}`);
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (getValue('company_website')) {
    form.reset();
    setStatus('Thanks — your shop suggestion has been received for review.', 'success');
    return;
  }

  const shopName = getValue('shop_name');
  const city = getValue('city');
  const countryCode = getValue('country_code');
  const contactEmail = getValue('contact_email');

  if (!shopName || !city || !countryCode || !contactEmail) {
    setStatus('Please complete shop name, city, country, and contact email.', 'error');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting…';
  setStatus('Submitting your shop for editorial review…', 'info');

  const payload = {
    shop_name: shopName,
    owner_name: getValue('owner_name') || null,
    contact_email: contactEmail,
    contact_phone: getValue('contact_phone') || null,
    country_code: countryCode,
    city,
    market: getValue('market') || null,
    website: normalizeUrl(getValue('website')),
    specialty: getValue('specialty') || null,
    notes: getValue('notes') || null,
    status: 'pending',
    source: 'public-submit-shop',
    page_path: location.pathname,
  };

  try {
    await submitShop(payload);
    form.reset();
    setStatus(
      'Thanks — your shop has been submitted. The GoldTickerLive team will review details before any public listing appears.',
      'success'
    );
  } catch (error) {
    console.warn('[submit-shop] Supabase submission failed:', error.message);
    setStatus(
      'We could not submit right now. Please try again later; no listing is published until it is reviewed.',
      'error'
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit shop for review';
  }
});
