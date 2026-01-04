import { createContext, useContext, useCallback, type ReactNode } from "react";
import { DOOR_PROMPTS } from "./doorPrompts";

interface GameContextValue {
  onDoorOpen: (doorIndex: number) => void;
  canInteract: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  updatePrompt: (prompt: string, options?: { weight?: number; vaceScale?: number }) => void;
  isConnected: boolean;
}

export function GameProvider({ children, updatePrompt, isConnected }: GameProviderProps) {
  const onDoorOpen = useCallback(
    (doorIndex: number) => {
      if (!isConnected) {
        console.log("Cannot open door - stream not connected");
        return;
      }

      const prompt = DOOR_PROMPTS[doorIndex];
      if (prompt) {
        console.log(`Door ${doorIndex} opened, sending prompt:`, prompt);
        updatePrompt(prompt);
      } else {
        console.warn(`No prompt found for door index ${doorIndex}`);
      }
    },
    [updatePrompt, isConnected]
  );

  return (
    <GameContext.Provider value={{ onDoorOpen, canInteract: isConnected }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
