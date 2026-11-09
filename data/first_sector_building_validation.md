# EMPTYHELL — 1:1000 Building Validation Audit

Source: 31H12-010-0530_2017-2022.pdf (1:1000)
Generated against commit: e5bc94e64efc83d0dd4720d6c909c56065b3c5d7

## Gate
**GEOREFERENCE PENDING — PROMOTION BLOCKED**

The extraction contains 141 building-outline candidates. They remain data-only and are not consumed by runtime geometry.

### Calibration
- Page park centroid: [1820.841, 1556.941] pt
- Calibration status: PENDING_GEOREFERENCED_VALIDATION
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
1. Solve PDF-to-local transform with authoritative MTM8 park/road geometry.
2. Validate candidate footprints against road corridors and park polygon.
3. Flag overlaps and implausible setbacks.
4. Promote only validated polygons, retaining source drawing IDs.
5. Run build + browser QA.
6. Re-run irregular-footprint collision QA.
