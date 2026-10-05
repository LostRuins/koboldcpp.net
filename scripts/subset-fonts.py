#!/usr/bin/env python3
"""Build the site's font files in src/assets/fonts/ from the @fontsource packages in node_modules.

Smaller than the packages' own files: only the characters below, and Atkinson Hyperlegible Next and Mono
only from weight 400 to 700 (the weights the CSS uses). Characters outside the list fall back to
the next font in the CSS stack. Needs fonttools: `pip install fonttools brotli`.

Run from the repo root after updating a @fontsource package or when content needs new characters:
    python3 scripts/subset-fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# ASCII, Latin-1, dashes, quotes, bullet, ellipsis, primes, arrows, minus, almost-equal.
UNICODES = 'U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+2190-2193,U+2212,U+2248'

FONTS = [
    ('@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2',
     'atkinson-hyperlegible-next.woff2', (400, 700)),
    ('@fontsource-variable/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-wght-normal.woff2',
     'atkinson-hyperlegible-mono.woff2', (400, 700)),
    ('@fontsource/young-serif/files/young-serif-latin-400-normal.woff2', 'young-serif.woff2', None),
]

root = Path(__file__).resolve().parent.parent
out_dir = root / 'src/assets/fonts'
out_dir.mkdir(parents=True, exist_ok=True)

for source, target, weights in FONTS:
    font = TTFont(root / 'node_modules' / source)
    subsetter = subset.Subsetter(subset.Options())
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    if weights:
        font = instancer.instantiateVariableFont(font, {'wght': weights})
    path = out_dir / target
    font.flavor = 'woff2'
    font.save(path)
    print(f'{target}: {path.stat().st_size} bytes')
