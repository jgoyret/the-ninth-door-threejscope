import { create } from "zustand";

export type MessageType = "info" | "action" | "warning";

export interface GameMessage {
  id: string;
  text: string;
  type: MessageType;
  persistent?: boolean;
}

interface GameUIState {
  // Notificaciones temporales (auto-dismiss) o persistentes
  message: GameMessage | null;
  showMessage: (text: string, type?: MessageType, persistent?: boolean) => void;
  clearMessage: () => void;
  // Prompt de acción (mientras miras un objeto - Tipo 1)
  actionPrompt: string | null;
  setActionPrompt: (text: string | null) => void;
}

export const useGameUI = create<GameUIState>((set) => ({
  message: null,
  actionPrompt: null,

  showMessage: (text, type = "info", persistent = false) => {
    const id = crypto.randomUUID();
    set({ message: { id, text, type, persistent } });
  },

  clearMessage: () => {
    set({ message: null });
  },

  setActionPrompt: (text) => {
    set({ actionPrompt: text });
  },
}));
