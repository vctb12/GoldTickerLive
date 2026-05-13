import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectTicker, updateTickerLang } from '../components/ticker.js';
import { injectSpotBar, updateSpotBarLang } from '../components/spotBar.js';
import { buildSupabaseBrowserClient } from '../lib/public-account-client.js';
import { cacheKeyUserPrefs } from './dashboard.shared.js';

const params = new URLSearchParams(window.location.search);
const initialLang = params.get('lang') === 'ar' ? 'ar' : 'en';
let lang = initialLang;

const T = {
  en: {
    signIn: 'Sign in',
    signUp: 'Create account',
    loading: 'Checking session…',
    signedIn: 'Signed in. Redirecting to dashboard…',
    signInFailed: 'Sign-in failed. Check email/password and try again.',
    signUpOk: 'Account created. Please sign in.',
    signUpFailed: 'Could not create account.',
    oauthFailed: 'OAuth sign-in could not start.',
  },
  ar: {
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    loading: 'جاري التحقق من الجلسة…',
    signedIn: 'تم تسجيل الدخول. جارٍ التحويل إلى لوحة التحكم…',
    signInFailed: 'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.',
    signUpOk: 'تم إنشاء الحساب. سجّل الدخول الآن.',
    signUpFailed: 'تعذر إنشاء الحساب.',
    oauthFailed: 'تعذر بدء تسجيل الدخول عبر OAuth.',
  },
};

function tx(key) {
  return T[lang]?.[key] || T.en[key] || key;
}

function setStatus(msg) {
  const node = document.getElementById('account-status');
  if (node) node.textContent = msg;
}

function setLang(nextLang) {
  lang = nextLang === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  try {
    const prefs = JSON.parse(localStorage.getItem(cacheKeyUserPrefs()) || '{}');
    prefs.lang = lang;
    localStorage.setItem(cacheKeyUserPrefs(), JSON.stringify(prefs));
  } catch {
    // no-op
  }
}

function switchTab(mode) {
  const signInTab = document.getElementById('account-tab-signin');
  const signUpTab = document.getElementById('account-tab-signup');
  const signInForm = document.getElementById('account-form-signin');
  const signUpForm = document.getElementById('account-form-signup');
  const isSignIn = mode === 'signin';
  signInTab?.classList.toggle('is-active', isSignIn);
  signUpTab?.classList.toggle('is-active', !isSignIn);
  if (signInForm) signInForm.hidden = !isSignIn;
  if (signUpForm) signUpForm.hidden = isSignIn;
}

function getNextUrl() {
  const next = params.get('next');
  if (!next) return '/dashboard.html';
  try {
    const parsed = new URL(next, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/dashboard.html';
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return '/dashboard.html';
  }
}

async function init() {
  setLang(initialLang);
  injectSpotBar(lang, 0);
  const nav = injectNav(lang, 0);
  injectFooter(lang, 0);
  injectTicker(lang, 0);

  nav.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(lang === 'en' ? 'ar' : 'en');
      updateNavLang(lang);
      updateTickerLang(lang);
      updateSpotBarLang(lang);
    });
  });

  const sb = buildSupabaseBrowserClient();
  if (!sb) {
    setStatus('Supabase client unavailable. Check configuration.');
    return;
  }

  setStatus(tx('loading'));
  const existing = await sb.auth.getSession().catch(() => null);
  if (existing?.data?.session?.access_token) {
    setStatus(tx('signedIn'));
    window.location.href = getNextUrl();
    return;
  }
  setStatus('');

  document
    .getElementById('account-tab-signin')
    ?.addEventListener('click', () => switchTab('signin'));
  document
    .getElementById('account-tab-signup')
    ?.addEventListener('click', () => switchTab('signup'));

  document.getElementById('account-form-signin')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('account-signin-email')?.value?.trim();
    const password = document.getElementById('account-signin-password')?.value || '';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(tx('signInFailed'));
      return;
    }
    setStatus(tx('signedIn'));
    window.location.href = getNextUrl();
  });

  document.getElementById('account-form-signup')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('account-signup-email')?.value?.trim();
    const password = document.getElementById('account-signup-password')?.value || '';
    const { error } = await sb.auth.signUp({ email, password });
    setStatus(error ? tx('signUpFailed') : tx('signUpOk'));
  });

  document.getElementById('account-google-btn')?.addEventListener('click', async () => {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard.html` },
    });
    if (error) setStatus(tx('oauthFailed'));
  });
}

init();
