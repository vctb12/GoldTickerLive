/**
 * Learn-hub article structure (section ids + translation keys — no copy).
 *
 * Kept text-free on purpose so the eager learn.html graph (content-registry,
 * toc scroll-spy enhancement) can use the article shape without downloading
 * the localized corpus in src/learn-hub/content-text.js.
 */

export const LEARN_ARTICLE = Object.freeze({
  id: 'learn',
  titleKey: 'learn-h1',
  subtitleKey: 'learn-sub',
  icon: 'i-book',
  iconLabelKey: 'learnHub.articles.learn.iconLabel',
  metadata: {
    readTime: 8,
    lastUpdated: '2026-05-25',
    category: 'learn',
    categoryKey: 'learnHub.categories.learn',
  },
  tocEntries: [
    { id: 'karats', labelKey: 'toc-karats' },
    { id: 'pricing', labelKey: 'toc-pricing' },
    { id: 'aed-peg', labelKey: 'toc-aed' },
    { id: 'zakat', labelKey: 'toc-zakat' },
    { id: 'hallmark', labelKey: 'toc-hallmark' },
    { id: 'faq', labelKey: 'toc-faq' },
  ],
  relatedArticleIds: ['methodology', 'insights'],
  sections: [
    {
      id: 'karats',
      headingKey: 'karats-h2',
      bodyKey: 'karats-intro',
      type: 'table',
      table: {
        captionKey: 'learnHub.articles.learn.sections.karats.table.caption',
        columns: [
          { id: 'karat', labelKey: 'th-karat', scope: 'col' },
          { id: 'purity', labelKey: 'th-purity', scope: 'col' },
          {
            id: 'visual',
            scope: 'col',
            ariaLabelKey: 'learnHub.articles.learn.sections.karats.table.visualHeader',
          },
          { id: 'goldContent', labelKey: 'th-gold-content', scope: 'col' },
          { id: 'commonUse', labelKey: 'th-common-use', scope: 'col' },
        ],
        rows: [
          {
            id: '24k',
            rowHeader: '24K',
            cells: [
              { value: '99.9%' },
              { type: 'meter', value: 99.9, className: 'learn-purity-bar-fill--24k' },
              { textKey: 'learnHub.articles.learn.sections.karats.table.24k.content' },
              { textKey: 'use-24' },
            ],
          },
          {
            id: '22k',
            rowHeader: '22K',
            cells: [
              { value: '91.7%' },
              { type: 'meter', value: 91.7, className: 'learn-purity-bar-fill--22k' },
              { textKey: 'learnHub.articles.learn.sections.karats.table.22k.content' },
              { textKey: 'use-22' },
            ],
          },
          {
            id: '21k',
            rowHeader: '21K',
            cells: [
              { value: '87.5%' },
              { type: 'meter', value: 87.5, className: 'learn-purity-bar-fill--21k' },
              { textKey: 'learnHub.articles.learn.sections.karats.table.21k.content' },
              { textKey: 'use-21' },
            ],
          },
          {
            id: '18k',
            rowHeader: '18K',
            cells: [
              { value: '75.0%' },
              { type: 'meter', value: 75, className: 'learn-purity-bar-fill--18k' },
              { textKey: 'learnHub.articles.learn.sections.karats.table.18k.content' },
              { textKey: 'use-18' },
            ],
          },
          {
            id: '14k',
            rowHeader: '14K',
            cells: [
              { value: '58.3%' },
              { type: 'meter', value: 58.3, className: 'learn-purity-bar-fill--14k' },
              { textKey: 'learnHub.articles.learn.sections.karats.table.14k.content' },
              { textKey: 'use-14' },
            ],
          },
          {
            id: '9k',
            rowHeader: '9K',
            cells: [
              { value: '37.5%' },
              { type: 'meter', value: 37.5, className: 'learn-purity-bar-fill--9k' },
              { textKey: 'learnHub.articles.learn.sections.karats.table.9k.content' },
              { textKey: 'use-9' },
            ],
          },
        ],
      },
      blocks: [
        { kind: 'subheading', key: 'karats-why-h3' },
        { kind: 'paragraph', key: 'learnHub.articles.learn.sections.karats.detail' },
        {
          kind: 'callout',
          tone: 'formula',
          titleKey: 'callout-formula-title',
          bodyKey: 'callout-formula-body',
        },
      ],
    },
    {
      id: 'pricing',
      headingKey: 'pricing-h2',
      bodyKey: 'pricing-intro',
      type: 'prose',
      blocks: [
        { kind: 'subheading', key: 'pricing-markets-h3' },
        { kind: 'paragraph', key: 'learnHub.articles.learn.sections.pricing.marketsIntro' },
        {
          kind: 'list',
          style: 'unordered',
          items: [
            { textKey: 'learnHub.articles.learn.sections.pricing.markets.comex' },
            { textKey: 'learnHub.articles.learn.sections.pricing.markets.lbma' },
            { textKey: 'learnHub.articles.learn.sections.pricing.markets.otc' },
          ],
        },
        { kind: 'subheading', key: 'learnHub.articles.learn.sections.pricing.factorsHeading' },
        {
          kind: 'list',
          style: 'unordered',
          items: [
            { textKey: 'learnHub.articles.learn.sections.pricing.factors.usd' },
            { textKey: 'learnHub.articles.learn.sections.pricing.factors.rates' },
            { textKey: 'learnHub.articles.learn.sections.pricing.factors.inflation' },
            { textKey: 'learnHub.articles.learn.sections.pricing.factors.geopolitics' },
            { textKey: 'learnHub.articles.learn.sections.pricing.factors.centralBanks' },
            { textKey: 'learnHub.articles.learn.sections.pricing.factors.jewelleryDemand' },
          ],
        },
        {
          kind: 'callout',
          tone: 'info',
          titleKey: 'callout-spot-title',
          richText: [
            { key: 'learnHub.articles.learn.sections.pricing.callout.bodyLead' },
            {
              type: 'link',
              href: 'https://gold-api.com',
              text: 'gold-api.com',
              external: true,
            },
            { key: 'learnHub.articles.learn.sections.pricing.callout.bodyMiddle' },
            { type: 'code', text: 'data/gold_price.json' },
            { key: 'learnHub.articles.learn.sections.pricing.callout.bodyAfterCode' },
            {
              type: 'link',
              href: 'https://open.er-api.com',
              text: 'open.er-api.com',
              external: true,
            },
            { key: 'learnHub.articles.learn.sections.pricing.callout.bodyTail' },
          ],
        },
      ],
    },
    {
      id: 'aed-peg',
      headingKey: 'aed-h2',
      bodyKey: 'aed-intro',
      type: 'callout',
      blocks: [
        {
          kind: 'list',
          style: 'unordered',
          items: [
            { textKey: 'learnHub.articles.learn.sections.aed.effects.1' },
            { textKey: 'learnHub.articles.learn.sections.aed.effects.2' },
            { textKey: 'learnHub.articles.learn.sections.aed.effects.3' },
          ],
        },
        { kind: 'paragraph', key: 'learnHub.articles.learn.sections.aed.detail' },
        { kind: 'paragraph', key: 'aed-our-approach' },
      ],
    },
    {
      id: 'zakat',
      headingKey: 'zakat-h2',
      bodyKey: 'learnHub.articles.learn.sections.zakat.detail',
      type: 'callout',
      blocks: [
        { kind: 'subheading', key: 'zakat-nisab-h3' },
        { kind: 'paragraph', key: 'zakat-nisab-text' },
        { kind: 'subheading', key: 'zakat-rate-h3' },
        { kind: 'paragraph', key: 'zakat-rate-text' },
        { kind: 'subheading', key: 'zakat-what-counts-h3' },
        {
          kind: 'list',
          style: 'unordered',
          items: [
            { textKey: 'learnHub.articles.learn.sections.zakat.whatCounts.1' },
            { textKey: 'learnHub.articles.learn.sections.zakat.whatCounts.2' },
            { textKey: 'learnHub.articles.learn.sections.zakat.whatCounts.3' },
          ],
        },
        {
          kind: 'callout',
          tone: 'info',
          titleKey: 'callout-zakat-title',
          richText: [
            { key: 'learnHub.articles.learn.sections.zakat.callout.bodyLead' },
            {
              type: 'link',
              href: './calculator.html',
              key: 'learnHub.articles.learn.sections.zakat.callout.link',
            },
            { key: 'learnHub.articles.learn.sections.zakat.callout.bodyTail' },
          ],
        },
      ],
    },
    {
      id: 'hallmark',
      headingKey: 'hallmark-h2',
      bodyKey: 'hallmark-intro',
      type: 'table',
      table: {
        captionKey: 'learnHub.articles.learn.sections.hallmark.table.caption',
        columns: [
          { id: 'millesimal', labelKey: 'th-millesimal', scope: 'col' },
          { id: 'karatEquiv', labelKey: 'th-karat-equiv', scope: 'col' },
          { id: 'purityPct', labelKey: 'th-purity-pct', scope: 'col' },
        ],
        rows: [
          { id: '999', rowHeader: '999', cells: [{ value: '24K' }, { value: '99.9%' }] },
          { id: '916', rowHeader: '916', cells: [{ value: '22K' }, { value: '91.7%' }] },
          { id: '875', rowHeader: '875', cells: [{ value: '21K' }, { value: '87.5%' }] },
          { id: '750', rowHeader: '750', cells: [{ value: '18K' }, { value: '75.0%' }] },
          { id: '583', rowHeader: '583', cells: [{ value: '14K' }, { value: '58.3%' }] },
          { id: '375', rowHeader: '375', cells: [{ value: '9K' }, { value: '37.5%' }] },
        ],
      },
      blocks: [
        { kind: 'subheading', key: 'hallmark-uae-h3' },
        { kind: 'paragraph', key: 'learnHub.articles.learn.sections.hallmark.uaeText' },
        { kind: 'subheading', key: 'hallmark-india-h3' },
        { kind: 'paragraph', key: 'learnHub.articles.learn.sections.hallmark.indiaText' },
        { kind: 'subheading', key: 'hallmark-uk-h3' },
        { kind: 'paragraph', key: 'learnHub.articles.learn.sections.hallmark.ukText' },
      ],
    },
    {
      id: 'faq',
      headingKey: 'faq-h2',
      bodyKey: 'learnHub.articles.learn.sections.faq.intro',
      type: 'faq',
      faqs: [
        {
          id: 'q1',
          questionKey: 'faq-q1',
          answerKey: 'learnHub.articles.learn.sections.faq.a1',
          open: true,
        },
        { id: 'q2', questionKey: 'faq-q2', answerKey: 'learnHub.articles.learn.sections.faq.a2' },
        { id: 'q3', questionKey: 'faq-q3', answerKey: 'learnHub.articles.learn.sections.faq.a3' },
        { id: 'q4', questionKey: 'faq-q4', answerKey: 'learnHub.articles.learn.sections.faq.a4' },
        { id: 'q5', questionKey: 'faq-q5', answerKey: 'learnHub.articles.learn.sections.faq.a5' },
        { id: 'q6', questionKey: 'faq-q6', answerKey: 'learnHub.articles.learn.sections.faq.a6' },
      ],
    },
  ],
});

export const LEARN_HUB_ARTICLES = Object.freeze([LEARN_ARTICLE]);
