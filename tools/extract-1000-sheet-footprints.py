#!/usr/bin/env python3
"""Extract purple 1:1000 compilation-sheet building candidates.

This tool deliberately stops at source extraction. It does not mutate game geometry.
The page-to-world calibration must be tied to an authoritative MTM8 point before
candidates are promoted into src/main.js.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import fitz
from shapely.geometry import Polygon

PURPLE = (0.3529999852180481, 0.0, 0.3529999852180481)
BUILDING_STROKE_PT = 1.44
PT_PER_METRE = 72.0 / 25.4


def extract(pdf_path: Path, origin_x_pt: float, origin_y_pt: float,
            min_area_m2: float = 10.0):
    page = fitz.open(pdf_path)[0]
    candidates = []

    for drawing_id, drawing in enumerate(page.get_drawings()):
        if drawing.get("color") != PURPLE:
            continue
        if abs((drawing.get("width") or 0) - BUILDING_STROKE_PT) > 0.01:
            continue
        if not drawing.get("rect") or len(drawing.get("items", [])) < 5:
            continue

        rect = drawing["rect"]
        x0 = (rect.x0 - origin_x_pt) / PT_PER_METRE
        x1 = (rect.x1 - origin_x_pt) / PT_PER_METRE
        z0 = -(rect.y1 - origin_y_pt) / PT_PER_METRE
        z1 = -(rect.y0 - origin_y_pt) / PT_PER_METRE

        if x1 < -180 or x0 > 380 or z1 < -330 or z0 > 180:
            continue
        if not (3 <= x1 - x0 <= 90 and 3 <= z1 - z0 <= 90):
            continue

        points = []
        for item in drawing["items"]:
            if item[0] != "l":
                continue
            if not points:
                points.append((item[1].x, item[1].y))
            points.append((item[2].x, item[2].y))

        if len(points) < 4:
            continue

        local = [
            ((x - origin_x_pt) / PT_PER_METRE,
             -(y - origin_y_pt) / PT_PER_METRE)
            for x, y in points
        ]

        clean = []
        for point in local:
            if not clean or math.dist(point, clean[-1]) > 0.001:
                clean.append(point)

        if len(clean) > 2 and math.dist(clean[0], clean[-1]) < 0.05:
            clean.pop()

        polygon = Polygon(clean)
        if not polygon.is_valid or polygon.area < min_area_m2:
            continue

        candidates.append({
            "drawing": drawing_id,
            "points": [[round(x, 3), round(z, 3)] for x, z in clean],
            "bbox": [round(x0, 2), round(z0, 2), round(x1, 2), round(z1, 2)],
            "area_m2": round(polygon.area, 2),
            "perimeter_m": round(polygon.length, 2),
            "items": len(drawing["items"]),
        })

    return candidates


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("output")
    parser.add_argument("--origin-x-pt", type=float, required=True)
    parser.add_argument("--origin-y-pt", type=float, required=True)
    parser.add_argument("--min-area-m2", type=float, default=10.0)
    args = parser.parse_args()

    candidates = extract(
        Path(args.pdf),
        args.origin_x_pt,
        args.origin_y_pt,
        args.min_area_m2,
    )

    payload = {
        "source_file": Path(args.pdf).name,
        "scale": "1:1000",
        "candidate_color": "purple stroke (0.353,0,0.353)",
        "candidate_stroke_width_pt": BUILDING_STROKE_PT,
        "page_to_local": {
            "origin_page_points": [args.origin_x_pt, args.origin_y_pt],
            "points_per_metre": PT_PER_METRE,
            "axis": "x=east, z=-north",
        },
        "status": "SOURCE_CANDIDATES_ONLY",
        "promotion_gate": "PENDING_AUTHORITATIVE_MTМ8_CALIBRATION_AND_ROAD_OVERLAP_QA",
        "candidate_count": len(candidates),
        "candidates": candidates,
    }

    Path(args.output).write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(json.dumps({
        "candidate_count": len(candidates),
        "output": args.output,
        "status": payload["status"],
    }))


if __name__ == "__main__":
    main()
