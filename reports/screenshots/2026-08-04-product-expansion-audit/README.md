# Product expansion audit screenshots — 2026-08-04

These images are evidence captured during the repository/live-product audit. They are not a
production visual-regression baseline.

| File                           | Surface                     | Language / direction | Viewport evidence                                                                                                               |
| ------------------------------ | --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `homepage-live-settled.png`    | Live homepage               | EN / LTR             | Settled desktop viewport in the persistent browser session                                                                      |
| `homepage-ar-rtl.png`          | Live homepage               | AR / RTL             | Arabic RTL shell and hero in the persistent browser session                                                                     |
| `calculator-live-390x844.png`  | Live calculator             | EN / LTR             | Verified true 390×844 viewport                                                                                                  |
| `homepage-live-viewport.png`   | Live homepage               | EN / LTR             | Initial viewport capture; reveal animation had not fully settled                                                                |
| `homepage-live-390x844.png`    | Live homepage attempt       | EN / LTR             | Retained for audit trace; browser session did not apply the requested mobile viewport, so it must not be treated as 390px proof |
| `deal-checker-en-390x844.png`  | Local Deal Intelligence Lab | EN / LTR             | Verified true 390×844 viewport with populated quote inputs                                                                      |
| `deal-checker-ar-390x844.png`  | Local Deal Intelligence Lab | AR / RTL             | Verified true 390×844 viewport with Arabic shell, breadcrumbs, and form layout                                                  |
| `deal-checker-en-1280x900.png` | Local Deal Intelligence Lab | EN / LTR             | Verified 1280×900 desktop viewport with form and comparison panels                                                              |

The audit verified the live EN/AR shell, visible reference-vs-retail framing, source/freshness
labels, calculator entry path, and mobile calculator composition. The D1 local page was also checked
at true 390px EN/AR and 1280px desktop widths. A future browser QA phase should capture a clean
matrix at 360, 390, 768, 1280, and 1440px in EN/AR and light/dark.
