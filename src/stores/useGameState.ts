import { create } from "zustand";

export type GamePhase = "title" | "loading" | "playing";

interface GameStateStore {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  startGame: () => void;
  onStreamReady: () => void;
  reset: () => void;
}

export const useGameState = create<GameStateStore>((set) => ({
  phase: "title",

  setPhase: (phase) => set({ phase }),

  startGame: () => set({ phase: "loading" }),

  onStreamReady: () => set({ phase: "playing" }),

  reset: () => set({ phase: "title" }),
}));
