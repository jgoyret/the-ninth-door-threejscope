import { create } from "zustand";

interface TeleportCommand {
  position: [number, number, number];
  timestamp: number;
}

interface PlayerCommandsState {
  teleportCommand: TeleportCommand | null;
  teleportTo: (position: [number, number, number]) => void;
  clearTeleport: () => void;
}

export const usePlayerCommands = create<PlayerCommandsState>((set) => ({
  teleportCommand: null,

  teleportTo: (position) =>
    set({
      teleportCommand: {
        position,
        timestamp: Date.now(),
      },
    }),

  clearTeleport: () => set({ teleportCommand: null }),
}));
