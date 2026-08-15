#!/usr/bin/env python3
"""Compare revised ARCHANGEL fleet placements using city-centre geodesic distance.

This is a topology-planning aid, not a latency prediction. It makes geographic
separation visible while role, data residency, and operational ownership remain
the deciding criteria.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


EARTH_RADIUS_KM = 6371.0088

CURRENT_FLEET = {
    "Sovereign Provenance Console": (40.4168, -3.7038),
    "ARCHANGEL": (51.5072, -0.1276),
    "XinUS-Clarity": (53.3498, -6.2603),
    "Tesseract-A": (50.1109, 8.6821),
    "KEIRA": (-23.5505, -46.6333),
    "Monarch-OS": (1.3521, 103.8198),
    "Project Reclaim": (45.5152, -122.6784),
}

CANDIDATES = {
    "Root-Gate · N. Virginia": (38.9072, -77.0369),
    "IWA Sage · Canada Central": (45.5017, -73.5673),
    "Resonate Earth · Sydney": (-33.8688, 151.2093),
    "Future · Tokyo": (35.6762, 139.6503),
    "Future · Mumbai": (19.0760, 72.8777),
    "Future · Stockholm": (59.3293, 18.0686),
}


def distance_km(left: tuple[float, float], right: tuple[float, float]) -> float:
    lat_a, lon_a = map(math.radians, left)
    lat_b, lon_b = map(math.radians, right)
    haversine = math.sin((lat_b - lat_a) / 2) ** 2 + math.cos(lat_a) * math.cos(lat_b) * math.sin((lon_b - lon_a) / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(haversine))


def summarize(name: str, coordinate: tuple[float, float]) -> dict[str, float | str]:
    distances = {node: distance_km(coordinate, point) for node, point in CURRENT_FLEET.items()}
    closest_name, closest_distance = min(distances.items(), key=lambda item: item[1])
    return {
        "candidate": name,
        "mean_distance_km": round(sum(distances.values()) / len(distances)),
        "minimum_separation_km": round(closest_distance),
        "closest_current_site": closest_name,
        "maximum_separation_km": round(max(distances.values())),
    }


def main() -> None:
    summary = [summarize(name, coordinate) for name, coordinate in CANDIDATES.items()]
    output = {
        "method": "Haversine distance between representative city-centre coordinates; not an RTT or legal-residency estimate.",
        "current_fleet": CURRENT_FLEET,
        "candidate_summary": summary,
    }
    destination = Path(__file__).resolve().parents[1] / "docs" / "revised_fleet_placement_metrics.json"
    destination.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
