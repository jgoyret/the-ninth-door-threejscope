import { create } from "zustand";

interface PlayerPositionState {
  x: number;
  y: number;
  z: number;
  setPosition: (x: number, y: number, z: number) => void;
}

export const usePlayerPosition = create<PlayerPositionState>((set) => ({
  x: 0,
  y: 0,
  z: 0,
  setPosition: (x, y, z) => set({ x, y, z }),
}));
