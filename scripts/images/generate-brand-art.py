#!/usr/bin/env python3
"""generate-brand-art.py — owned, procedurally generated brand artwork.

Draws parametric guilloche ribbons (the engraved security-print lattice used
on banknotes and bullion certificates) — the "Precision Instrument" register
rendered as ornament. Everything is math: no source photograph, no AI model,
no external asset. Outputs are committed; this script exists so any variant
can be regenerated deterministically.

    python3 scripts/images/generate-brand-art.py          # build all
    python3 scripts/images/generate-brand-art.py --check  # verify outputs

Register every emitted file in assets/MANIFEST.md (Owned, generated).
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'assets' / 'brand'

# palette (matches styles/partials/tokens.css)
INK = (21, 17, 10)  # --color-text ink
PARCHMENT = (247, 243, 233)  # warm paper
GOLD = (201, 163, 92)  # --color-gold family
GOLD_DEEP = (138, 106, 47)

SS = 3  # supersampling factor


def band(width, height, dark: bool):
    """A wide guilloche border band: interleaved sine ribbons with a phase
    lattice, denser toward the vertical centre — reads as engraved foil."""
    from PIL import Image, ImageDraw, ImageFilter

    w, h = width * SS, height * SS
    bg = INK if dark else PARCHMENT
    line = GOLD if dark else GOLD_DEEP
    img = Image.new('RGB', (w, h), bg)
    draw = ImageDraw.Draw(img, 'RGBA')

    ribbons = 14
    for i in range(ribbons):
        # each ribbon: y(x) = centre + spread·sin(fx + φ), phase-fanned
        phase = i * math.pi / 7
        freq = 2 * math.pi * (3 + (i % 4)) / w
        spread = h * (0.16 + 0.05 * (i % 5))
        centre = h / 2
        alpha = 46 if dark else 40
        pts = []
        for x in range(0, w + 8, 8):
            y = centre + spread * math.sin(freq * x + phase) * math.cos(
                0.5 * freq * x - phase / 2
            )
            pts.append((x, y))
        draw.line(pts, fill=(*line, alpha), width=SS)

    # counter-ribbons mirrored for the lattice weave
    for i in range(ribbons):
        phase = i * math.pi / 7 + math.pi / 3
        freq = 2 * math.pi * (3 + (i % 4)) / w
        spread = h * (0.16 + 0.05 * (i % 5))
        alpha = 34 if dark else 30
        pts = []
        for x in range(0, w + 8, 8):
            y = h / 2 - spread * math.sin(freq * x + phase) * math.cos(
                0.5 * freq * x - phase / 2
            )
            pts.append((x, y))
        draw.line(pts, fill=(*line, alpha), width=SS)

    # soft edge fade so the band blends into panels
    mask = Image.new('L', (w, h), 255)
    fade = ImageDraw.Draw(mask)
    for y in range(h):
        edge = min(y, h - 1 - y) / (h * 0.5)
        fade.line([(0, y), (w, y)], fill=int(255 * min(1.0, edge * 2.2)))
    base = Image.new('RGB', (w, h), bg)
    img = Image.composite(img, base, mask.filter(ImageFilter.GaussianBlur(SS * 2)))

    return img.resize((width, height), Image.LANCZOS)


def rosette(size, dark: bool):
    """A circular guilloche rosette (hypotrochoid family) — the classic
    engraved seal motif, used as a corner ornament."""
    from PIL import Image, ImageDraw

    s = size * SS
    bg = INK if dark else PARCHMENT
    line = GOLD if dark else GOLD_DEEP
    img = Image.new('RGBA', (s, s), (*bg, 0))
    draw = ImageDraw.Draw(img, 'RGBA')
    cx = cy = s / 2

    for k in range(6):
        R = s * 0.44
        r = R * (0.22 + 0.03 * k)
        d = r * (1.35 + 0.08 * k)
        alpha = 60 if dark else 52
        pts = []
        steps = 1400
        for t in range(steps + 1):
            th = t / steps * 2 * math.pi * (r / math.gcd(int(R), int(r)) if False else 12)
            x = (R - r) * math.cos(th) + d * math.cos((R - r) / r * th)
            y = (R - r) * math.sin(th) - d * math.sin((R - r) / r * th)
            scale = s * 0.44 / (R - r + d)
            pts.append((cx + x * scale, cy + y * scale))
        draw.line(pts, fill=(*line, alpha), width=SS)

    return img.resize((size, size), Image.LANCZOS)


SPECS = [
    ('guilloche-band-dark-1600', lambda: band(1600, 220, dark=True), 'webp'),
    ('guilloche-band-light-1600', lambda: band(1600, 220, dark=False), 'webp'),
    ('guilloche-rosette-dark-360', lambda: rosette(360, dark=True), 'webp'),
    ('guilloche-rosette-light-360', lambda: rosette(360, dark=False), 'webp'),
]


def main() -> int:
    check = '--check' in sys.argv
    missing = []
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn, fmt in SPECS:
        dest = OUT / f'{name}.{fmt}'
        if check:
            if not dest.exists():
                missing.append(dest)
            continue
        img = fn()
        if fmt == 'webp':
            img.save(dest, 'WEBP', quality=74, method=6)  # RGBA WebP keeps alpha
        else:
            img.save(dest, 'PNG', optimize=True)
        print(f'  {dest.relative_to(REPO)}  {dest.stat().st_size / 1024:.1f} KB')
    if check:
        if missing:
            for p in missing:
                print('  missing:', p.relative_to(REPO))
            return 1
        print('[brand-art] all outputs present.')
        return 0
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
