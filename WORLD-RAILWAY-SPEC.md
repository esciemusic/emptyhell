# EMPTYHELL Railway Geometry Gate

## Source strategy

Railway geometry is verified from two independent government datasets before any runtime promotion:

1. Ville de Montréal — Voies ferrées 3D (2020)
   - Dataset: e135b6df-5bfc-43bc-a743-5f306c8900fb
   - Resource: 1b32d325-411f-43c2-bd48-ef8db0684e62
   - Layer: CARTO-FER-VOIE
   - Format: GeoPackage
   - Municipal first geometry source; includes railway track features and planning attributes.
2. Ministère des Transports et de la Mobilité durable du Québec — Réseau ferroviaire
   - Dataset: c2c4f386-a736-4eaa-b5b6-28c3a8f75466
   - WFS / GeoJSON
   - CRS: EPSG:4326
   - Independent provincial reconciliation source; geometry is derived from the federal railway geobase.

The Montréal 3D dataset is the primary source for EMPTYHELL railway geometry. The Québec network is the independent reconciliation layer. The earlier generic Montréal railway-network extract is not the promotion source.

## EMPTYHELL transform

Authoritative MTM8 anchor:

- MTM8: [294602.04000401904, 5043011.143267743]
- EMPTYHELL local: [0, 0]
- x = east_mtm8_delta
- z = -north_mtm8_delta

No arbitrary rotation is permitted.

## Validation gate

Current state: SOURCE LOCKED / FETCH WORKFLOW ADDED / RUNTIME PROMOTION BLOCKED

The first-sector workflow will:

1. fetch both official sources,
2. filter to the first-sector Montréal bounding box,
3. transform both to MTM8,
4. transform both to EMPTYHELL local coordinates,
5. compare their geometries,
6. preserve source attributes and provenance,
7. write reconciliation data into data/,
8. stop short of runtime promotion until the geometry comparison is reviewed.

Railway geometry must not be invented, manually traced, or inferred from unrelated imagery.

## Promotion rule

Only geometry surviving the two-source reconciliation may be promoted into EMPTYHELL runtime. Promotion requires:

- source provenance retained,
- geometry agreement reviewed,
- no unexplained displacement,
- correct local transform,
- build passes,
- browser QA passes,
- collision/interaction QA passes.
