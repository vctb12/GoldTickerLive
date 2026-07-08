# Runtime console capture

Base: `http://localhost:8199` · pages × {en, ar}

| Page                  | Locale | console.error | pageerror | failed req (>=400) |
| --------------------- | ------ | ------------: | --------: | -----------------: |
| 404.html              | en     |             0 |         0 |                  0 |
| 404.html              | ar     |             0 |         0 |                  0 |
| calculator.html       | en     |             0 |         0 |                  0 |
| calculator.html       | ar     |             0 |         0 |                  0 |
| compare.html          | en     |             0 |         0 |                  0 |
| compare.html          | ar     |             0 |         0 |                  0 |
| dubai-gold-price.html | en     |             0 |         0 |                  0 |
| dubai-gold-price.html | ar     |             0 |         0 |                  0 |
| glossary.html         | en     |             0 |         0 |                  0 |
| glossary.html         | ar     |             0 |         0 |                  0 |
| heatmap.html          | en     |             0 |         0 |                  0 |
| heatmap.html          | ar     |             0 |         0 |                  0 |
| index.html            | en     |             0 |         0 |                  0 |
| index.html            | ar     |             0 |         0 |                  0 |
| learn.html            | en     |             0 |         0 |                  0 |
| learn.html            | ar     |             0 |         0 |                  0 |
| market.html           | en     |             0 |         0 |                  0 |
| market.html           | ar     |             0 |         0 |                  0 |
| methodology.html      | en     |             0 |         0 |                  0 |
| methodology.html      | ar     |             0 |         0 |                  0 |
| offline.html          | en     |             2 |         0 |                  2 |
| offline.html          | ar     |             2 |         0 |                  2 |
| portfolio.html        | en     |             0 |         0 |                  0 |
| portfolio.html        | ar     |             0 |         0 |                  0 |
| privacy.html          | en     |             0 |         0 |                  0 |
| privacy.html          | ar     |             0 |         0 |                  0 |
| shops.html            | en     |             0 |         0 |                  0 |
| shops.html            | ar     |             0 |         0 |                  0 |
| terms.html            | en     |             0 |         0 |                  0 |
| terms.html            | ar     |             0 |         0 |                  0 |
| tracker.html          | en     |             0 |         0 |                  0 |
| tracker.html          | ar     |             0 |         0 |                  0 |

**Total console.error + pageerror across all pages/locales: 4**

## Details (non-clean pages)

### offline.html · en

- console.error: Failed to load resource: net::ERR_CONNECTION_RESET
- console.error: Failed to load resource: net::ERR_CONNECTION_RESET
- reqfail: net::ERR_CONNECTION_RESET https://www.googletagmanager.com/gtag/js?id=G-K3GNY9M8TE
- reqfail: net::ERR_CONNECTION_RESET https://www.clarity.ms/tag/w4e0nhdxt5

### offline.html · ar

- console.error: Failed to load resource: net::ERR_CONNECTION_RESET
- console.error: Failed to load resource: net::ERR_CONNECTION_RESET
- reqfail: net::ERR_CONNECTION_RESET https://www.googletagmanager.com/gtag/js?id=G-K3GNY9M8TE
- reqfail: net::ERR_CONNECTION_RESET https://www.clarity.ms/tag/w4e0nhdxt5
