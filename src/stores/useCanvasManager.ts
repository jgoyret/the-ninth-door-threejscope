import { create } from "zustand";

export type VisibleCanvas = "threejs" | "ai-output" | "depth";
export type StreamSource = "threejs" | "depth";

interface CanvasManagerStore {
  visibleCanvas: VisibleCanvas;
  streamSource: StreamSource;
  isPostNinthDoor: boolean;
  hallwayHidden: boolean;

  setVisibleCanvas: (canvas: VisibleCanvas) => void;
  setStreamSource: (source: StreamSource) => void;

  // Transiciones automaticas del juego
  onOrbDelivered: () => void;  // Cuando se entrega orbe → muestra canvas IA
  onDoorClosed: () => void;    // Cuando se cierra puerta → vuelve a threejs
  onNinthDoorOpened: () => void;
  onLookingAtMetaAngel: () => void;
  onStopLookingAtMetaAngel: () => void;

  reset: () => void;
}

export const useCanvasManager = create<CanvasManagerStore>((set, get) => ({
  visibleCanvas: "threejs",
  streamSource: "threejs",
  isPostNinthDoor: false,
  hallwayHidden: false,

  setVisibleCanvas: (canvas) => set({ visibleCanvas: canvas }),

  setStreamSource: (source) => set({ streamSource: source }),

  onOrbDelivered: () => {
    console.log("🔮 Orb delivered → showing AI canvas, sending DEPTH to Daydream");
    set({ visibleCanvas: "ai-output", streamSource: "depth" });
  },

  onDoorClosed: () => {
    console.log("🚪 Door closed → showing Three.js canvas, sending THREEJS to Daydream");
    set({ visibleCanvas: "threejs", streamSource: "threejs" });
  },

  onNinthDoorOpened: () => {
    set({
      visibleCanvas: "depth",
      streamSource: "depth",
      isPostNinthDoor: true,
    });
  },

  onLookingAtMetaAngel: () => {
    const { isPostNinthDoor } = get();
    console.log("🎭 onLookingAtMetaAngel called, isPostNinthDoor:", isPostNinthDoor);
    if (isPostNinthDoor) {
      console.log("🎭 Switching to ai-output canvas, hiding hallway");
      set({ visibleCanvas: "ai-output", hallwayHidden: true });
    }
  },

  onStopLookingAtMetaAngel: () => {
    const { isPostNinthDoor } = get();
    console.log("🎭 onStopLookingAtMetaAngel called, isPostNinthDoor:", isPostNinthDoor);
    if (isPostNinthDoor) {
      console.log("🎭 Switching to depth canvas");
      set({ visibleCanvas: "depth" });
    }
  },

  reset: () =>
    set({
      visibleCanvas: "threejs",
      streamSource: "threejs",
      isPostNinthDoor: false,
      hallwayHidden: false,
    }),
}));
