# The Ninth Door

A first-person 3D experience that blends Three.js rendering with real-time AI video transformation using Scope. Walk through an oniric corridor of 9 doors, each altering your perception of reality through AI-generated visuals.

## Project Overview

The goal of this project is to explore how AI generation can be integrated into interactive audiovisual experiences—not as a separate effect, but organically woven into the 3D environment, gameplay, and narrative.

The Ninth Door is a puzzle-style game where progression unlocks mechanics that gradually alter how the space is perceived. Through player interaction, different prompts and VACE parameters are modified in real time, causing the environment to be reimagined rather than simply changed.

## Game Concept

The Ninth Door is a first-person puzzle game set inside a corridor with nine doors. Each door can only be opened by following a specific sequence. When a door is opened, the player absorbs an energy visualized through an orb, and their perception of reality shifts.

As the player advances through these perceptual states, the corridor is continuously reimagined by Scope in real time. The experience culminates behind the ninth door, where the player enters a dream state and gains the ability to actively guide where the dream goes.

**Door Sequence (Vortex Mathematics):** `1 → 5 → 7 → 8 → 4 → 2 → 3 → 6 → 9`

## Technical Architecture

**Core Engine:** React Three Fiber (Three.js)

**AI Visuals:** R3F Canvas → WebRTC stream → Scope API → WebRTC return stream → HTML video element

**Real-time Updates:** Prompt and VACE parameter changes sent via WebRTC data channel

**State Management:** Zustand stores for door sequence, canvas visibility, and connection status

### The Three Canvas System

The game manages three canvases simultaneously:

1. **Three.js Canvas** – The main game render: corridor, doors, orbs, player
2. **Depth Canvas** – A grayscale render representing scene depth (closer = lighter, farther = darker)
3. **AI Output Canvas** – The video stream returned by Scope

At any moment, only one canvas is visible to the player, but all three are always active. The game dynamically decides:
- Which canvas to show the player (`visibleCanvas`)
- Which canvas to send to Scope (`streamSource`)
- What VACE parameters to use

This separation between what the player sees and what Scope receives enables fluid transitions and immersive transformations.

### Why Depth as Input?

By sending the depth canvas instead of the full render, we give Scope structural/spatial information without imposing a specific aesthetic. This allows more dramatic transformations while maintaining spatial coherence—the AI reinterprets the visuals completely while respecting the 3D structure.

## Mechanics

### The Absorption Flow (Doors 1-8)

Each door follows this technical flow:

1. **Door Opens** → A prompt specific to that door is sent to Scope with `vace_context_scale` (0.45)
2. **Orb Delivery** → Player carries the orb to the Collector. On delivery:
   - `vace_ref_images` is sent (the orb screenshot)
   - Visible canvas switches from Three.js to AI Output
   - Stream source switches to Depth Canvas
3. **Absorption** → Player sees Scope transform the depth scene based on the door's prompt
4. **Exit** → Player presses E to exit:
   - `vace_context_scale` is updated (0.8) for smoother transition
   - A 5-second blend transitions back to Three.js
   - The game world "emerges" gradually from the AI vision

### The Ninth Door: Entering the Dream

Door 9 works differently. Instead of an absorption that ends and returns you to the corridor, it takes you into a permanent dream state.

When door 9 opens:
- The visible canvas switches to Depth
- Stream source is Depth
- A specific prompt is sent with higher `vace_context_scale`

When the player looks toward the end of the corridor, they trigger "Enter the Dream"—the AI Output canvas becomes visible, the Three.js corridor disappears, and the player is fully immersed in Scope's vision.

### Guiding the Dream

After 10 seconds in the dream, a UI appears allowing the player to write their own prompts:
- Describe where they want the dream to go
- Adjust the **intensity** (`vace_context_scale`) with a slider from 0 to 1

Each prompt modifies the dream's direction in real time—a collaborative experience between the initial prompts and the player's intentions.

## VACE Usage

- **vace_context_scale**: Controls how much the visual input influences the output. Lower values (0.4) give the AI more creative freedom; higher values (0.8-1.0) maintain more fidelity to the original structure.
- **vace_ref_images**: Reference images that influence the output aesthetic. Used for the orb during absorption.
- **Depth as input**: Provides spatial structure without visual details, enabling dramatic reinterpretation while keeping spatial coherence.

## Scope Integration

This project integrates with [**Daydream Scope**](https://github.com/daydreamlive/scope) - a tool for running real-time, interactive generative AI pipelines.

Key features used:
- **WebRTC streaming** - Low-latency bidirectional video streaming
- **VACE** - Reference images and control signals to guide transformations
- **Real-time prompts** - Each door sends a unique prompt via data channel

## Tech Stack

- **React 19** + **TypeScript**
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **@react-three/rapier** - Physics engine
- **Zustand** - State management
- **Vite** - Build tool

## Project Structure

```
src/
├── components/
│   ├── 3D-models/        # OniricHallway, MetaAngel
│   ├── game-objects/     # CollectorOrb, CarriedOrb, DreamSphereField
│   ├── ui/               # GameOverlay, TitleScreen, DreamPromptUI
│   ├── Experience.tsx    # Main 3D scene
│   ├── CanvasGame.tsx    # Canvas management and layers
│   └── Player.tsx        # First-person controller
├── game/
│   ├── doorPrompts.ts    # Door configs and prompts
│   └── GameContext.tsx   # Game state provider
├── hooks/
│   ├── useScopeConnection.ts  # WebRTC connection
│   └── useDepthRenderer.ts    # Depth map generation
├── stores/
│   ├── useCanvasManager.ts    # Canvas visibility and stream source
│   ├── useDoorSequence.ts     # Door progression
│   ├── useOrbStore.ts         # Orb state
│   └── useGameUI.ts           # UI messages and prompts
└── services/
    └── scopeApi.ts       # Scope API client
```

## Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Scope API URL
VITE_SCOPE_URL=https://your-scope-instance.com

# Run development server
npm run dev
```

## Controls

- **WASD** - Move
- **Mouse** - Look around
- **E** - Interact (open doors, collect/deliver orbs, guide dream)
- **Click** - Lock pointer

## Debug Mode

Set `DEBUG_MODE = true` in `App.tsx` to enable:
- OrbitControls instead of first-person
- Skip title/loading screens
- Bypass stream connection
- Canvas view switcher (Three.js / Depth / Scope)

## Notes

- The game runs at 1280×720, Scope output is 512px (16:9) stretched to fill
- Latency between input and AI output is managed through the absorption mechanic—transition moments give Scope time to process while feeling intentional

## License

Private project
