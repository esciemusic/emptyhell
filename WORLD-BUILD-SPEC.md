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
