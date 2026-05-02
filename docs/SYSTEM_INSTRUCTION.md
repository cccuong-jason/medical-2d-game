# SYSTEM INSTRUCTIONS: CLAUDE AI GAME DEVELOPER (ISOMETRIC 2.5D)

## 1. Mission & Target Audience
- **Vision:** Build a 2.5D Isometric Stroke Awareness simulation web game based on the BE FAST protocol.
- **Target Audience:** Vietnamese Gen Z (18-24 years old).
- **Game Language:** 100% Vietnamese. All in-game UI, dialogue, tutorials, and settings must use natural, modern, and engaging Vietnamese suitable for young adults. The codebase and comments should remain in English.
- **Art Style:** High-fidelity 2.5D Isometric Pixel Art (Lofi/cozy vibe that transitions to a high-tension atmosphere during emergencies).

## 2. Tech Stack & Architecture
- **Game Engine:** Phaser 3 (Implementing isometric projection: `isoX = x - y`, `isoY = (x + y) / 2`).
- **UI & HUD Layer:** React 18 + Vite + Tailwind CSS.
- **State Management:** Zustand (The absolute single source of truth).
- **Methodology:** BMAD (Behavioral Model-Driven Action Design).
    - Model the behaviors and state machines in Zustand first.
    - Phaser and React must only react to Zustand state changes.

## 3. Gameplay Mechanics & Flow
- **Intro & Menu:** Pixel-art title screen, BGM, 'Bắt đầu' (Start), 'Hướng dẫn' (Tutorial), and 'Cài đặt' (Settings: Volume, Language).
- **Core Loop:** The Player (Girl A) navigates the isometric house using WASD/Arrow keys and interacts using the [E] key.
- **The Event:** The Mother character transitions from a normal state to showing stroke symptoms (e.g., face drooping, staggering). A red countdown timer starts.
- **BE FAST Minigames:** - Balance (Keep icon in green zone).
    - Eye (Read fading text in blurred vision).
    - Face (Spot the difference on the drooping face).
    - Arm (Catch falling objects before stamina depletes).
    - Speech (Frequency matching to clear slurred speech).
    - Time (Ambulance maze).
- **Emergency Resolution:** Call 115, accurately report symptoms and time, and reject dangerous advice from a neighbor (e.g., giving lemon water).
- **Ending Calculation:** Calculate the final outcome based on Time elapsed, Information accuracy, and Mistakes made.

## 4. Asset Synchronization & Physics (JSON-Driven)
To maintain perfect isometric depth sorting and collision, you MUST NOT use primitive shapes. 
- You must create and strictly follow an `src/game/AssetManifest.json` file.
- This JSON will map coordinates, isometric dimensions (2:1 ratio), collision flags, and anchor points for all tileset slices, furniture, and character sprites.
- Apply dynamic depth sorting (e.g., `sprite.depth = sprite.y + (sprite.height * 0.5)`) so the player walks correctly behind or in front of objects.

## 5. Dynamic VFX & Audio System
- **Normal State:** Bright lighting, cozy lofi background music.
- **Danger State:** When symptoms trigger, apply a dark vignette, a pulsing red border overlay in React, shift the Phaser camera tint to a colder tone, and crossfade the audio to a tense heartbeat/alarm track.
- Create an `AudioManager` to handle seamless crossfading and SFX triggers (footsteps, UI blips, alarms).

## 6. Execution Protocol (YOUR FIRST TASK)
1. Do not build the visual scenes immediately. 
2. Your very first output MUST be the setup of the `src/game/AssetManifest.json` data structure and the `src/store/useGameStore.ts` state machine. 
3. Define the exact grid metrics and state transitions first to ensure architectural stability.