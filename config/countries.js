export const COUNTRIES = [
  // GCC
  {
    code: 'AE', nameEn: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة',
    currency: 'AED', flag: '🇦🇪', group: 'gcc', decimals: 2, fixedPeg: true,
    searchAliases: ['uae', 'emirates', 'aed', 'الإمارات', 'امارات', 'إمارات'],
  },
  {
    code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية',
    currency: 'SAR', flag: '🇸🇦', group: 'gcc', decimals: 2, fixedPeg: false,
    searchAliases: ['saudi', 'sa', 'sar', 'السعودية', 'سعودية', 'المملكة'],
  },
  {
    code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت',
    currency: 'KWD', flag: '🇰🇼', group: 'gcc', decimals: 3, fixedPeg: false,
    searchAliases: ['kuwait', 'kw', 'kwd', 'الكويت', 'كويت'],
  },
  {
    code: 'QA', nameEn: 'Qatar', nameAr: 'قطر',
    currency: 'QAR', flag: '🇶🇦', group: 'gcc', decimals: 2, fixedPeg: false,
    searchAliases: ['qatar', 'qa', 'qar', 'قطر'],
  },
  {
    code: 'BH', nameEn: 'Bahrain', nameAr: 'البحرين',
    currency: 'BHD', flag: '🇧🇭', group: 'gcc', decimals: 3, fixedPeg: false,
    searchAliases: ['bahrain', 'bh', 'bhd', 'البحرين', 'بحرين'],
  },
  {
    code: 'OM', nameEn: 'Oman', nameAr: 'عُمان',
    currency: 'OMR', flag: '🇴🇲', group: 'gcc', decimals: 3, fixedPeg: false,
    searchAliases: ['oman', 'om', 'omr', 'عمان', 'عُمان'],
  },
  // Levant
  {
    code: 'JO', nameEn: 'Jordan', nameAr: 'الأردن',
    currency: 'JOD', flag: '🇯🇴', group: 'levant', decimals: 3, fixedPeg: false,
    searchAliases: ['jordan', 'jo', 'jod', 'الأردن', 'أردن'],
  },
  {
    code: 'LB', nameEn: 'Lebanon', nameAr: 'لبنان',
    currency: 'LBP', flag: '🇱🇧', group: 'levant', decimals: 0, fixedPeg: false,
    searchAliases: ['lebanon', 'lb', 'lbp', 'لبنان'],
  },
  {
    code: 'SY', nameEn: 'Syria', nameAr: 'سوريا',
    currency: 'SYP', flag: '🇸🇾', group: 'levant', decimals: 0, fixedPeg: false,
    searchAliases: ['syria', 'sy', 'syp', 'سوريا', 'سورية'],
  },
  {
    code: 'PS', nameEn: 'Palestine', nameAr: 'فلسطين',
    currency: 'ILS', flag: '🇵🇸', group: 'levant', decimals: 2, fixedPeg: false,
    searchAliases: ['palestine', 'ps', 'ils', 'فلسطين'],
  },
  // North & East Africa
  {
    code: 'EG', nameEn: 'Egypt', nameAr: 'مصر',
    currency: 'EGP', flag: '🇪🇬', group: 'africa', decimals: 2, fixedPeg: false,
    searchAliases: ['egypt', 'eg', 'egp', 'مصر'],
  },
  {
    code: 'LY', nameEn: 'Libya', nameAr: 'ليبيا',
    currency: 'LYD', flag: '🇱🇾', group: 'africa', decimals: 3, fixedPeg: false,
    searchAliases: ['libya', 'ly', 'lyd', 'ليبيا'],
  },
  {
    code: 'TN', nameEn: 'Tunisia', nameAr: 'تونس',
    currency: 'TND', flag: '🇹🇳', group: 'africa', decimals: 3, fixedPeg: false,
    searchAliases: ['tunisia', 'tn', 'tnd', 'تونس'],
  },
  {
    code: 'DZ', nameEn: 'Algeria', nameAr: 'الجزائر',
    currency: 'DZD', flag: '🇩🇿', group: 'africa', decimals: 2, fixedPeg: false,
    searchAliases: ['algeria', 'dz', 'dzd', 'الجزائر', 'جزائر'],
  },
  {
    code: 'MA', nameEn: 'Morocco', nameAr: 'المغرب',
    currency: 'MAD', flag: '🇲🇦', group: 'africa', decimals: 2, fixedPeg: false,
    searchAliases: ['morocco', 'ma', 'mad', 'المغرب', 'مغرب'],
  },
  {
    code: 'SD', nameEn: 'Sudan', nameAr: 'السودان',
    currency: 'SDG', flag: '🇸🇩', group: 'africa', decimals: 2, fixedPeg: false,
    searchAliases: ['sudan', 'sd', 'sdg', 'السودان', 'سودان'],
  },
  {
    code: 'SO', nameEn: 'Somalia', nameAr: 'الصومال',
    currency: 'SOS', flag: '🇸🇴', group: 'africa', decimals: 0, fixedPeg: false,
    searchAliases: ['somalia', 'so', 'sos', 'الصومال', 'صومال'],
  },
  {
    code: 'MR', nameEn: 'Mauritania', nameAr: 'موريتانيا',
    currency: 'MRU', flag: '🇲🇷', group: 'africa', decimals: 2, fixedPeg: false,
    searchAliases: ['mauritania', 'mr', 'mru', 'موريتانيا'],
  },
  {
    code: 'DJ', nameEn: 'Djibouti', nameAr: 'جيبوتي',
    currency: 'DJF', flag: '🇩🇯', group: 'africa', decimals: 0, fixedPeg: false,
    searchAliases: ['djibouti', 'dj', 'djf', 'جيبوتي'],
  },
  {
    code: 'KM', nameEn: 'Comoros', nameAr: 'جزر القمر',
    currency: 'KMF', flag: '🇰🇲', group: 'africa', decimals: 0, fixedPeg: false,
    searchAliases: ['comoros', 'km', 'kmf', 'جزر القمر', 'قمر'],
  },
  // Global Reference
  {
    code: 'US', nameEn: 'United States', nameAr: 'الولايات المتحدة',
    currency: 'USD', flag: '🇺🇸', group: 'global', decimals: 2, fixedPeg: false,
    searchAliases: ['usa', 'us', 'usd', 'united states', 'america', 'الولايات المتحدة', 'أمريكا'],
  },
  {
    code: 'GB', nameEn: 'United Kingdom', nameAr: 'المملكة المتحدة',
    currency: 'GBP', flag: '🇬🇧', group: 'global', decimals: 2, fixedPeg: false,
    searchAliases: ['uk', 'gb', 'gbp', 'britain', 'england', 'المملكة المتحدة', 'بريطانيا'],
  },
  {
    code: 'EU', nameEn: 'Eurozone', nameAr: 'منطقة اليورو',
    currency: 'EUR', flag: '🇪🇺', group: 'global', decimals: 2, fixedPeg: false,
    searchAliases: ['europe', 'eu', 'eur', 'eurozone', 'منطقة اليورو', 'يورو', 'أوروبا'],
  },
  {
    code: 'IN', nameEn: 'India', nameAr: 'الهند',
    currency: 'INR', flag: '🇮🇳', group: 'global', decimals: 2, fixedPeg: false,
    searchAliases: ['india', 'in', 'inr', 'الهند', 'هند'],
  },
];
