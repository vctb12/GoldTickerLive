export function buildMethodologyFaqSchema(lang = 'en') {
  const qa =
    lang === 'ar'
      ? [
          [
            'هل هذه الأسعار سعر محل نهائي؟',
            'لا. هذه تقديرات مرجعية مرتبطة بالسعر الفوري قبل المصنعية والضريبة وهوامش المحلات.',
          ],
          [
            'كيف يتم حساب السعر لكل غرام؟',
            'نقسم XAU/USD على 31.1034768 ثم نطبّق نقاء العيار ثم سعر الصرف المحلي.',
          ],
          ['هل يتم تثبيت سعر الدرهم؟', 'نعم. تحويلات الدرهم تعتمد الربط الرسمي 3.6725 افتراضياً.'],
        ]
      : [
          [
            'Are these prices final retail shop quotes?',
            'No. They are spot-linked reference estimates before making charges, VAT, and dealer premiums.',
          ],
          [
            'How is price per gram calculated?',
            'We divide XAU/USD by 31.1034768, apply karat purity, then convert to local currency.',
          ],
          [
            'Is the AED conversion fixed?',
            'Yes. AED conversions default to the official 3.6725 peg.',
          ],
        ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang === 'ar' ? 'ar' : 'en',
    mainEntity: qa.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function injectFaqSchema(doc = document, schema, id = 'methodology-faq-schema') {
  if (!schema) return null;
  const existing = doc.getElementById(id);
  if (existing) existing.remove();
  const script = doc.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(schema);
  doc.head.appendChild(script);
  return script;
}
