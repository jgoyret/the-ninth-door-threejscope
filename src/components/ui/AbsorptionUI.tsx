import { useEffect, useRef } from "react";
import { useOrbStore } from "../../stores/useOrbStore";
import { useCanvasManager } from "../../stores/useCanvasManager";
import { useDoorSequence } from "../../stores/useDoorSequence";
import { useGameUI } from "../../stores/useGameUI";

const PROMPT_DELAY = 20000; // 20 segundos después de iniciar absorción
const CANVAS_TRANSITION_DELAY = 1500; // 1.5 seg antes de cambiar canvas
const COMPLETE_DELAY = 2500; // 2.5 seg para finalizar absorción
const MESSAGE_DELAY = 2000; // 2 seg antes de mostrar "Door X is calling"

/**
 * Componente que maneja el UI global de absorción.
 * Escucha el estado de absorción y muestra prompts / maneja input.
 */
export function AbsorptionUI() {
  const absorptionState = useOrbStore((state) => state.absorptionState);
  const startCompletingAbsorption = useOrbStore((state) => state.startCompletingAbsorption);
  const completeAbsorption = useOrbStore((state) => state.completeAbsorption);
  const onDoorClosed = useCanvasManager((state) => state.onDoorClosed);
  const getNextDoor = useDoorSequence((state) => state.getNextDoor);
  const showMessage = useGameUI((state) => state.showMessage);
  const clearMessage = useGameUI((state) => state.clearMessage);

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
    if (absorptionState === "absorbing" && !promptShown.current && !timeoutRef.current) {
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
      if (e.key.toLowerCase() === "e" && promptShown.current && !isCompleting.current) {
        e.preventDefault();
        console.log("✅ Starting smooth absorption completion...");
        isCompleting.current = true;

        // 1. Limpiar mensaje inmediatamente
        clearMessage();
        promptShown.current = false;

        // 2. Iniciar transición del orbe (estado "completing")
        startCompletingAbsorption();

        // 3. Después de 1.5 seg, cambiar canvas (fade a ThreeJS)
        setTimeout(() => {
          console.log("🎬 Transitioning canvas to ThreeJS...");
          onDoorClosed();
        }, CANVAS_TRANSITION_DELAY);

        // 4. Después de 2.5 seg, finalizar absorción
        setTimeout(() => {
          console.log("🔮 Finalizing absorption...");
          completeAbsorption();
        }, COMPLETE_DELAY);

        // 5. Después de 2 seg más, mostrar mensaje de siguiente puerta
        setTimeout(() => {
          const nextDoor = getNextDoor();
          if (nextDoor) {
            showMessage(`Door ${nextDoor} is calling...`, "info");
          } else {
            showMessage("All doors completed!", "info");
          }
          isCompleting.current = false;
        }, COMPLETE_DELAY + MESSAGE_DELAY);
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
    onDoorClosed,
    getNextDoor,
    showMessage,
    clearMessage,
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
