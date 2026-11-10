# EMPTYHELL — Future Architecture

This branch is intentionally hidden from production.

## Status

PAUSED / ARCHIVED FOR FUTURE DEVELOPMENT.

## Principle

Keep verified Montréal geometry, progression, save-state contracts, and gameplay truth separate from rendering and presentation. When development resumes, the game should be rebuilt as a coherent production rather than patched with decorative primitives.

## Layers

1. world — verified spatial truth and collision data
2. gameplay — progression, interactions, state, objectives
3. presentation — rendering, lighting, materials, weather, camera
4. characters — player/NPC assets, rigs, animation state machines
5. audio — spatial ambience, music, interaction audio
6. ui — HUD, map, pause, accessibility, mobile controls
7. content — missions, encounters, evidence, dialogue and world events
8. data — source-derived immutable datasets and runtime transforms
9. tests — gameplay, geometry, rendering smoke tests and device QA
10. tools — validation, asset processing and build utilities

## Production rule

No new feature should bypass these boundaries. Collision geometry is not render geometry. Verified source data is not decorative content. Mobile performance is a first-class constraint.
