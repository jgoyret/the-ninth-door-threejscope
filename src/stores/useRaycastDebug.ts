import { create } from "zustand";

interface RaycastDebugState {
  hitName: string;
  hitDistance: number;
  hitType: string;
  setHit: (name: string, distance: number, type: string) => void;
  clearHit: () => void;
}

export const useRaycastDebug = create<RaycastDebugState>((set) => ({
  hitName: "-",
  hitDistance: 0,
  hitType: "-",
  setHit: (name, distance, type) => set({ hitName: name, hitDistance: distance, hitType: type }),
  clearHit: () => set({ hitName: "-", hitDistance: 0, hitType: "-" }),
}));
