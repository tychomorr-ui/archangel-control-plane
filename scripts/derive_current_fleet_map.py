"""Project declared regional city proxies into the ARCHANGEL physical map.

Coordinates are regional-city proxies for visualization, not provider facility locations.
The map intentionally represents only supplied current hosts.
"""

from __future__ import annotations

CANVAS_WIDTH = 1100
CANVAS_HEIGHT = 450
MARGIN_X = 50
MARGIN_Y = 45
MIN_LON, MAX_LON = -130.0, 120.0
MIN_LAT, MAX_LAT = -30.0, 60.0

HOSTS = {
    "Project Reclaim · Oregon": (45.52, -122.68),
    "Root-Gate · N. Virginia": (38.99, -77.45),
    "IWA Sage · Montreal": (45.50, -73.57),
    "XinUS-Clarity · Ireland": (53.35, -6.26),
    "ARCHANGEL · London": (51.51, -0.13),
    "Sovereign Provenance Console · Spain": (40.42, -3.70),
    "Tesseract-A · Frankfurt": (50.11, 8.68),
    "KEIRA · São Paulo": (-23.55, -46.63),
    "Monarch-OS · Singapore": (1.35, 103.82),
}


def project(latitude: float, longitude: float) -> tuple[int, int]:
    drawable_width = CANVAS_WIDTH - MARGIN_X * 2
    drawable_height = CANVAS_HEIGHT - MARGIN_Y * 2
    x = MARGIN_X + (longitude - MIN_LON) / (MAX_LON - MIN_LON) * drawable_width
    y = MARGIN_Y + (MAX_LAT - latitude) / (MAX_LAT - MIN_LAT) * drawable_height
    return round(x), round(y)


if __name__ == "__main__":
    for name, (latitude, longitude) in HOSTS.items():
        x, y = project(latitude, longitude)
        print(f"{name}: {{ x: {x}, y: {y} }},")
