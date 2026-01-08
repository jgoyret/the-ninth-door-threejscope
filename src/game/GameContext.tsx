import { createContext, useContext, useCallback, type ReactNode } from "react";
import { getDoorByNumber } from "./doorPrompts";
import { scopeApi } from "../services/scopeApi";

interface GameContextValue {
  onDoorOpen: (doorNumber: number) => void;
  onOrbDeliver: () => void;
  onExitAbsorption: () => void;
  sendDreamPrompt: (prompt: string, vaceScale: number) => void;
  canInteract: boolean;
  debugMode: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
  updatePrompt: (
    prompt: string,
    options?: { weight?: number; vaceScale?: number }
  ) => void;
  updateVaceRefImages: (images: string[]) => void;
  updateVaceScale: (vaceScale: number) => void;
  isConnected: boolean;
  debugMode?: boolean;
  vaceScale?: number;
}

export function GameProvider({
  children,
  updatePrompt,
  updateVaceRefImages,
  updateVaceScale,
  isConnected,
  debugMode = false,
  vaceScale = 0.45,
}: GameProviderProps) {
  const onDoorOpen = useCallback(
    (doorNumber: number) => {
      if (debugMode) {
        console.log(
          `[DEBUG] Door ${doorNumber} would open, but debug mode is active`
        );
        return;
      }

      if (!isConnected) {
        console.log("Cannot open door - stream not connected");
        return;
      }

      const doorConfig = getDoorByNumber(doorNumber);
      if (doorConfig?.prompt) {
        console.log(
          `Door ${doorNumber} opened, sending prompt with vace_context_scale=${vaceScale}:`,
          doorConfig.prompt
        );
        updatePrompt(doorConfig.prompt, { vaceScale });
      } else {
        console.warn(`No prompt found for door ${doorNumber}`);
      }
    },
    [updatePrompt, isConnected, debugMode, vaceScale]
  );

  const onOrbDeliver = useCallback(() => {
    if (debugMode) {
      console.log("[DEBUG] Orb delivered, but debug mode is active");
      return;
    }

    if (!isConnected) {
      console.log("Cannot send vace_ref_images - stream not connected");
      return;
    }

    const orbPath = scopeApi.getAssetPath("orb");
    if (orbPath) {
      console.log(`🔮 Orb delivered, sending vace_ref_images: [${orbPath}]`);
      updateVaceRefImages([orbPath]);
    } else {
      console.warn("Orb asset path not found");
    }
  }, [updateVaceRefImages, isConnected, debugMode]);

  const onExitAbsorption = useCallback(() => {
    if (debugMode) {
      console.log("[DEBUG] Exit absorption, but debug mode is active");
      return;
    }

    if (!isConnected) {
      console.log("Cannot update vace_context_scale - stream not connected");
      return;
    }

    console.log("🌅 Exit absorption: sending vace_context_scale=0.8");
    updateVaceScale(0.8);
  }, [updateVaceScale, isConnected, debugMode]);

  const sendDreamPrompt = useCallback(
    (prompt: string, vaceScale: number) => {
      if (debugMode) {
        console.log("[DEBUG] Dream prompt, but debug mode is active:", prompt);
        return;
      }

      if (!isConnected) {
        console.log("Cannot send dream prompt - stream not connected");
        return;
      }

      console.log(`💭 Sending dream prompt (vace_scale=${vaceScale.toFixed(2)}):`, prompt);
      updatePrompt(prompt, { vaceScale });
    },
    [updatePrompt, isConnected, debugMode]
  );

  return (
    <GameContext.Provider
      value={{
        onDoorOpen,
        onOrbDeliver,
        onExitAbsorption,
        sendDreamPrompt,
        canInteract: isConnected || debugMode,
        debugMode,
      }}
    >
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
