"""Turn fish illustrations into a consistent pixel-art sprite set.

Usage: python3 -I pixelate.py SRC_DIR OUT_DIR
Steps per image: knock out the background by flood-filling from the borders,
crop to the fish, downscale to 64 px wide, reduce to a small palette, then add
a 1 px dark outline like classic game sprites.
"""
import json, sys
from collections import deque
from PIL import Image, ImageFilter, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
WIDTH = 64

# key -> (species slug, background tolerance, optional crop box as fractions, tint for line art)
JOBS = {
    '01': ('largemouth-bass', 40, None, None),
    '03': ('smallmouth-bass', 40, None, None),
    '04': ('spotted-bass', -70, None, None),
    '05': ('bluegill', 40, None, None),
    '07': ('redear-sunfish', 40, None, None),
    '08': ('green-sunfish', 40, None, None),
    '09': ('rock-bass', 30, (0, 0, 1, 0.9), ((52, 40, 18), (206, 170, 92))),
    '11': ('crappie', 40, None, None),
    '12': ('channel-catfish', 40, None, None),
    '13': ('blue-catfish', 40, None, None),
    '14': ('flathead-catfish', 40, None, None),
    '15': ('rainbow-trout', 40, None, None),
    '16': ('sauger', 45, None, None),
    '17': ('white-bass', 40, None, None),
    '18': ('striped-bass', 40, None, None),
    '19': ('freshwater-drum', 40, None, None),
    '20': ('common-carp', 40, None, None),
    '21': ('skipjack-herring', 40, None, None),
    '22': ('pumpkinseed', 40, None, None),
    '23': ('chain-pickerel', 40, None, None),
    '24': ('yellow-perch', 40, None, None),
    '25': ('white-perch', 40, None, None),
    '26': ('spot', -60, None, None),
    '29': ('atlantic-croaker', 30, None, ((58, 52, 44), (232, 214, 172))),
    '31': ('northern-snakehead', 40, (0.08, 0.18, 0.95, 0.55), None),
}


def dist(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def knockout(img, tol):
    """Flood-fill from every border pixel; pixels similar to their neighbour chain become transparent."""
    img = img.convert('RGB')
    w, h = img.size
    px = img.load()
    bg = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    seeds = {(x, y): px[x, y] for x, y in q}
    while q:
        x, y = q.popleft()
        if bg[y][x]:
            continue
        bg[y][x] = True
        c = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                n = px[nx, ny]
                # Compare to the current pixel (gradients) AND keep close to some border colour.
                if dist(n, c) <= tol // 3 + 6 and dist(n, seeds.get((x, y), c)) <= tol * 2:
                    seeds[(nx, ny)] = seeds.get((x, y), c)
                    q.append((nx, ny))
    alpha = Image.new('L', (w, h), 255)
    a = alpha.load()
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                a[x, y] = 0
    # Drop specks and soften the edge a little before downscaling.
    alpha = alpha.filter(ImageFilter.MedianFilter(5))
    out = img.convert('RGBA')
    out.putalpha(alpha)
    return out


def colorkey(img, tol):
    """For photos on a plain coloured backdrop: remove every pixel near the median border colour."""
    img = img.convert('RGB')
    w, h = img.size
    px = img.load()
    border = sorted([px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)])
    bgc = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    alpha = Image.new('L', (w, h), 0)
    a = alpha.load()
    for y in range(h):
        for x in range(w):
            a[x, y] = 255 if dist(px[x, y], bgc) > tol else 0
    alpha = alpha.filter(ImageFilter.MedianFilter(7))
    out = img.convert('RGBA')
    out.putalpha(alpha)
    return out


def largest_blob_bbox(alpha):
    """Bounding box of the biggest opaque region (ignores captions, signatures, plants)."""
    w, h = alpha.size
    a = alpha.load()
    seen = [[False] * w for _ in range(h)]
    best = (0, None)
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if a[x, y] > 128 and not seen[y][x]:
                q = deque([(x, y)]); seen[y][x] = True
                n = 0; x0 = x1 = x; y0 = y1 = y
                while q:
                    cx, cy = q.popleft(); n += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and a[nx, ny] > 128:
                            seen[ny][nx] = True; q.append((nx, ny))
                if n > best[0]:
                    best = (n, (x0, y0, x1 + 1, y1 + 1))
    return best[1]


def pixelate(img, tint):
    a = img.getchannel('A')
    small_h = max(8, round(img.height * WIDTH / img.width))
    rgb = img.convert('RGB')
    if tint:
        rgb = ImageOps.colorize(ImageOps.autocontrast(rgb.convert('L'), cutoff=2), black=tint[0], white=tint[1])
    if not tint:  # per-channel contrast would undo a tint
        rgb = ImageOps.autocontrast(rgb, cutoff=1)
    rgb = rgb.resize((WIDTH, small_h), Image.LANCZOS)
    a = a.resize((WIDTH, small_h), Image.LANCZOS).point(lambda v: 255 if v > 110 else 0)
    # A small palette keeps the sprite looking hand-drawn.
    q = rgb.quantize(colors=20, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    q = q.point(lambda v: min(255, int(v * 1.04)))  # tiny lift so dark fish stay readable
    sprite = q.convert('RGBA')
    sprite.putalpha(a)
    # 1 px outline in a dark navy, drawn on a canvas with a 1 px margin.
    W, H = WIDTH + 2, small_h + 2
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(sprite, (1, 1), sprite)
    cp = canvas.load()
    outline = []
    for y in range(H):
        for x in range(W):
            if cp[x, y][3] == 0 and any(
                0 <= x + dx < W and 0 <= y + dy < H and cp[x + dx, y + dy][3] == 255
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
                outline.append((x, y))
    for x, y in outline:
        cp[x, y] = (22, 33, 52, 255)
    return canvas


def main():
    meta = json.load(open(f'{SRC}/meta.json'))
    out_meta = {}
    for key, (slug, tol, crop, tint) in JOBS.items():
        img = Image.open(f'{SRC}/{key}.img').convert('RGB')
        if crop:
            w, h = img.size
            img = img.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
        cut = knockout(img, tol) if tol > 0 else colorkey(img, -tol)
        box = largest_blob_bbox(cut.getchannel('A'))
        cut = cut.crop(box)
        # Keep only the main blob's pixels inside the box (removes stray bits).
        sprite = pixelate(cut, tint)
        sprite.save(f'{OUT}/{slug}.png', optimize=True)
        m = meta[key]
        out_meta[slug] = {'file': m['file'], 'artist': m['artist'], 'license': m['license'], 'size': sprite.size}
        print(slug, sprite.size)
    json.dump(out_meta, open(f'{OUT}/credits.json', 'w'), indent=1)


main()
