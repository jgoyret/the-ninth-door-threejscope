# The Ninth Door Game

A first-person 3D experience that blends Three.js rendering with real-time AI video transformation. Walk through an oniric corridor of 9 doors, each representing a Jungian archetype in the journey of individuation.

## Concept

The hallway follows **vortex mathematics** for the door sequence: `1 → 2 → 4 → 8 → 7 → 5 → 3 → 6 → 9`

Each door represents an archetype from Carl Jung's analytical psychology:

| Door | Archetype              | Concept                                 |
| ---- | ---------------------- | --------------------------------------- |
| 1    | La Persona             | The mask we wear                        |
| 2    | La Sombra              | The repressed self                      |
| 3    | Anima                  | The feminine, light, creation           |
| 4    | Las 4 Funciones        | Thinking, Feeling, Sensation, Intuition |
| 5    | El Self                | The center, integration                 |
| 6    | Animus                 | The masculine, shadow, dissolution      |
| 7    | El Viejo Sabio         | Inner guide, deep intuition             |
| 8    | Inconsciente Colectivo | Ocean of shared symbols                 |
| 9    | Individuacion          | Singularity, transcendence              |

## Daydream Scope

This project integrates with [**Daydream Scope**](https://github.com/daydreamlive/scope) - a tool for running and customizing real-time, interactive generative AI pipelines. Scope supports multiple autoregressive video diffusion models and enables video-to-video generation workflows.

In this project, Scope runs on **RunPod** GPU instances using the **LongLive** pipeline.

Key features used:

- **WebRTC streaming** - Low-latency bidirectional video streaming
- **VACE** - Reference images and control signals to guide transformations
- **LoRA** - Custom style model (`kxsr_WAN1-3B_cinematic_chase`)
- **Real-time prompts** - Each door sends a unique prompt via data channel

### Depth & Reference Images

The system uses **depth maps** and **reference images** to balance creativity with consistency:

- **Depth maps** - Generated from the Three.js scene, these provide structural guidance to the AI. The depth information helps maintain spatial coherence while allowing the diffusion model creative freedom in textures and details.
- **Reference images** - VACE reference images (like the orb) anchor specific visual elements, ensuring they remain consistent across transformations.

This approach lets the AI "dream" within boundaries - transforming the visuals dramatically while preserving the underlying 3D structure and key objects.

## How It Works

1. **Three.js Canvas** renders the 3D hallway in first-person
2. **WebRTC** streams the canvas to Scope running on RunPod
3. **Scope transforms** the video in real-time using diffusion models
4. **Door prompts** change the AI transformation style as you progress
5. **Orb mechanics**: collect orbs from doors and deliver them to the Collector
6. **VACE**: depth maps and reference images guide the AI transformation

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
│   ├── 3D-models/      # OniricHallway, MetaAngel
│   ├── crazy-primitives/# DancingSphere, etc
│   ├── game-objects/   # CollectorOrb, CarriedOrb
│   ├── ui/             # GameOverlay, TitleScreen, LoadingScreen
│   ├── Experience.tsx  # Main 3D scene
│   └── Player.tsx      # First-person controller
├── game/
│   ├── doorPrompts.ts  # Door configs and prompts
│   └── GameContext.tsx # Game state provider
├── hooks/
│   ├── useScopeConnection.ts  # WebRTC connection
│   └── useDepthRenderer.ts    # Depth map generation
├── stores/             # Zustand stores
│   ├── useCanvasManager.ts
│   ├── useDoorSequence.ts
│   ├── useOrbStore.ts
│   └── useGameUI.ts
└── services/
    └── scopeApi.ts     # Daydream Scope API client
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
- **E** - Interact (open doors, collect/deliver orbs)
- **Click** - Lock pointer

## Environment Variables

| Variable         | Description                 |
| ---------------- | --------------------------- |
| `VITE_SCOPE_URL` | Daydream Scope API endpoint |

## Debug Mode

Set `DEBUG_MODE = true` in `App.tsx` to enable:

- OrbitControls instead of first-person
- Skip title/loading screens
- Bypass stream connection

## License

Private project
