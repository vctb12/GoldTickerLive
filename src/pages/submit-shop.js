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

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const T = {
  en: {
    next: 'Next →',
    back: '← Back',
    submit: 'Submit for review',
    submitting: 'Submitting…',
    errorRequired: 'Please complete all required fields before continuing.',
    errorEmail: 'Please enter a valid email address.',
    errorPhone: 'Please enter a valid phone number (digits, +, -, spaces).',
    errorUrl: 'Please enter a valid URL (e.g. https://example.com).',
    errorCountry: 'Please select a country.',
    errorCity: 'Please enter the city.',
    errorShopName: 'Shop name is required.',
    success:
      'Your shop has been submitted. The Gold Ticker Live team will review it before any public listing appears.',
    successAr: null,
    error:
      'Could not submit right now. Please try again — no listing is published until it is reviewed.',
  },
  ar: {
    next: 'التالي ←',
    back: '→ رجوع',
    submit: 'إرسال للمراجعة',
    submitting: 'جارٍ الإرسال…',
    errorRequired: 'يرجى استكمال جميع الحقول المطلوبة قبل المتابعة.',
    errorEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    errorPhone: 'يرجى إدخال رقم هاتف صحيح.',
    errorUrl: 'يرجى إدخال رابط صحيح (مثال: https://example.com).',
    errorCountry: 'يرجى اختيار الدولة.',
    errorCity: 'يرجى إدخال المدينة.',
    errorShopName: 'اسم المحل مطلوب.',
    success: 'تم إرسال طلبك. سيراجع فريق Gold Ticker Live التفاصيل قبل أي نشر في الدليل العام.',
    error: 'تعذّر الإرسال الآن. يرجى المحاولة مرة أخرى — لا يُنشر أي شيء إلا بعد المراجعة.',
  },
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const form = document.getElementById('submit-shop-form');
const statusEl = document.getElementById('submit-shop-status');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const btnSubmit = document.getElementById('btn-submit');
const steps = /** @type {HTMLFieldSetElement[]} */ (
  Array.from(form?.querySelectorAll('[data-step]') ?? [])
);
const indicators = Array.from(document.querySelectorAll('[data-step-indicator]'));

let currentStep = 1;
const TOTAL_STEPS = 3;

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------
function t(key) {
  return (T[lang] ?? T.en)[key] ?? T.en[key] ?? key;
}

function showStep(n) {
  currentStep = n;
  steps.forEach((s) => {
    const num = Number(s.dataset.step);
    s.hidden = num !== n;
  });

  // Update step indicators
  indicators.forEach((ind) => {
    const num = Number(ind.dataset.stepIndicator);
    ind.classList.toggle('active', num === n);
    ind.classList.toggle('done', num < n);
  });

  // Update button visibility / labels
  btnPrev.hidden = n === 1;
  btnNext.hidden = n === TOTAL_STEPS;
  btnSubmit.hidden = n !== TOTAL_STEPS;

  btnNext.textContent = t('next');
  btnPrev.textContent = t('back');
  btnSubmit.textContent = t('submit');
}

// ---------------------------------------------------------------------------
// Inline validation helpers
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}$/;
const PHONE_RE = /^[+\d()\-\s]{4,}$/;

function getValue(name) {
  return form?.elements[name]?.value?.trim() ?? '';
}

function setFieldError(name, msgKey) {
  const errEl = form?.querySelector(`#err-${name}`);
  const inputEl = form?.elements[name];
  if (errEl) {
    errEl.hidden = !msgKey;
    if (msgKey) errEl.textContent = t(msgKey);
  }
  if (inputEl) {
    if (msgKey) inputEl.setAttribute('aria-invalid', 'true');
    else inputEl.removeAttribute('aria-invalid');
  }
}

function validateStep(n) {
  let valid = true;

  if (n === 1) {
    if (!getValue('country_code')) {
      setFieldError('country_code', 'errorCountry');
      valid = false;
    } else {
      setFieldError('country_code', null);
    }
    if (!getValue('city')) {
      setFieldError('city', 'errorCity');
      valid = false;
    } else {
      setFieldError('city', null);
    }
  }

  if (n === 2) {
    if (!getValue('shop_name')) {
      setFieldError('shop_name', 'errorShopName');
      valid = false;
    } else {
      setFieldError('shop_name', null);
    }
    const email = getValue('contact_email');
    if (!email || !EMAIL_RE.test(email)) {
      setFieldError('contact_email', 'errorEmail');
      valid = false;
    } else {
      setFieldError('contact_email', null);
    }
    const phone = getValue('contact_phone');
    if (phone && !PHONE_RE.test(phone)) {
      setFieldError('contact_phone', 'errorPhone');
      valid = false;
    } else {
      setFieldError('contact_phone', null);
    }
    const website = getValue('website');
    if (website && /[<>"']/.test(website)) {
      setFieldError('website', 'errorUrl');
      valid = false;
    } else {
      setFieldError('website', null);
    }
  }

  return valid;
}

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------
function setStatus(message, state = 'info') {
  if (!statusEl) return;
  statusEl.hidden = false;
  statusEl.dataset.state = state;
  statusEl.textContent = message;
}

function clearStatus() {
  if (!statusEl) return;
  statusEl.hidden = true;
  statusEl.dataset.state = '';
  statusEl.textContent = '';
}

// ---------------------------------------------------------------------------
// Wire up navigation buttons
// ---------------------------------------------------------------------------
if (btnNext) {
  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    clearStatus();
    showStep(currentStep + 1);
  });
}

if (btnPrev) {
  btnPrev.addEventListener('click', () => {
    clearStatus();
    showStep(currentStep - 1);
  });
}

// Attach blur-time inline validation
form?.querySelectorAll('input, select').forEach((el) => {
  el.addEventListener('blur', () => {
    const name = el.name;
    if (name === 'country_code' || name === 'city') validateStep(1);
    if (name === 'shop_name' || name === 'contact_email' || name === 'contact_phone') {
      validateStep(2);
    }
  });
});

// ---------------------------------------------------------------------------
// Normalise URL
// ---------------------------------------------------------------------------
function normalizeUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

// ---------------------------------------------------------------------------
// Submit handler
// ---------------------------------------------------------------------------
form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Honeypot
  if (getValue('company_website')) {
    form.reset();
    setStatus(t('success'), 'success');
    return;
  }

  // Final validation
  if (!validateStep(1) || !validateStep(2)) {
    setStatus(t('errorRequired'), 'error');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = t('submitting');
  setStatus('', 'info');

  const payload = {
    shop_name: getValue('shop_name'),
    owner_name: getValue('owner_name') || null,
    contact_email: getValue('contact_email'),
    contact_phone: getValue('contact_phone') || null,
    country_code: getValue('country_code'),
    city: getValue('city'),
    market: getValue('market') || null,
    website: normalizeUrl(getValue('website')),
    specialty: getValue('specialty') || null,
    notes: getValue('notes') || null,
    company_website: '', // explicit empty honeypot
  };

  try {
    const res = await fetch('/api/submit-shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Server returned ${res.status}`);
    }

    form.reset();
    showStep(1);
    setStatus(t('success'), 'success');
  } catch (err) {
    console.warn('[submit-shop] Submission failed:', err.message);
    setStatus(t('error'), 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = t('submit');
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
showStep(1);
