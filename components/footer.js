/**
 * Shared footer component — 5-column dark premium.
 * Call injectFooter(lang, depth) from any page entry point.
 */

export function injectFooter(lang = 'en', depth = 0) {
  const isAr = lang === 'ar';

  function r(href) {
    return depth === 0 ? href.replace('../', '') : href;
  }

  const year = new Date().getFullYear();

  const html = `
<footer class="site-footer-global">
  <div class="footer-top">
    <div class="footer-inner">

      <!-- Brand column -->
      <div class="footer-col footer-col--brand">
        <a href="${r('../index.html')}" class="footer-brand-link" aria-label="GoldPrices Home">
          <span class="footer-brand-icon" aria-hidden="true">◈</span>
          <span class="footer-brand-name">${isAr ? 'أسعار الذهب' : 'GoldPrices'}</span>
        </a>
        <p class="footer-tagline">${isAr
          ? 'تقديرات الذهب المباشرة للخليج والعالم العربي'
          : 'Live gold estimates for the Gulf &amp; Arab world'}</p>
        <div class="footer-brand-badges">
          <span class="footer-badge">${isAr ? '24+ دولة' : '24+ Countries'}</span>
          <span class="footer-badge">${isAr ? '7 عيارات' : '7 Karats'}</span>
          <span class="footer-badge">${isAr ? 'ثنائي اللغة' : 'EN / AR'}</span>
        </div>
      </div>

      <!-- Markets column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'الأسواق' : 'Markets'}</h4>
        <a href="${r('../tracker.html')}">${isAr ? 'تتبع مباشر' : 'Live Tracker'}</a>
        <a href="${r('../countries/uae.html')}">${isAr ? 'ذهب الإمارات اليوم' : 'UAE Gold Today'}</a>
        <a href="${r('../tracker.html#section-countries')}">${isAr ? 'مقارنة دول الخليج' : 'GCC Compare'}</a>
        <a href="${r('../tracker.html#section-chart')}">${isAr ? 'البيانات التاريخية' : 'History &amp; Data'}</a>
      </div>

      <!-- Tools column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'الأدوات' : 'Tools'}</h4>
        <a href="${r('../calculator.html')}">${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}</a>
        <a href="${r('../tracker.html#section-alerts')}">${isAr ? 'تنبيهات السعر' : 'Price Alerts'}</a>
        <a href="${r('../tracker.html#section-chart')}">${isAr ? 'تنزيل البيانات' : 'Downloads'}</a>
      </div>

      <!-- GCC column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'دول الخليج' : 'GCC Prices'}</h4>
        <a href="${r('../countries/uae.html')}">${isAr ? 'الإمارات' : 'UAE'}</a>
        <a href="${r('../countries/saudi-arabia.html')}">${isAr ? 'السعودية' : 'Saudi Arabia'}</a>
        <a href="${r('../countries/kuwait.html')}">${isAr ? 'الكويت' : 'Kuwait'}</a>
        <a href="${r('../countries/qatar.html')}">${isAr ? 'قطر' : 'Qatar'}</a>
        <a href="${r('../countries/bahrain.html')}">${isAr ? 'البحرين' : 'Bahrain'}</a>
        <a href="${r('../countries/oman.html')}">${isAr ? 'عُمان' : 'Oman'}</a>
      </div>

      <!-- More Regions + Learn column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'مناطق أخرى' : 'More Regions'}</h4>
        <a href="${r('../countries/egypt.html')}">${isAr ? 'مصر' : 'Egypt'}</a>
        <a href="${r('../countries/jordan.html')}">${isAr ? 'الأردن' : 'Jordan'}</a>
        <a href="${r('../countries/morocco.html')}">${isAr ? 'المغرب' : 'Morocco'}</a>
        <a href="${r('../countries/india.html')}">${isAr ? 'الهند' : 'India'}</a>
        <h4 class="footer-col-heading footer-col-heading--mt">${isAr ? 'تعلّم وتحليلات' : 'Learn &amp; Insights'}</h4>
        <a href="${r('../learn.html')}">${isAr ? 'دليل الذهب' : 'Gold Guide'}</a>
        <a href="${r('../methodology.html')}">${isAr ? 'المنهجية' : 'Methodology'}</a>
        <a href="${r('../insights.html')}">${isAr ? 'تحليلات' : 'Insights'}</a>
      </div>

    </div>
  </div>

  <div class="footer-bottom">
    <div class="footer-inner">
      <div class="footer-sources">
        <span>${isAr ? 'بيانات الذهب:' : 'Gold data:'} <a href="https://gold-api.com" target="_blank" rel="noopener">gold-api.com</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'أسعار الصرف:' : 'FX data:'} <a href="https://open.er-api.com" target="_blank" rel="noopener">open.er-api.com</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'الدرهم الإماراتي:' : 'AED peg:'} <a href="${r('../methodology.html')}">${isAr ? '3.6725 ثابت' : '3.6725 fixed'}</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'أونصة ترويوا:' : 'Troy oz:'} 31.1035 g</span>
      </div>
      <div class="footer-bottom-row">
        <p class="footer-disclaimer">${isAr
          ? 'قيم تقديرية مكافئة للسبيكة فقط. قد تختلف أسعار التجزئة والمجوهرات. ليست نصيحة مالية.'
          : 'Estimated bullion-equivalent values only. Retail and jewellery prices may differ. Not financial advice.'}</p>
        <p class="footer-copy">© ${year} GoldPrices</p>
      </div>
    </div>
  </div>
</footer>`;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstElementChild);
}
