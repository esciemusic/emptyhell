# EMPTYHELL — 1:1000 Building Validation Audit

Source: 31H12-010-0530_2017-2022.pdf (1:1000)
Generated against commit: e5bc94e64efc83d0dd4720d6c909c56065b3c5d7

## Gate
**GEOREFERENCE SOLVED — POLYGON VALIDATION IN PROGRESS — PROMOTION BLOCKED**

The extraction contains 141 building-outline candidates. They remain data-only and are not consumed by runtime geometry.

### Calibration
- Page park centroid: [1820.841, 1556.941] pt
- Calibration status: **SOLVED**
- Page → local transform: `x=(page_x-1820.841)/(72/25.4)`, `z=-(page_y-1556.941)/(72/25.4)`
- Authoritative MTM8 anchor: `[294602.04000401904, 5043011.143267743]`
- Axis: `x=east`, `z=-north`; no arbitrary rotation
- Promotion rule: the PDF page transform must first be tied to the authoritative MTM8 park/road anchor.

### Road-proximity screening
Candidate bounding-box centroids were screened against the verified runtime road centerlines:

- Under 10 m: **36**
- 10–25 m: **44**
- Over 25 m: **61**

This is only a screening signal. It does **not** prove correct georeferencing, municipal setback validity, park exclusion, or collision validity.

### Runtime safety
- Candidate footprints promoted: **0**
- Current sheet-traced frontage footprints in runtime: **12**
- Candidate manifest used as runtime source: **NO**

## Decision
**KEEP ALL 141 CANDIDATES OUT OF RUNTIME.**

Next gate:
1. ~~Solve PDF-to-local transform with authoritative MTM8 park/road geometry.~~ **DONE**
2. **Reconstruct polygon vertices from the source drawing sequence and validate each footprint against road corridors and park polygon.**
3. Flag overlaps and implausible setbacks.
4. Promote only validated polygons, retaining source drawing IDs.
5. Run build + browser QA.
6. Re-run irregular-footprint collision QA.


## Polygon reconstruction proof — 2026-11-09

The supplied 1:1000 PDF was inspected directly at vector level. The purple 1.44 pt building-outline drawings retain ordered linework and PDF sequence numbers that match the candidate manifest's drawing IDs. The first manifest candidate (`drawing 14942`) was independently reconstructed from its vector path and its transformed bounding box/area/perimeter reproduce the manifest values:

- drawing: `14942`
- transformed bbox: approximately `[110.69, -10.97, 189.89, 23.60]`
- area: `888.12 m²`
- perimeter: `242.27 m`
- transform: solved PDF → EMPTYHELL local metres

This proves the source geometry can now be reconstructed as actual polygons rather than relying on bounding boxes.

**Promotion remains blocked** until the reconstructed polygons are screened against the verified road centerlines and `PARK_POLYGON`, with source drawing IDs retained.


## Polygon-level validation screen — 2026-11-09

The PDF-to-game transform was rechecked against the game's axis convention. The correct conversion is:

- `x = (page_x - 1820.841) / (72/25.4)`
- `z = (page_y - 1556.941) / (72/25.4)`

Reason: PDF page Y increases southward; MTM8 north increases northward; EMPTYHELL uses `z = -north`. Therefore the two sign inversions cancel for the game Z coordinate.

This corrected sign removes the false road-crossing pattern from the earlier screen.

### Actual polygon screen

The 141 candidate drawings were reconstructed from their vector linework and screened against the verified runtime road centerlines and `PARK_POLYGON`.

- **0 / 141** candidates intersect a verified road centerline.
- **1 / 141** overlaps the verified park polygon: drawing **15122**.
- **6 / 141** are under **3.0 m** from a verified road centerline.
- **6 / 141** are between **3.0 m and 5.8 m** from a verified road centerline.
- **129 / 141** are at least **5.8 m** from a verified road centerline.
- **128 / 141** are provisionally clear of both the park overlap and the 5.8 m setback review threshold.
- The 12 setback-review drawings are: `14962, 14973, 14981, 14987, 14993, 15016, 15056, 15075, 15083, 15093, 15099, 15112`.
- Park-overlap hold: `15122`.

### Decision

**GEOMETRY SCREEN: GREEN WITH 13 REVIEW HOLDS.**

The 128 provisional passes are **not yet promoted**. Their actual polygon coordinates must be serialized into the runtime source, then the game must run build/browser/collision QA. The 12 setback cases and park-overlap case remain explicitly held until reviewed.

This is a materially stronger gate than the previous bounding-box screen because it uses reconstructed vector polygons rather than candidate bounding boxes.
