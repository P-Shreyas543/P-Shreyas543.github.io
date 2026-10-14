"""Generate the Projectify Zone logo system as SVG.

Letters are drawn as PCB traces on a 40-unit cap height: monoline strokes,
45-degree chamfered corners, and round solder pads on selected terminals.
"""
import os
import sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

SW = 5          # stroke width
CAP = 40        # cap height
GAP = 10        # letter spacing
WORD_GAP = 24   # space between PROJECTIFY and ZONE
PAD_R = 4.4     # solder pad radius

# Each glyph: (width, path, [pad points])
G = {
    'P': (28, 'M0 40V0H20L28 8V14L20 22H0', [(0, 40)]),
    'R': (28, 'M0 40V0H20L28 8V14L20 22H0M15 22L28 35V40', [(0, 40)]),
    'O': (28, 'M8 0H20L28 8V32L20 40H8L0 32V8Z', []),
    'J': (24, 'M8 0H24V32L16 40H8L0 32V28', [(0, 28)]),
    'E': (26, 'M26 0H0V40H26M0 20H18', []),
    'C': (27, 'M27 0H8L0 8V32L8 40H27', []),
    'T': (28, 'M0 0H28M14 0V40', [(14, 40)]),
    'I': (0, 'M0 0V40', []),
    'F': (26, 'M26 0H0V40M0 20H18', [(0, 40)]),
    'Y': (28, 'M0 0V6L14 20L28 6V0M14 20V40', [(14, 40)]),
    'Z': (28, 'M0 0H28V6L0 34V40H28', []),
    'N': (28, 'M0 40V0H3L25 40H28V0', []),
}


def word(text, x0=0.0, y0=0.0, scale=1.0, gap=GAP):
    """Return (list of (char, transform, glyph)), total width."""
    items, x = [], 0.0
    for i, ch in enumerate(text):
        w, path, pads = G[ch]
        items.append((ch, x, path, pads))
        g = gap
        # Optical spacing around the narrow I: tighter after T's open bar,
        # looser before the next stem so the two verticals don't merge
        if i < len(text) - 1 and text[i + 1] == 'I':
            g = gap * 0.7
        elif ch == 'I':
            g = gap * 1.25
        x += w + (g if i < len(text) - 1 else 0)
    return items, x


def glyphs_svg(text, cls_for, tx, ty, scale=1.0, gap=GAP):
    items, width = word(text, gap=gap)
    parts = []
    for i, (ch, x, path, pads) in enumerate(items):
        cls = cls_for(i, ch)
        circles = ''.join(f'<circle cx="{px}" cy="{py}" r="{PAD_R}"/>' for px, py in pads)
        parts.append(f'<g class="{cls}" transform="translate({x:g} 0)"><path d="{path}"/>{circles}</g>')
    return f'<g transform="translate({tx:g} {ty:g}) scale({scale:g})">' + ''.join(parts) + '</g>', width * scale


def proj_cls(i, ch):
    return 'a' if i < 7 else 'b'   # PROJECT | IFY


def zone_cls(i, ch):
    return 'a' if i == 0 else 'b'  # Z | ONE


PALETTES = {
    'on-dark':  ('#22d3ee', '#f472b6'),
    'on-light': ('#0891b2', '#db2777'),
    'black':    ('#0b0f19', '#0b0f19'),
    'white':    ('#ffffff', '#ffffff'),
}


def style(a, b, glow=False):
    f = ''
    if glow:
        f = '.a{filter:url(#glow-a)}.b{filter:url(#glow-b)}'
    return (f'<style>g.a,g.b{{fill:none;stroke-width:{SW};stroke-linecap:round;stroke-linejoin:round}}'
            f'.a{{stroke:{a}}}.b{{stroke:{b}}}.a circle{{fill:{a};stroke:none}}.b circle{{fill:{b};stroke:none}}{f}</style>')


def icon_inner(a, b):
    """PZ monogram as traces, drawn in a 64x64 box."""
    return (
        f'<g fill="none" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">'
        f'<path stroke="{a}" d="M10 50V14H20L26 20V28L20 34H10"/>'
        f'<circle fill="{a}" cx="10" cy="50" r="4.6"/>'
        f'<path stroke="{b}" d="M35 14H54V19L35 45V50H54"/>'
        f'<circle fill="{b}" cx="54" cy="14" r="4.6"/>'
        f'</g>'
    )


def icon_svg(variant):
    if variant == 'dark':
        bg, a, b = '#0b0f19', '#22d3ee', '#f472b6'
    else:
        bg, a, b = '#ffffff', '#0891b2', '#db2777'
    border = '' if variant == 'dark' else '<rect x=".75" y=".75" width="62.5" height="62.5" rx="13.25" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Projectify Zone">'
            f'<rect width="64" height="64" rx="14" fill="{bg}"/>{border}{icon_inner(a, b)}</svg>')


def horizontal(variant, with_icon=True):
    a, b = PALETTES[variant]
    m = SW  # margin so strokes/pads aren't clipped
    proj, wp = glyphs_svg('PROJECTIFY', proj_cls, 0, 0)
    zone_items, wz = word('ZONE')
    x = 0
    body = ''
    if with_icon:
        ia, ib = (a, b)
        # Icon tile uses its own fixed dark/light treatment for contrast
        tile = '#0b0f19' if variant in ('on-dark', 'on-light') else 'none'
        if variant == 'on-light':
            ia, ib = '#22d3ee', '#f472b6'
        if variant in ('black', 'white'):
            body += f'<g transform="translate(0 -12) scale(1)"><rect width="64" height="64" rx="14" fill="none" stroke="{a}" stroke-width="3"/>{icon_inner(a, a)}</g>'
        else:
            body += f'<g transform="translate(0 -12)"><rect width="64" height="64" rx="14" fill="{tile}"/>{icon_inner(ia, ib)}</g>'
        x = 64 + 22
    p, _ = glyphs_svg('PROJECTIFY', proj_cls, x, 0)
    z, _ = glyphs_svg('ZONE', zone_cls, x + wp + WORD_GAP, 0)
    body += p + z
    total_w = x + wp + WORD_GAP + wz
    top = -12 if with_icon else 0
    h = 64 if with_icon else CAP
    vb = f'{-m} {top - m} {total_w + 2 * m:g} {h + 2 * m}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Projectify Zone">'
            f'{style(a, b)}{body}</svg>')


def stacked(variant, glow=False):
    a, b = PALETTES[variant]
    items, wp = word('PROJECTIFY')
    _, wz_raw = word('ZONE', gap=GAP)
    scale = 2.1
    # Spread ZONE so its width matches PROJECTIFY at the chosen scale
    zgap = (wp / scale - sum(G[c][0] for c in 'ZONE')) / 3
    p, _ = glyphs_svg('PROJECTIFY', proj_cls, 0, 0)
    z, wz = glyphs_svg('ZONE', zone_cls, 0, CAP + 24, scale=scale, gap=zgap)
    # Keep ZONE's rendered stroke ~1.5x PROJECTIFY's instead of the full scale factor
    z = z.replace('<g class="', f'<g style="stroke-width:{SW * 1.5 / scale:.2f}" class="')
    h = CAP + 24 + CAP * scale
    defs = ''
    pad = SW * 2
    bg = ''
    if glow:
        pad = 60
        defs = ('<defs>'
                '<filter id="glow-a" filterUnits="userSpaceOnUse" x="-60" y="-60" width="600" height="300"><feGaussianBlur stdDeviation="3.5" result="b"/>'
                '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
                '<filter id="glow-b" filterUnits="userSpaceOnUse" x="-60" y="-60" width="600" height="300"><feGaussianBlur stdDeviation="3.5" result="b"/>'
                '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
                '</defs>')
        bg = f'<rect x="{-pad}" y="{-pad}" width="{wp + 2 * pad:g}" height="{h + 2 * pad:g}" fill="#07090f"/>'
    vb = f'{-pad} {-pad} {wp + 2 * pad:g} {h + 2 * pad:g}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Projectify Zone">'
            f'{defs}{style(a, b, glow)}{bg}{p}{z}</svg>')


def write(name, svg):
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(svg + '\n')


for v in PALETTES:
    write(f'logo-horizontal-{v}.svg', horizontal(v))
    write(f'wordmark-{v}.svg', horizontal(v, with_icon=False))
    write(f'logo-stacked-{v}.svg', stacked(v))
write('logo-stacked-neon.svg', stacked('on-dark', glow=True))
write('icon-dark.svg', icon_svg('dark'))
write('icon-light.svg', icon_svg('light'))
print('ok')
