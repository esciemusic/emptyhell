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

## Status
**Technical foundation:** GREEN  
**Geographic reconstruction:** NOT STARTED  
**Production world geometry:** NOT READY  
**Vertical slice:** NOT READY

Next build task: geographic reconstruction/blockout pass.
