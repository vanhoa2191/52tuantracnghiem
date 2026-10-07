# GitHub skills applied to Mầm Sáng

Reviewed 2026-10-07. Guidance was read as documentation; no remote installers or hooks were executed.

Sources:
- [three-webgl-game](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/three-webgl-game/SKILL.md)
- [game-ui-frontend](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-ui-frontend/SKILL.md)
- Supporting references: web-game-foundations, three-webgl-architecture, three-hud-layout-patterns, playtest-checklist in the same game-studio directory.

Design direction: a gentle low-poly garden adventure with four answer portals. Fixed orthographic camera; touch a portal/card or preview with arrows and confirm with Enter. The quiz needs all four readable choices and full source explanations, so text stays in DOM below the unobstructed scene. A compact objective strip names the biome and question. Controls and audio/motion settings open in a modal. Sidebar and topbar are hidden during quiz play; the existing pause action returns to the world.

Applied boundaries:
- guest.mjs retains progression, grading and browser persistence. No answers or unlock dates are owned by meshes.
- game-input.mjs owns transient focus, saving, confirmed and modal input states. quiz.mjs adapts those states to gates and avatar animation.
- Four quarter palettes align the quiz with the world. Hover/focus highlights gates, audio is opt-in, reward particles expire after 3.5 seconds, and motion can be disabled.
- Settings pause the scene and gate canvas input. Returning from the modal resumes it. Failed answer persistence releases the saving input gate. Reloading an answered question does not replay particles.
- Existing WebGL fallback, resource disposal, pixel ratio cap and hidden-tab rendering guard are retained. diagnostics() exposes renderer counters for future measurements.

Adaptations: retain the existing JS/esbuild/Sites stack. This bounded quiz has no physical collision simulation or imported models, so Vite/TypeScript migration, Rapier, and GLB loaders would not improve the current task. Use GLB/glTF if authored models are introduced later.

Validation: 19 Node checks pass, including all 520 option mappings/explanations, save/reload, seven-day unlock, assessments, keyboard/modal/saving input states and quarter boundaries. Production publication must be confirmed through Sites. Direct browser WebGL QA is unavailable in this session; no FPS or screenshot quality claims are made.
