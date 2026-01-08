import { create } from "zustand";

export type GamePhase = "title" | "loading" | "playing";

interface GameStateStore {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  startGame: () => void;
  onStreamReady: () => void;
  reset: () => void;
  // Initial prompt tracking
  hasShownInitialPrompt: boolean;
  markInitialPromptShown: () => void;
}

export const useGameState = create<GameStateStore>((set) => ({
  phase: "title",
  hasShownInitialPrompt: false,

  setPhase: (phase) => set({ phase }),

  startGame: () => set({ phase: "loading" }),

  onStreamReady: () => set({ phase: "playing" }),

  reset: () => set({ phase: "title", hasShownInitialPrompt: false }),

  markInitialPromptShown: () => set({ hasShownInitialPrompt: true }),
}));
