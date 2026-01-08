import { useEffect, useRef } from "react";
import { useOrbStore } from "../../stores/useOrbStore";
import { useCanvasManager } from "../../stores/useCanvasManager";
import { useDoorSequence } from "../../stores/useDoorSequence";
import { useGameUI } from "../../stores/useGameUI";
import { useGame } from "../../game";

const PROMPT_DELAY = 20000; // 20 segundos después de iniciar absorción
const BLEND_START_DELAY = 5000; // 10 seg después de presionar E para iniciar el blend
const BLEND_DURATION = 5000; // 5 seg de blend suave entre canvas IA y threejs
const MESSAGE_DELAY = 2000; // 2 seg antes de mostrar "Door X is calling"

/**
 * Componente que maneja el UI global de absorción.
 * Escucha el estado de absorción y muestra prompts / maneja input.
 */
export function AbsorptionUI() {
  const absorptionState = useOrbStore((state) => state.absorptionState);
  const startCompletingAbsorption = useOrbStore(
    (state) => state.startCompletingAbsorption
  );
  const completeAbsorption = useOrbStore((state) => state.completeAbsorption);
  const startExitBlend = useCanvasManager((state) => state.startExitBlend);
  const completeExitBlend = useCanvasManager(
    (state) => state.completeExitBlend
  );
  const getNextDoor = useDoorSequence((state) => state.getNextDoor);
  const showMessage = useGameUI((state) => state.showMessage);
  const clearMessage = useGameUI((state) => state.clearMessage);
  const { onExitAbsorption } = useGame();

  const promptShown = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const isCompleting = useRef(false);

  // Manejar absorción - mostrar prompt después de 20 seg y escuchar tecla E
  useEffect(() => {
    // Si está en idle y no estamos completando, limpiar todo
    if (absorptionState === "idle" && !isCompleting.current) {
      promptShown.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Cuando empieza absorbing, programar el prompt para 20 seg después
    if (
      absorptionState === "absorbing" &&
      !promptShown.current &&
      !timeoutRef.current
    ) {
      console.log("🌀 Absorption started - prompt will show in 20 seconds");

      timeoutRef.current = window.setTimeout(() => {
        console.log("🎯 Showing absorption prompt");
        // Tipo 2 persistente - centro de pantalla
        showMessage("Press E to complete absorption", "action", true);
        promptShown.current = true;
        timeoutRef.current = null;
      }, PROMPT_DELAY);
    }

    // Handler para tecla E (solo si el prompt ya se mostró y no estamos completando)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "e" &&
        promptShown.current &&
        !isCompleting.current
      ) {
        e.preventDefault();
        console.log("✅ Starting smooth absorption completion...");
        isCompleting.current = true;

        // 1. Limpiar mensaje inmediatamente
        clearMessage();
        promptShown.current = false;

        // 2. Iniciar transición del orbe (estado "completing")
        startCompletingAbsorption();

        // 3. Cambiar stream a threejs y enviar vace_context_scale=1
        useCanvasManager.getState().setStreamSource("threejs");
        onExitAbsorption();
        console.log("🎬 Stream changed to threejs, vace_context_scale=1");

        // 4. Después de 10 seg, iniciar el blend (fade out del canvas IA)
        setTimeout(() => {
          console.log("🌅 Starting 5s blend...");
          startExitBlend();
        }, BLEND_START_DELAY);

        // 5. Después de 10 + 5 seg (blend completo), ocultar canvas IA y finalizar
        setTimeout(() => {
          console.log("🔮 Blend complete, finalizing...");
          completeExitBlend();
          completeAbsorption();
        }, BLEND_START_DELAY + BLEND_DURATION);

        // 6. Después de 2 seg más, mostrar mensaje de siguiente puerta
        setTimeout(() => {
          const nextDoor = getNextDoor();
          if (nextDoor) {
            showMessage(`Door ${nextDoor} is calling...`, "info");
          } else {
            showMessage("All doors completed!", "info");
          }
          isCompleting.current = false;
        }, BLEND_START_DELAY + BLEND_DURATION + MESSAGE_DELAY);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    absorptionState,
    startCompletingAbsorption,
    completeAbsorption,
    startExitBlend,
    completeExitBlend,
    getNextDoor,
    showMessage,
    clearMessage,
    onExitAbsorption,
  ]);

  // Limpiar mensaje cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearMessage();
    };
  }, [clearMessage]);

  // Este componente no renderiza nada visible - solo maneja lógica
  return null;
}

export default AbsorptionUI;
