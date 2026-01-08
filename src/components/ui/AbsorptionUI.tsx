import { useEffect } from "react";
import { useOrbStore } from "../../stores/useOrbStore";
import { useCanvasManager } from "../../stores/useCanvasManager";
import { useDoorSequence } from "../../stores/useDoorSequence";
import { useGameUI } from "../../stores/useGameUI";

/**
 * Componente que maneja el UI global de absorción.
 * Escucha el estado de absorción y muestra prompts / maneja input.
 */
export function AbsorptionUI() {
  const absorptionState = useOrbStore((state) => state.absorptionState);
  const completeAbsorption = useOrbStore((state) => state.completeAbsorption);
  const onDoorClosed = useCanvasManager((state) => state.onDoorClosed);
  const getNextDoor = useDoorSequence((state) => state.getNextDoor);
  const showMessage = useGameUI((state) => state.showMessage);
  const setActionPrompt = useGameUI((state) => state.setActionPrompt);

  // Manejar estado "ready" - mostrar prompt y escuchar tecla E
  useEffect(() => {
    if (absorptionState !== "ready") {
      return;
    }

    console.log("🎯 Absorption ready - showing prompt");

    // Mostrar prompt persistente
    setActionPrompt("Press E to complete absorption");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        console.log("✅ Completing absorption via global key");

        // Limpiar prompt
        setActionPrompt(null);

        // Completar absorción
        completeAbsorption();

        // Volver a ThreeJS
        onDoorClosed();

        // Mostrar siguiente puerta
        const nextDoor = getNextDoor();
        if (nextDoor) {
          showMessage(`Door ${nextDoor} is calling...`, "info");
        } else {
          showMessage("All doors completed!", "info");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      setActionPrompt(null);
    };
  }, [
    absorptionState,
    completeAbsorption,
    onDoorClosed,
    getNextDoor,
    showMessage,
    setActionPrompt,
  ]);

  // Este componente no renderiza nada visible - solo maneja lógica
  return null;
}

export default AbsorptionUI;
