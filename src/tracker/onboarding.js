import { el, setText } from '../lib/safe-dom.js';
import { iconUseElement } from '../components/icon-sprite.js';
import { tx } from './_ctx.js';

export function localizeWelcomeStrip() {
  const chipEls = document.querySelectorAll('.tracker-welcome-chip');
  const chipDefs = [
    { bold: tx('welcome.chip1Bold'), rest: tx('welcome.chip1Rest'), icon: 'i-chart' },
    { bold: tx('welcome.chip2Bold'), rest: tx('welcome.chip2Rest'), icon: 'i-scale' },
    { bold: tx('welcome.chip3Bold'), rest: tx('welcome.chip3Rest'), icon: 'i-calc' },
  ];
  chipEls.forEach((chip, i) => {
    const def = chipDefs[i];
    if (!def) return;
    chip.replaceChildren(
      iconUseElement(def.icon, 'tracker-inline-ico'),
      ' ',
      el('strong', {}, def.bold),
      ` ${def.rest}`
    );
  });
  const closeBtn = document.getElementById('tracker-welcome-close');
  if (closeBtn) setText(closeBtn, tx('welcome.dismiss'));
}

export function localizeTrustBanner() {
  const content = document.querySelector('.tracker-trust-content');
  if (content) {
    content.replaceChildren(
      el('strong', {}, tx('referenceBannerTitle')),
      ` — ${tx('referenceBannerBody')} `,
      el('a', { href: 'methodology.html', class: 'tracker-inline-link' }, tx('referenceBannerLink'))
    );
  }
  const closeBtn = document.querySelector('.tracker-trust-close');
  if (closeBtn) closeBtn.setAttribute('aria-label', tx('referenceBannerClose'));
}
