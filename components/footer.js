/**
 * Shared footer component.
 * Call injectFooter(lang) from any page entry point.
 */

export function injectFooter(lang = 'en', depth = 0) {
  const isAr = lang === 'ar';

  function r(href) {
    return depth === 0 ? href.replace('../', '') : href;
  }

  const html = `
<footer class="site-footer-global">
  <div class="footer-inner">
    <div class="footer-brand">
      <span class="footer-brand-icon" aria-hidden="true">◈</span>
      <span class="footer-brand-name">${isAr ? 'أسعار الذهب' : 'GoldPrices'}</span>
      <p class="footer-tagline">${isAr
        ? 'تقديرات الذهب المباشرة للخليج والعالم العربي'
        : 'Live gold estimates for the Gulf &amp; Arab world'}</p>
    </div>
    <div class="footer-links-grid">
      <div class="footer-col">
        <h4>${isAr ? 'الأدوات' : 'Tools'}</h4>
        <a href="${r('../tracker.html')}">${isAr ? 'تتبع مباشر' : 'Live Tracker'}</a>
        <a href="${r('../calculator.html')}">${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}</a>
        <a href="${r('../learn.html')}">${isAr ? 'تعلّم' : 'Learn'}</a>
        <a href="${r('../insights.html')}">${isAr ? 'تحليلات' : 'Insights'}</a>
        <a href="${r('../methodology.html')}">${isAr ? 'المنهجية' : 'Methodology'}</a>
      </div>
      <div class="footer-col">
        <h4>${isAr ? 'دول الخليج' : 'GCC Prices'}</h4>
        <a href="${r('../countries/uae.html')}">${isAr ? 'الإمارات' : 'UAE'}</a>
        <a href="${r('../countries/saudi-arabia.html')}">${isAr ? 'السعودية' : 'Saudi Arabia'}</a>
        <a href="${r('../countries/kuwait.html')}">${isAr ? 'الكويت' : 'Kuwait'}</a>
        <a href="${r('../countries/qatar.html')}">${isAr ? 'قطر' : 'Qatar'}</a>
      </div>
      <div class="footer-col">
        <h4>${isAr ? 'مناطق أخرى' : 'More Regions'}</h4>
        <a href="${r('../countries/egypt.html')}">${isAr ? 'مصر' : 'Egypt'}</a>
        <a href="${r('../countries/jordan.html')}">${isAr ? 'الأردن' : 'Jordan'}</a>
        <a href="${r('../countries/morocco.html')}">${isAr ? 'المغرب' : 'Morocco'}</a>
        <a href="${r('../countries/india.html')}">${isAr ? 'الهند' : 'India'}</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-sources">
      <span>${isAr ? 'بيانات الذهب:' : 'Gold data:'} <a href="https://gold-api.com" target="_blank" rel="noopener">gold-api.com</a></span>
      <span class="footer-sep" aria-hidden="true">·</span>
      <span>${isAr ? 'أسعار الصرف:' : 'FX data:'} <a href="https://open.er-api.com" target="_blank" rel="noopener">open.er-api.com</a></span>
    </div>
    <p class="footer-disclaimer">${isAr
      ? 'قيم تقديرية مكافئة للسبيكة فقط. قد تختلف أسعار التجزئة والمجوهرات. ليست نصيحة مالية.'
      : 'Estimated bullion-equivalent values only. Retail and jewellery prices may differ. Not financial advice.'}</p>
  </div>
</footer>`;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstElementChild);
}
