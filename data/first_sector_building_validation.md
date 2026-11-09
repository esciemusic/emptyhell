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
