import { create } from "zustand";

export type MessageType = "info" | "action" | "warning";

export interface GameMessage {
  id: string;
  text: string;
  type: MessageType;
}

interface GameUIState {
  // Notificaciones temporales (auto-dismiss)
  message: GameMessage | null;
  showMessage: (text: string, type?: MessageType) => void;
  clearMessage: () => void;
  // Prompt de acción (mientras miras un objeto)
  actionPrompt: string | null;
  setActionPrompt: (text: string | null) => void;
}

export const useGameUI = create<GameUIState>((set) => ({
  message: null,
  actionPrompt: null,

  showMessage: (text, type = "info") => {
    const id = crypto.randomUUID();
    set({ message: { id, text, type } });
  },

  clearMessage: () => {
    set({ message: null });
  },

  setActionPrompt: (text) => {
    set({ actionPrompt: text });
  },
}));
