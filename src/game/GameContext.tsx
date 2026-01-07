import { createContext, useContext, useCallback, type ReactNode } from "react";
import { DOOR_PROMPTS } from "./doorPrompts";

interface GameContextValue {
  onDoorOpen: (doorIndex: number) => void;
  canInteract: boolean;
  debugMode: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  updatePrompt: (prompt: string, options?: { weight?: number; vaceScale?: number }) => void;
  isConnected: boolean;
  debugMode?: boolean;
}

export function GameProvider({ children, updatePrompt, isConnected, debugMode = false }: GameProviderProps) {
  const onDoorOpen = useCallback(
    (doorIndex: number) => {
      if (debugMode) {
        console.log(`[DEBUG] Door ${doorIndex} would open, but debug mode is active`);
        return;
      }

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
    [updatePrompt, isConnected, debugMode]
  );

  return (
    <GameContext.Provider value={{ onDoorOpen, canInteract: isConnected || debugMode, debugMode }}>
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
