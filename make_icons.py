#!/usr/bin/env python3
"""아이콘 PNG 생성기 — 외부 라이브러리 없이 stdlib 만 사용.

체크마크 모양을 distance-to-segment 알고리즘으로 그려서 PNG 출력.
"""
import struct
import zlib


def chunk(name, data):
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data))


def write_png(path, w, h, pixels_rgb):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter byte
        raw.extend(pixels_rgb[y * w * 3:(y + 1) * w * 3])
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def dist_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    if L2 == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / L2
    t = max(0.0, min(1.0, t))
    proj_x = ax + t * dx
    proj_y = ay + t * dy
    return ((px - proj_x) ** 2 + (py - proj_y) ** 2) ** 0.5


def make_icon(size, out):
    bg = (14, 165, 233)        # sky-500
    fg = (255, 255, 255)
    radius = size * 0.18       # rounded corners
    thickness = size * 0.085
    # Checkmark anchors (in pixel coords)
    p1 = (0.30 * size, 0.52 * size)
    p2 = (0.43 * size, 0.66 * size)
    p3 = (0.72 * size, 0.34 * size)

    pixels = bytearray(size * size * 3)
    for y in range(size):
        for x in range(size):
            # rounded square check
            corner_x = min(x, size - 1 - x)
            corner_y = min(y, size - 1 - y)
            if corner_x < radius and corner_y < radius:
                dx = radius - corner_x
                dy = radius - corner_y
                if dx * dx + dy * dy > radius * radius:
                    # transparent corner → just write bg (PWA mask covers it anyway)
                    color = (0, 0, 0)
                    # but we use opaque PNG so use bg
                    color = bg
                    idx = (y * size + x) * 3
                    pixels[idx:idx + 3] = bytes(color)
                    continue

            d1 = dist_to_segment(x, y, *p1, *p2)
            d2 = dist_to_segment(x, y, *p2, *p3)
            d = min(d1, d2)
            if d < thickness:
                color = fg
            elif d < thickness + 1.5:
                # simple AA
                t = (d - thickness) / 1.5
                color = tuple(int(fg[i] * (1 - t) + bg[i] * t) for i in range(3))
            else:
                color = bg
            idx = (y * size + x) * 3
            pixels[idx:idx + 3] = bytes(color)

    write_png(out, size, size, pixels)
    print(f"wrote {out}")


if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    make_icon(192, "icon-192.png")
    make_icon(512, "icon-512.png")
    make_icon(180, "apple-touch-icon.png")
