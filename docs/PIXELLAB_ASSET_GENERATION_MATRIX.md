# BMAD ART BIBLE & GOLDEN SET GENERATION MATRIX (PIXELLAB EDITION)

You are an Expert Art Director. Below is the definitive text-based art bible for our 2.5D Stroke Awareness game.

**Critical PixelLab constraint:** use the `PixelLab MCP` tool for generated pixel assets. Because the user is currently on a free trial, do not mass-generate blindly.

Workflow:
1. Generate exactly one asset for the first quality gate.
2. Stop and wait for user approval.
3. After approval, proceed in small golden-set batches and keep request usage visible.
4. Prefer standard/basic/static assets before paid/pro/custom animation work.

## 1. Global Pixel-Art Quality Standard
- **Projection:** True 2.5D Isometric (2:1 ratio, base tile size: 64x32 pixels).
- **Fidelity:** Modern 16-bit pixel art. Clean lines, strict anti-aliasing on diagonals.
- **Background:** Transparent or pure #FF00FF chroma-key.

## 2. Character Generation Prompts & Physics

**A. Girl A (The Player - Vietnamese Gen Z)**
- **Visuals:** Isometric view. Oversized pastel t-shirt (#FFD1DC), denim shorts (#89CFF0), white sneakers. Black bob-cut hair.
- **Shape & Size:** Occupies approx 1 tile space. Actual approved PixelLab standard output is a 92x92 canvas with the character about 55px tall and 41px wide.
- **Physics & Collision:** Dynamic physics body. The collision shape is a horizontal oval/capsule at her feet (width 24px, height 12px) to allow her head to overlap objects correctly (Y-Sort).
- **Interaction:** Emits a short-range raycast or Area2D (radius 40px) to detect interactive props.

**B. The Mother (NPC - Middle-aged VN Woman)**
- **Visuals:** Isometric view. Wearing a "Đồ bộ" (dark purple #4A2E4B with small pink floral patterns). Hair tied with a claw clip.
- **Shape & Size:** Same as Girl A. Actual approved PixelLab standard output is a 92x92 canvas with the character about 55px tall and 41px wide.
- **Physics & Collision:** Static/Kinematic body. Collision oval/capsule at feet (width 24px, height 12px).
- **Interaction:** Has an `Area2D` trigger zone (radius 60px). When Girl A enters this zone, the interaction prompt "[E] Khám" appears.

**C. The Symptom Portrait / Face Drooping UI**
- **Visuals:** 2D front-facing close-up portrait or simplified UI icon. The face cue must be readable at small UI size.
- **Usage:** Static UI overlay for the Face minigame, no physics required.
- **Quality rule:** Use the emotional mother portrait for story context, but pair it with a clear symptom icon/cut-in for minigame clarity.

## 3. Interior Props Prompts & Physics

**A. Traditional VN Wood Sofa**
- **Visuals:** Isometric. Dark walnut wood (#5C4033) with carved backrest and light-blue throw pillows (#ADD8E6).
- **Shape/Grid Position:** Rectangular, occupies about a 2x2 or 2x3 tile area depending on final placement.
- **Physics:** `setImmovable(true)`. Solid rectangular collision box covering the base.

**B. Refrigerator (Anchor Prop)**
- **Visuals:** Isometric. Modern brushed silver (#C0C0C0) double-door fridge.
- **Shape/Grid Position:** Tall rectangular. Base occupies a 1x1 tile area (64x32), but visually extends upward.
- **Physics:** `setImmovable(true)`. Solid collision box at the 1x1 base.

**C. Wooden Bookcase (Eye Minigame)**
- **Visuals:** Isometric tall wooden shelf (#8B5A2B). Filled with pixelated books of various colors.
- **Shape/Grid Position:** Occupies a 1x2 tile area.
- **Physics:** Solid base collision.
- **Interaction:** Proximity trigger (radius 40px).

## 4. Execution Order (Free-Trial Safe)
1. Read this art bible thoroughly.
2. Initialize the `PixelLab MCP` tool.
3. Call PixelLab to generate only one asset first: "Girl A (The Player)" using the visual specs in 2A.
4. Output the generated image or file path to the user.
5. Do not generate other assets until the user explicitly approves.
6. After approval, generate only a compact golden set before scaling.

## 5. Golden Set Result Log

Generated and retained:
- Girl A base rotations: PixelLab character `54021e67-96cd-4323-a5b9-e59499fc485a`.
- Mother base rotations: PixelLab character `89414c37-ed01-4b28-bf98-8d0c99fb6ea1`.
- Wood sofa: retained second isometric pass `5002b279-0739-4824-8d44-6961b112c54a`; first front-facing pass archived as rejected.
- Refrigerator: `fe221b81-3daa-4c1a-8559-5ba6285f12fe`.
- Bookcase: `116e7b00-55a3-40e0-b601-737267ec8811`.
- Phone cabinet: `43a8f636-2e75-4a8f-8a02-bfaa21211eec`.
- Terracotta floor tile: `cf3c389a-9bba-4d11-8639-a9265da3ae6f`.
- Warm wall slice: `cb77f0bc-84f7-457c-8bc9-1f60f4c3a8eb`.
- Mother face portrait: `0dccd7c0-eec8-438b-995f-8dae3f8b0914`, emotionally suitable but medically subtle.
- Face symptom icon: `8525f16e-e61d-4d26-a339-4347a90a8afc`, chosen for Face minigame clarity.

Rejected or archived:
- Mother face portrait v2 `b45c80a2-46a0-4783-8928-f1b987e46216`: too healthy/smiling.
- Mother face portrait v3 `24e663f6-1ec5-4c21-b1e7-df9d72d8a4c8`: serious mood but still medically subtle.

Important quality finding:
- PixelLab portrait generation tends to beautify facial expressions and understate face droop. For medical clarity, use a hybrid approach: emotional mother portrait plus a clearer symptom icon/cut-in for the Face minigame.

Budget note:
- As of this log, roughly 14 PixelLab jobs have been queued including rejected rerolls, assuming one free request per queued job. Continue conserving requests by avoiding 8-direction animations until static scene quality is accepted.
