# Asset manifest

Every raster/vector content asset shipped by the site is recorded here with a verifiable license
(design language §6). Adding an asset without a manifest entry is a review blocker.

- **Processing:** photographs are graded/cropped/encoded by `scripts/images/build-images.py` (warm
  grade, AVIF/WebP/JPEG ladder). Source files are not committed; the script re-downloads them from
  the recorded source URL.
- **Attribution:** CC BY / CC BY-SA photos carry a visible credit link near the image. Our graded
  derivatives of CC BY-SA works are made available under the same license.

## Content photography (`assets/images/`)

| Asset (`assets/images/…`)                                     | Depicts                                                     | Source                                                                                                           | Author           | License                                                        | Source dims | Usage                                                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markets/dubai-gold-souk-{480,768,960}.{avif,webp,jpg}`       | Jewellery storefront, Gold Souk, Deira, Dubai (2014)        | [Wikimedia Commons](<https://commons.wikimedia.org/wiki/File:Gold_Souk_@_Deira_@_Dubai_(15698382719).jpg>)       | Guilhem Vellut   | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 3968×2976   | Homepage “Major Gold Markets” card (UAE)                                                                                                                                  |
| `markets/riyadh-dirah-souq-{480,768,960}.{avif,webp,jpg}`     | Covered souq alley, Ad Dirah market district, Riyadh (2014) | [Wikimedia Commons](<https://commons.wikimedia.org/wiki/File:Incense_souk_in_downtown_Riyadh_(12754047044).jpg>) | Francisco Anzola | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 5180×3873   | Homepage “Major Gold Markets” card (Saudi Arabia). Alt text names the Ad Dirah souq district — the photo shows a general souq alley there, not the gold shops themselves. |
| `markets/kuwait-mubarakiya-{480,768,960}.{avif,webp,jpg}`     | Covered walkway, Souq Al-Mubarakiya, Kuwait City (2022)     | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kuwait_City_Souq_al-Mubarakeya_1.jpg)                | Zairon           | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)       | 4553×3444   | Homepage “Major Gold Markets” card (Kuwait)                                                                                                                               |
| `markets/cairo-khan-el-khalili-{480,768,960}.{avif,webp,jpg}` | Lantern stall, Khan el-Khalili, Cairo (2019)                | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Khan_el-Khalili_2019.jpg)                            | Mohammed Moussa  | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 4603×4000   | Homepage “Major Gold Markets” card (Egypt). Graded derivative shared under CC BY-SA 4.0.                                                                                  |

## Generated / owned artwork

| Asset                                                                                  | Source                                                                                                                                  | License                      | Usage                                           |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------- |
| `assets/og/*.png` (10 section cards + 21 country cards)                                | AI backdrop (HiggsField `nano_banana_pro`) + composited type per `assets/og/README.md`; abstract gold material only, no numerals/charts | Owned (generated)            | Per-page `og:image` / `twitter:image`           |
| `assets/og-image.png`, `assets/og-image.svg`                                           | Same programme, homepage card                                                                                                           | Owned (generated)            | Homepage OG card                                |
| `assets/hero/gold-bullion-band.webp`                                                   | AI-generated abstract bullion texture (labelled generated; depicts no real place)                                                       | Owned (generated)            | Homepage trust-banner CSS background            |
| `assets/social/x-follow-banner-{960,1920}.webp`                                        | Owned brand artwork                                                                                                                     | Owned                        | Homepage X-follow banner (`alt=""`, decorative) |
| Icon sprite (`src/components/icon-sprite.js`, inlined in `index.html`/`ar/index.html`) | Hand-drawn monoline symbols + simplified SVG flags                                                                                      | Owned (Apache-2.0 with repo) | Sitewide UI iconography                         |
| `favicon.svg`, `favicon.ico`, `assets/favicon-*.png`, `assets/apple-touch-icon.png`    | Owned brand mark                                                                                                                        | Owned                        | Favicons / PWA icons                            |
| `assets/screenshots/*.png`                                                             | Own product screenshots                                                                                                                 | Owned                        | PWA manifest / docs                             |

## Fonts

See [`assets/fonts/LICENSES.md`](./fonts/LICENSES.md) — Source Sans 3 and Cairo, SIL OFL 1.1,
self-hosted subsets.
