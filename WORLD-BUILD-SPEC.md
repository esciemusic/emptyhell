# EMPTYHELL — Parc-Extension World Build Spec v1.0

## Purpose
Replace the provisional prototype blockout with a small, geographically grounded vertical slice before expanding the world.

**Rule:** real place first. Geometry may be simplified for performance, but recognizable street relationships, railway infrastructure, boundaries, and landmarks must remain.

## Verified reference points
- Parc du Centenaire-de-Parc-Extension is at the corner of **rue Saint-Roch and avenue Stuart**.
- Municipal mapping identifies **rue Saint-Roch, avenue Stuart, avenue Wiseman, rue Durocher, avenue Bloomfield, avenue Champagneur, avenue Querbes, avenue De l'Épée, avenue D'Outremont, avenue du Parc, boulevard de l'Acadie, rue Jean-Talon Ouest and avenue Ogilvy** in the Parc-Extension context.
- Municipal electoral mapping marks railway corridors in the area.
- ARTM publishes 2024 base cartography at 1:1000 covering Villeray–Saint-Michel–Parc-Extension.

Reference sources:
- Montréal 2025 Parc-Extension district map
- Montréal interactive planning maps
- ARTM base cartography
- Parc du Centenaire-de-Parc-Extension
- Montréal Parc-Extension traffic-calming plan

## First vertical slice
Center the first production slice on the **Saint-Roch / Stuart / Durocher / Bloomfield** area, with Parc du Centenaire as the recognizable anchor.

Required:
1. Saint-Roch corridor
2. Stuart corridor
3. Durocher corridor
4. Bloomfield corridor
5. Parc du Centenaire anchor
6. Verified railway/boundary infrastructure
7. Sidewalks, intersections, setbacks and building frontage
8. Verified service/alley spaces
9. Natural pedestrian entrances/exits
10. Geographic ambient sound pressure

## Geometry policy
The current 90m blockout is a technical sandbox, not final geography.

Production geometry must come from verified map/reference data and then be deliberately simplified:
- preserve street orientation and relative spacing
- preserve recognizable intersections
- preserve major infrastructure boundaries
- preserve park placement
- simplify interiors
- simplify building geometry behind street-facing façades
- avoid invisible walls when physical infrastructure can explain limits

## Traversal
Initial target:
**LOAD → SPAWN → WALK → RUN → LOOK → EXAMINE → PAUSE → MAP → RESUME → EXIT**

No combat, full quest system, or shop is required for this slice.

## Player
Third-person remains the target. The temporary capsule is acceptable only until the first real character asset.

Required:
- grounded acceleration/deceleration
- believable walking speed
- faster run
- camera collision awareness
- no camera clipping through buildings
- no arbitrary boundary clamps where physical boundaries can be modeled

## Environment priority
1. Street geometry
2. Sidewalks/curbs
3. Building frontage
4. Railway/boundary infrastructure
5. Park
6. Winter material response
7. Lighting
8. Human-scale details
9. Ambient audio
10. Memory/signal treatment

## Visual restraint
Purple remains rare. Blue is operational/reality language. Distortion must never compensate for weak geography or environment art.

The first clean slice must look good with distortion disabled.

## Acceptance gate
Do not expand beyond this slice until:
- geography is recognizable
- traversal feels grounded
- camera behaves correctly
- physical boundaries make sense
- winter materials read correctly
- the park reads as a real place
- the scene is coherent without glitch effects
- CI remains green

## Geography gate — railway and access reconciliation
The current game railway is still a deliberately simplified boundary model and must not be treated as a verified representation of the real rail alignment.

Authoritative references confirm:
- Montréal's 2025 electoral map identifies the Parc-Extension railway corridor and relevant street network.
- Montréal documentation identifies the Ogilvy / De Castelnau level crossing as a real connection across the railway corridor.
- Montréal/ARTM base cartography is available at 1:1000 scale and is the correct source for the next geometry reconstruction.

Implementation rule: do not invent the crossing position in game coordinates. First derive railway/street intersections from the 1:1000 reference, then translate that verified geometry into the simplified game coordinate system.

Until that conversion is completed:
- no new railway openings are to be guessed;
- no additional invisible boundary clamps are to be introduced;
- the existing railway remains a provisional environmental placeholder;
- first-sector expansion remains blocked.

## Status
**Technical foundation:** GREEN  
**Geographic reconstruction:** IN PROGRESS — RAILWAY RECONCILIATION GATE  
**Environmental reconstruction:** PASS 2 COMPLETE  
**Physical scale / traversal fidelity:** IN PROGRESS — FIRST SECTOR REBUILT  
**Production world geometry:** NOT READY  
**Vertical slice:** NOT READY

Next build task: finish physical-scale QA on the first sector (block widths, park entrances, frontage setbacks, traversal/camera behavior), then reconcile the railway/street intersections against the verified 1:1000 source before any sector expansion.


## Railway reconciliation — source lock (2026-11-09)

The railway geometry is now source-locked for reconstruction rather than guessed from the prototype.

Verified from current authoritative references:
- The City of Montréal's 2025 Parc-Extension electoral map explicitly depicts the railway corridor and the local street network, including Saint-Roch, Durocher, De Castelnau Ouest, Ogilvy, Bloomfield, Champagneur, De L'Épée, Stuart and Wiseman.
- Montréal documentation confirms that the Ogilvy / De Castelnau Ouest passage is an actual level crossing through the railway corridor.
- The ARTM/Montréal base-cartography dataset confirms that the 2024 1:1000 compilation covers Villeray–Saint-Michel–Parc-Extension and is available in CAD/PDF formats for geometry extraction.

Implementation consequence:
1. Keep the existing railway mesh visibly present as a temporary boundary.
2. Do not move, rotate, or open the railway in game coordinates from visual estimation alone.
3. The next geometry pass must extract the relevant 1:1000 sheet(s), identify the rail centerlines and street crossings, then normalize those coordinates into the game's local metre system.
4. The Ogilvy / De Castelnau crossing is a verified feature to reproduce; its exact game coordinates remain **UNTRANSLATED** until the 1:1000 geometry is extracted.
5. No sector expansion or additional crossing is permitted before that translation.

**Gate result:** SOURCE CONFIRMED / GEOMETRY TRANSLATION PENDING.


### 1:1000 extraction record

The authoritative 2024 compilation is confirmed as a 1:1000 vector/cartographic source for Villeray–Saint-Michel–Parc-Extension. The ARTM catalogue exposes the 2024 PDF, DGN and DWG resources and the sheet-index workflow.

The 2024 PDF resource is:
https://donnees.montreal.ca/fr/dataset/c9336648-098a-4984-b0cb-be65b951cadd/resource/bc1a8fd8-5208-4903-99ae-a06056c7d5b5/download/compilation_carto_2024_pdf.zip

The 2024 DGN resource is:
https://donnees.montreal.ca/fr/dataset/c9336648-098a-4984-b0cb-be65b951cadd/resource/2d94de12-aefd-4911-ba61-75a2b59f97ad/download/compilation_carto_2024_dgn.zip

The 2024 DWG resource is:
https://donnees.montreal.ca/fr/dataset/c9336648-098a-4984-b0cb-be65b951cadd/resource/7975cc58-5a06-46a5-98b9-d288f53a5857/download/compilation_carto_2024_dwg.zip

The public catalogue confirms the 2024 compilation covers Villeray–Saint-Michel–Parc-Extension and is provided at 1:1000.

Extraction status: **BLOCKED BY RESOURCE DELIVERY, NOT BY GEOGRAPHY.**
The 2024 PDF download endpoint currently returns HTTP 403 to the available retrieval path. The interactive sheet viewer remains available, so no game coordinates will be fabricated from the inaccessible archive.

Next exact operation when the sheet data is accessible:
- identify the SQRC sheet(s) containing Saint-Roch / Stuart / Durocher / Bloomfield and the railway corridor;
- extract railway centerline/track edges;
- extract street centerlines and the Ogilvy / De Castelnau crossing;
- establish one local metre anchor at the park/street network;
- transform the verified geometry into EMPTYHELL coordinates;
- replace only the provisional railway geometry;
- re-run first-sector traversal QA;
- keep expansion locked until the gate passes.

No guessed railway coordinates are permitted.


### 1:1000 sheet-level extraction route — verified (2026-11-09)

The authoritative ARTM catalogue confirms that the Montréal base-cartography interactive tool is designed around individual 1:1000 SQRC sheets and supports sheet preview plus targeted DGN/DWG/PDF download. The 2024 compilation explicitly covers Villeray–Saint-Michel–Parc-Extension.

Operational rule:
1. Use the interactive sheet index to identify only the SQRC sheet(s) covering the first playable sector.
2. Preview the selected sheet(s) before extraction.
3. Extract railway centerline/edges, street centerlines and the relevant Ogilvy/De Castelnau crossing geometry from the selected sheet(s).
4. Translate the authoritative coordinates into EMPTYHELL's local 1 unit ≈ 1 metre frame.
5. Reconcile every railway/street intersection before changing the provisional railway meshes or camera boundary.
6. Record the source sheet identifier and transformation in this spec.

This is now the preferred extraction route because it avoids treating the 323.4 MB citywide PDF archive as the only path to the needed first-sector geometry.

No coordinates are being changed yet. No railway crossing is being guessed.

### SQRC sheet-index source — identified (2026-11-09)

The sheet-index dependency is now identified independently of the 2024 citywide archive.

Authoritative Montréal open-data index:
- Dataset: **Quadrillage SQRC**
- 1:1000 grid coverage for Montréal
- Projection for the published 1:1000 grid: NAD83 MTM8
- The dataset includes a 1:1000 GeoJSON resource and a 1:1000 SHP resource.
- Resource identifiers:
  - GeoJSON: `ad1924d4-2579-40aa-8aa7-b83d88166ee5`
  - SHP: `dade7416-6c0a-4765-9262-5e3d9e2a55de`
  - DXF index: `34805c01-1b32-4202-b604-3c1cba7d1d4c`

The ARTM base-cartography catalogue separately confirms that its interactive viewer is intended to locate and preview individual 1:1000 SQRC sheets and download the corresponding DGN/DWG/PDF sheet data.

Operational sequence is therefore locked:
1. Resolve the first-sector location against the SQRC 1:1000 index.
2. Record the exact sheet identifier(s).
3. Use those sheet identifiers in the ARTM/Montréal base-cartography viewer.
4. Preview the selected 2024 sheet(s).
5. Extract railway edges/centerline, street centerlines, and the Ogilvy / De Castelnau crossing.
6. Transform the authoritative geometry into EMPTYHELL's local metre frame.
7. Replace only the provisional railway geometry and matching camera boundary.
8. Re-run first-sector traversal and collision QA.

Important: the SQRC grid identifies sheet coverage; it does **not** by itself supply the railway geometry. No game coordinates are to be derived from the grid alone.

**Gate:** SHEET-INDEX IDENTIFIED / EXACT SHEET + GEOMETRY EXTRACTION PENDING.

### SQRC index access audit — 2026-11-09

The ARTM catalogue page was rechecked. It still explicitly identifies the SQRC 1:1000 sheet breakdown and the interactive sheet-based cartography tool. The catalogue page's direct SQRC index link currently resolves to a 404 through the available retrieval path, so the exact sheet identifier cannot yet be responsibly recorded from that link.

The 2024 cartography resources remain confirmed at 1:1000 and include Villeray–Saint-Michel–Parc-Extension.

**Decision:** do not infer a sheet number from street names, visual maps, or approximate coordinates. The exact sheet identifier remains pending access to the working SQRC index/viewer.

**Gate:** AUTHORITATIVE SOURCE VERIFIED / SQRC LINK PATH BLOCKED / GEOMETRY UNTOUCHED.

### SQRC 1:1000 resource endpoint — independently verified (2026-11-09)

The Données Québec resource page independently confirms the exact 1:1000 GeoJSON resource and its download endpoint:
- Resource ID: `ad1924d4-2579-40aa-8aa7-b83d88166ee5`
- Format: GeoJSON
- Spatial reference: WGS84
- Direct source: `https://donnees.montreal.ca/fr/dataset/e160983c-f5d2-49ec-9b81-d0f6fb66518a/resource/ad1924d4-2579-40aa-8aa7-b83d88166ee5/download/sqrc_1000.geojson`

The resource page confirms that the file may not render inline because of its size/structure but is intended to be downloaded. The available retrieval path currently cannot return the file contents, so the exact sheet polygons/identifiers cannot yet be parsed.

This is now a **file-access blocker**, not a source-identification blocker.

**No game coordinates changed. No railway geometry changed.**


### Uploaded 1:1000 sheet audit — 31H12-010-0530 (2017–2022) — 2026-11-09

A user-supplied municipal **1:1000 Compilation cartographique** sheet was inspected directly:
- Sheet identifier: **31H12-010-0530**
- File: `31H12-010-0530_2017-2022.pdf`
- The map visibly contains the first-sector street fabric needed for the current blockout, including **Saint-Roch, Stuart, Wiseman, Durocher, Bloomfield, Champagneur, De l'Épée, Querbes, D'Outremont, Ball, Ogilvy** and surrounding blocks.
- **Parc du Centenaire-de-Parc-Extension** is explicitly mapped at the **Saint-Roch / Stuart** relationship used by the current first-sector design.
- The sheet includes detailed municipal building footprints, sidewalks/curb context, vegetation, street corridors and other 1:1000 cartographic layers.
- The sheet legend includes railway-related symbology such as **voie ferrée**, **pont et viaduc ferroviaire**, **passage à niveau**, **barrière au passage à niveau**, and **lanterne au passage à niveau**.
- In the inspected map extent, however, the railway centerline/corridor needed for the current provisional railway mesh is **not visibly present as a mapped rail corridor**. Therefore this sheet is sufficient as a verified street/park/frontage reference, but **not sufficient by itself to replace the provisional railway geometry**.
- The sheet's cartographic metadata states planimetric accuracy of approximately **±30–40 cm** and altimetric accuracy of approximately **±45–60 cm**; the sheet also identifies its cartographic edition as May 2019.

Implementation decision:
1. Treat 31H12-010-0530 as a **verified first-sector street/park/frontage source**.
2. Do not derive railway coordinates from the absence/presence of legend symbols on this sheet.
3. Do not change the existing railway mesh or camera boundary yet.
4. Acquire the adjacent/current 1:1000 sheet that actually contains the railway corridor and the Ogilvy / De Castelnau crossing.
5. Once that sheet is identified, use the two source sheets together to reconcile the first-sector street network, railway alignment and crossings before replacing the provisional geometry.

**Gate:** 31H12-010-0530 STREET/PARK SOURCE CONFIRMED / RAILWAY SOURCE STILL PENDING.


### Official railway extraction route — added 2026-11-09

A current official railway-network source has been identified to complement the 1:1000 cartography:
- ARTM/Adresses Québec **Réseau ferroviaire** dataset.
- The official service exposes railway segments as polylines and supports GeoJSON output.
- The published service was last updated in June 2026 and identifies the geometry as the Québec railway network.
- The ArcGIS layer used for extraction is **Réseau ferroviaire (ID 14)**.

This source is being used only as a **reconciliation/reference layer**. It does not replace the 1:1000 municipal cartography for street/building geometry.

The EMPTYHELL retrieval workflow now:
1. Downloads the Montréal SQRC 1:1000 index.
2. Correctly transforms SQRC geometry from WGS84 into NAD83 MTM8 before measuring distances.
3. Queries the official railway layer around the Parc-Extension first sector.
4. Produces a railway reconciliation report with segment geometry and distances to Parc du Centenaire and Gare Parc.
5. Stores the results as an Actions artifact for inspection.

**Important:** the workflow has been updated, but no Actions run is currently exposed through the connected GitHub status endpoint. Therefore the exact extracted sheet identifier and railway segment coordinates remain **UNVERIFIED AT RUNTIME**.

No game geometry has been changed.

## First-sector railway reconciliation — VERIFIED

- Official Montréal railway source used: **Voies ferrées 3D (2020)**, dataset e135b6df-5bfc-43bc-a743-5f306c8900fb.
- Source CRS: **NAD83 / MTM zone 8 (EPSG:32188)**; source quality records planimetric accuracy of approximately ±30–40 cm.
- Automated extraction successfully downloaded the official railway archive and isolated the CARTO_FER_VOIE line layer.
- The Parc du Centenaire first-sector SQRC sheet is **31H12-010-0530**.
- The extracted SQRC 1:1000 grid confirms 31H12-010-0530 contains the park anchor and first-sector street fabric.
- No authoritative railway track line intersects 31H12-010-0530.
- The nearest authoritative railway lines are on adjacent sheets, including **31H12-010-0531** and **31H12-010-0431**; the nearest extracted rail geometry is outside the current first-sector sheet.
- Consequence: the previous provisional railway meshes and railway camera barriers inside the first-sector prototype were not geographically justified and have been removed.
- The railway is now **deferred**, not guessed. It remains a future adjacent-sector geometry task.
- No railway expansion, crossing, camera boundary, or invisible clamp may be added until the adjacent 1:1000 sheets are reconciled with the official Montréal railway linework.

## First-sector physical-scale audit — VERIFIED

The current prototype blockout was compared against the current Ville de Montréal Géobase road-centerline dataset. The source describes the road network as centerline-based street segments and is updated weekly.

Verified nearest centerline positions relative to Parc du Centenaire anchor:

- Stuart: approximately **(-8 m, +20 m)**
- Wiseman: approximately **(+15 m, -37 m)**
- Saint-Roch: approximately **(-28 m, -12 m)**
- Champagneur: approximately **(+66 m, -159 m)**
- Bloomfield: approximately **(+91 m, -219 m)**
- De l'Épée: approximately **(+117 m, -280 m)**
- Ogilvy: approximately **(+269 m, +112 m)**
- Durocher: approximately **(+1,090 m, +31 m)**

The existing prototype positions are substantially different and the real street centerlines are not axis-aligned. Therefore the current street blockout is **not yet physically scaled/geographically reconciled**.

### Required consequence

- Do not tune the current street positions by eye.
- Rebuild the first-sector road corridors from the verified centerline source.
- Preserve the park anchor as the local origin.
- Keep railway geometry deferred outside the first-sector sheet.
- Rebuild sidewalks/intersections after road centerlines are locked.
- Reposition frontage/buildings after the road grid is locked.
- Only then perform final traversal/collision QA.

Current status: **Physical-scale QA = FAIL / REBUILD REQUIRED.**


## Parc du Centenaire footprint — VERIFIED

The current Montréal parks dataset identifies the first-sector anchor as **Parc du Centenaire-de-Parc-Extension** (NUM_INDEX 1282-000). Its extracted MTM8 footprint is approximately **39.5 m × 42.3 m**, with an area of approximately **1,003 m²**.

Relative to the existing park anchor point, the verified footprint bounds are approximately:

- west: **-25.4 m**
- east: **+14.1 m**
- north: **-26.8 m**
- south: **+15.6 m**

The current prototype rectangle (27 m × 30 m at local x=63, z=18) is therefore a temporary approximation and will be replaced during the first-sector rebuild.

No partial park/building repositioning is being made until the verified street centerlines and park footprint are reconciled together.

## First-sector verified geometry rebuild — COMPLETE

The first-sector prototype has now been rebuilt from the verified Montréal sources rather than the previous axis-aligned blockout.

Implemented:
- verified Montréal road-centerline geometry for Stuart, Wiseman, Saint-Roch, Champagneur, Bloomfield, De l'Épée and Ogilvy;
- local metre coordinate system anchored to Parc du Centenaire;
- verified Parc du Centenaire polygon footprint;
- diagonal road orientation and segment continuity;
- road-side sidewalks and winter edge treatment following the imported segments;
- development perimeter sized to the verified first-sector source window;
- railway remains completely absent from this slice, as required by the 1:1000 reconciliation;
- map overlay updated to represent the verified diagonal street network.

The rebuild is intentionally **not yet production-final**: frontage/building footprints remain simplified placeholders, and traversal/collision/camera QA must still be performed against the rebuilt geography.

Current status:
- Geography source lock: GREEN
- Street geometry rebuild: GREEN
- Park footprint rebuild: GREEN
- Railway gate: GREEN / DEFERRED OUTSIDE SLICE
- Frontage/building fidelity: IN PROGRESS
- Traversal/collision QA: PENDING
- Production world: NOT READY

## First-sector traversal / collision / camera QA — PASS 1

Verified after the geometry rebuild:
- legacy axis-aligned world-bound references removed from runtime map/camera logic;
- all ten temporary frontage buildings now maintain a safe separation from the imported 8.2 m road corridors;
- player spawn is outside the verified park polygon and approximately 8.86 m from the nearest verified road centerline;
- park perimeter no longer uses the road/sidewalk helper and therefore does not generate false sidewalk geometry;
- collision system remains active for buildings, garages and loaded-slice edges;
- third-person camera collision remains tied to the same physical collider meshes;
- railway collision/camera barriers remain absent from the rebuilt first sector.

This is a static traversal/collision gate, not a substitute for hands-on browser traversal. Next gate is visual/playable traversal inspection, then verified frontage/building geometry.

## Browser/playable traversal QA — PASS 2

Automated Chromium inspection now passes on the rebuilt first sector:
- WebGL canvas boots successfully;
- loading shell clears;
- HUD/control shell renders;
- M opens the map overlay and the verified Parc du Centenaire label is present;
- Escape opens the pause state;
- WASD movement input is accepted without a page/runtime error;
- spawn, map and pause screenshots are captured as the browser-QA artifact.

A real runtime defect found during this pass was fixed: the verified road dataset is stored as [name, start, end] arrays, while the renderer was reading road.a / road.b. That mismatch stopped the initialization path before the loading overlay could clear. The renderer now reads the persisted verified segment structure correctly.

Another control defect was fixed at the same time: two keydown handlers were competing for M, causing the pause state to intercept the map command. M now reaches the dedicated map handler.

Current gate:
- Browser boot: GREEN
- Map: GREEN
- Pause: GREEN
- Movement input: GREEN
- Runtime initialization: GREEN
- Human visual traversal: still required before calling the slice production-ready


## Verified frontage / building geometry — PASS 3

The first visual frontage pass now replaces the remaining invented rectangular frontage cubes with building footprints traced from the Ville de Montréal 1:1000 compilation sheet 31H12-010-0530 (2017-2022). The first ring around the Parc du Centenaire sector uses the sheet's magenta building outlines as the source geometry.

- Source geometry: GREEN — official Montréal compilation sheet 31H12-010-0530, 1:1000.
- Street alignment: GREEN — existing verified Géobase centerlines remain authoritative.
- Park geometry: GREEN — current verified parks footprint remains authoritative and is not replaced by the older sheet outline.
- Frontage massing: GREEN — temporary cubes removed from the first frontage ring and replaced by footprint-derived extrusions.
- Building heights: AMBER — visual massing only; no municipal height/storey attribute has been asserted.
- Railway: DEFERRED — no guessed railway geometry introduced.
- Automated build: GREEN — run 42658881459 succeeded on commit cf584188c74a3e7bb26ec63877ecfade141c5cd4.
- Automated browser QA: GREEN — run 42658881374 succeeded on the same commit.

Current gate: the first-sector environment is technically healthy and now materially closer to the verified Montréal street fabric. The next fidelity pass should reconcile the remaining sheet footprints across the loaded slice rather than inventing new buildings, and should then revisit collision envelopes around irregular footprints.


## Irregular-footprint collision QA — PASS 4

The verified frontage buildings now use their traced polygon footprints for player collision instead of only axis-aligned bounding boxes. This prevents the collision system from blocking the player across empty corners of irregular Montréal building outlines while retaining the existing mesh-based camera collision.

- Polygon collision geometry: GREEN.
- Player-radius edge buffering: GREEN.
- Camera collision mesh linkage: GREEN.
- Build: GREEN — commit 5ee27d254e6c85c51335d3c5be9ec50fcdb16b66.
- Browser QA: GREEN — run 42659954740.

The next fidelity gate remains source-backed building coverage across the rest of the loaded first sector. No unsupported building footprints or railway geometry are being added.


### 1:1000 building-footprint extraction — PASS 5A (source extraction only)

The supplied **31H12-010-0530 (2017–2022)** 1:1000 compilation sheet has now been processed as vector source data rather than traced only by eye.

Extraction result:
- Purple 1.44 pt municipal building-outline candidates inside/overlapping the current EMPTYHELL world window: **141**.
- Candidate records preserve the source drawing identifier, page-derived local bounding box, area and perimeter.
- The extraction uses the sheet's 1:1000 scale and the measured centroid of the sheet's orange park outline as a provisional page calibration.
- The extraction tool is stored at `tools/extract-1000-sheet-footprints.py`.
- Candidate manifest is stored at `data/31H12-010-0530_building_candidates.json`.

**Important gate:** these 141 candidates are **NOT yet promoted into game geometry**. The page calibration still has to be tied to an authoritative MTM8 point and each promoted polygon must pass road-overlap / park-overlap / collision QA. This prevents a visually convincing but geographically shifted building layer from entering the production slice.

The current 12 source-traced frontage footprints remain the only building geometry promoted into the game.

**Gate:** VECTOR EXTRACTION GREEN / GEOREFERENCE VALIDATION PENDING / GAME GEOMETRY UNCHANGED.

Next operation: use the authoritative MTM8 road/park geometry to solve the PDF-to-local transform, then promote only validated polygons and rerun build + browser QA.


## Building validation gate — 2026-11-09
The 1:1000 extraction produced 141 candidate building outlines from 31H12-010-0530. A runtime safety audit confirms that none of those candidates are consumed by the game yet. A road-proximity screen finds 36 candidates under 10 m from a verified road centerline, 44 at 10–25 m, and 61 over 25 m; this is screening only and does not establish correct georeferencing or setbacks.

**Gate:** EXTRACTION GREEN / ROAD SCREEN COMPLETE / GEOREFERENCE PENDING / PROMOTION BLOCKED.

The next building operation is to solve the PDF-to-local transform against authoritative MTM8 park/road geometry, validate candidate footprints and park/road overlaps, then promote only source-ID-linked polygons. No expansion or invented frontage is permitted during this gate.

Audit record: `data/first_sector_building_validation.md`.
