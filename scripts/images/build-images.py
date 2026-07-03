#!/usr/bin/env python3
"""build-images.py — Gold Ticker Live content-image pipeline.

Single source of processing truth for content photography (design language §6,
docs/design-language.md). For every entry in SHOTS it:

  1. downloads the licensed source photo (skipped when cached in .image-src/),
  2. applies the shared warm grade (desaturate → warm curve → soft vignette)
     so mixed-source photos read as one family,
  3. center-crops to the target aspect and emits a resize ladder,
  4. encodes AVIF + WebP + JPEG fallback into assets/images/…

Every emitted asset MUST have a matching entry in assets/MANIFEST.md
(source, author, license). Run from the repo root:

    python3 scripts/images/build-images.py                  # build all
    python3 scripts/images/build-images.py --check          # verify outputs exist + budget
    python3 scripts/images/build-images.py --only <substr>  # rebuild matching slugs

Dependencies: Pillow + pillow-avif-plugin (pip install pillow pillow-avif-plugin).
No npm dependency is involved — outputs are committed, so the site build never
needs this script; it exists for reproducibility and future additions.
"""

from __future__ import annotations

import io
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SRC_CACHE = REPO / '.image-src'  # gitignored download cache
OUT = REPO / 'assets' / 'images'

UA = {'User-Agent': 'GoldTickerLive-image-pipeline/1.0 (https://goldtickerlive.com)'}

# ── Shot list ────────────────────────────────────────────────────────────────
# aspect is W:H of the emitted crop; widths are the emitted resize ladder.
SHOTS = [
    {
        'slug': 'markets/dubai-gold-souk',
        'source': 'https://upload.wikimedia.org/wikipedia/commons/2/26/Gold_Souk_%40_Deira_%40_Dubai_%2815698375319%29.jpg'.replace('15698375319', '15698382719'),
        'aspect': (4, 3),
        'widths': (480, 768, 960),
    },
    {
        'slug': 'markets/riyadh-dirah-souq',
        'source': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Incense_souk_in_downtown_Riyadh_%2812754047044%29.jpg',
        'aspect': (4, 3),
        'widths': (480, 768, 960),
    },
    {
        'slug': 'markets/kuwait-mubarakiya',
        'source': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Kuwait_City_Souq_al-Mubarakeya_1.jpg',
        'aspect': (4, 3),
        'widths': (480, 768, 960),
        # detail-heavy walkway; drop fallback quality to hold the budget
        'quality': {'webp': 58, 'jpg': 54},
    },
    {
        'slug': 'markets/cairo-khan-el-khalili',
        'source': 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Khan_el-Khalili_2019.jpg',
        'aspect': (4, 3),
        'widths': (480, 768, 960),
        # lantern-detail image; drop JPEG quality to hold the budget
        'quality': {'jpg': 66},
    },
]

# Per-format quality tuned for warm low-detail-shadow market photography.
QUALITY = {'avif': 52, 'webp': 68, 'jpg': 72}

# Hard weight ceiling per emitted file (session budget; enforced again in CI
# by tests/asset-manifest-guard.test.js). `_headers` freezes image URLs in
# caches for a year, so an oversized file must never land.
BUDGET_KB = 120


def fetch(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r:
        dest.write_bytes(r.read())


def grade(img):
    """The shared warm grade: one look across all content photography."""
    from PIL import Image, ImageEnhance

    img = img.convert('RGB')
    # 1. calm the palette (≈72% saturation)
    img = ImageEnhance.Color(img).enhance(0.72)
    # 2. warm curve — lift red midtones a touch, pull blue down slightly
    r, g, b = img.split()
    r = r.point(lambda v: min(255, int(v * 1.045 + 2)))
    b = b.point(lambda v: int(v * 0.94))
    img = Image.merge('RGB', (r, g, b))
    # 3. gentle contrast + soft corner vignette toward ink
    img = ImageEnhance.Contrast(img).enhance(1.04)
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    from PIL import ImageDraw, ImageFilter

    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.25, -h * 0.25, w * 1.25, h * 1.25), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=min(w, h) * 0.12))
    shadow = Image.new('RGB', (w, h), (21, 17, 10))  # --color-text ink
    img = Image.composite(img, Image.blend(shadow, img, 0.82), mask)
    return img


def center_crop(img, aspect):
    w, h = img.size
    aw, ah = aspect
    target = aw / ah
    cur = w / h
    if cur > target:
        nw = int(h * target)
        x = (w - nw) // 2
        box = (x, 0, x + nw, h)
    else:
        nh = int(w / target)
        y = (h - nh) // 2
        box = (0, y, w, y + nh)
    return img.crop(box)


def build(shot) -> list[Path]:
    from PIL import Image

    try:
        import pillow_avif  # noqa: F401  (registers AVIF codec)
    except ImportError:
        pass
    slug = shot['slug']
    src = SRC_CACHE / (slug.replace('/', '__') + '.src')
    fetch(shot['source'], src)
    img = grade(center_crop(Image.open(src), shot['aspect']))
    outputs = []
    for width in shot['widths']:
        aw, ah = shot['aspect']
        height = int(width * ah / aw)
        resized = img.resize((width, height), Image.LANCZOS)
        for fmt in ('avif', 'webp', 'jpg'):
            dest = OUT / f'{slug}-{width}.{fmt}'
            dest.parent.mkdir(parents=True, exist_ok=True)
            buf = io.BytesIO()
            quality = {**QUALITY, **shot.get('quality', {})}
            resized.save(
                buf,
                format='JPEG' if fmt == 'jpg' else fmt.upper(),
                quality=quality[fmt],
                **({'progressive': True, 'optimize': True} if fmt == 'jpg' else {}),
            )
            dest.write_bytes(buf.getvalue())
            outputs.append(dest)
    return outputs


def main() -> int:
    check = '--check' in sys.argv
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    missing = []
    over_budget = []
    total = 0
    for shot in SHOTS:
        if only and not check and only not in shot['slug']:
            continue
        expected = [
            OUT / f"{shot['slug']}-{w}.{fmt}" for w in shot['widths'] for fmt in ('avif', 'webp', 'jpg')
        ]
        if check:
            missing += [p for p in expected if not p.exists()]
            over_budget += [
                p for p in expected if p.exists() and p.stat().st_size > BUDGET_KB * 1024
            ]
            continue
        for p in build(shot):
            kb = p.stat().st_size / 1024
            total += kb
            flag = f'  ⚠ over {BUDGET_KB} KB budget' if kb > BUDGET_KB else ''
            print(f'  {p.relative_to(REPO)}  {kb:.1f} KB{flag}')
    if check:
        if missing:
            print('[build-images] missing outputs:')
            for p in missing:
                print('  -', p.relative_to(REPO))
        if over_budget:
            print(f'[build-images] outputs above the {BUDGET_KB} KB budget (lower per-shot quality):')
            for p in over_budget:
                print(f'  - {p.relative_to(REPO)}  {p.stat().st_size / 1024:.1f} KB')
        if missing or over_budget:
            return 1
        print('[build-images] all expected outputs present and within budget.')
        return 0
    print(f'[build-images] done — {total:.0f} KB emitted.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
