import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import type { StreamSource } from "../components/Experience";
import { usePlayerPosition } from "../stores/usePlayerPosition";
import { useRaycastDebug } from "../stores/useRaycastDebug";
import { setGameStatePreset } from "../game/gameStates";
import { useCanvasManager } from "../stores/useCanvasManager";

export interface DebugParams {
  depthFar: number;
  streamSource: StreamSource;
  vaceScale: number;
}

interface UseDebugGUIOptions {
  enabled?: boolean;
  initialValues: DebugParams;
  onChange: (params: DebugParams) => void;
}

export function useDebugGUI({ enabled = true, initialValues, onChange }: UseDebugGUIOptions) {
  const guiRef = useRef<GUI | null>(null);
  const paramsRef = useRef<DebugParams>({ ...initialValues });

  useEffect(() => {
    if (!enabled) return;

    const gui = new GUI({ title: "Debug Controls" });
    guiRef.current = gui;

    // Player position display
    const positionData = { position: "0, 0, 0" };
    const playerFolder = gui.addFolder("Player");
    const posController = playerFolder.add(positionData, "position").name("Position").disable();
    playerFolder.open();

    // Raycast debug display
    const raycastFolder = gui.addFolder("Raycast Debug");
    const raycastData = {
      hitName: "-",
      distance: "0.00",
      type: "-"
    };
    const hitNameController = raycastFolder.add(raycastData, "hitName").name("Hit Object").disable();
    const distanceController = raycastFolder.add(raycastData, "distance").name("Distance").disable();
    const typeController = raycastFolder.add(raycastData, "type").name("Type").disable();
    raycastFolder.open();

    // Game state presets
    const gameStateFolder = gui.addFolder("Game States");
    const stateActions = {
      initial: () => setGameStatePreset("initial"),
      after9door: () => setGameStatePreset("after9door"),
    };
    gameStateFolder.add(stateActions, "initial").name("🔄 Reset to Initial");
    gameStateFolder.add(stateActions, "after9door").name("🚪 After 9th Door");
    gameStateFolder.open();

    // Canvas view switcher (for debugging - see what each canvas shows)
    const canvasViewFolder = gui.addFolder("Canvas View (Debug)");
    const canvasViewData = { current: useCanvasManager.getState().visibleCanvas };
    const canvasActions = {
      threejs: () => {
        useCanvasManager.getState().setVisibleCanvas("threejs");
        canvasViewData.current = "threejs";
        currentCanvasController.updateDisplay();
      },
      depth: () => {
        useCanvasManager.getState().setVisibleCanvas("depth");
        canvasViewData.current = "depth";
        currentCanvasController.updateDisplay();
      },
      scope: () => {
        useCanvasManager.getState().setVisibleCanvas("ai-output");
        canvasViewData.current = "ai-output";
        currentCanvasController.updateDisplay();
      },
    };
    const currentCanvasController = canvasViewFolder.add(canvasViewData, "current").name("Current").disable();
    canvasViewFolder.add(canvasActions, "threejs").name("👁️ Three.js");
    canvasViewFolder.add(canvasActions, "depth").name("👁️ Depth");
    canvasViewFolder.add(canvasActions, "scope").name("👁️ Scope (AI)");
    canvasViewFolder.open();

    // Update position, raycast, and canvas view every 100ms
    const positionInterval = setInterval(() => {
      const { x, y, z } = usePlayerPosition.getState();
      positionData.position = `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
      posController.updateDisplay();

      const raycast = useRaycastDebug.getState();
      raycastData.hitName = raycast.hitName;
      raycastData.distance = raycast.hitDistance.toFixed(2);
      raycastData.type = raycast.hitType;
      hitNameController.updateDisplay();
      distanceController.updateDisplay();
      typeController.updateDisplay();

      // Update canvas view from store (in case game changed it)
      const currentCanvas = useCanvasManager.getState().visibleCanvas;
      if (canvasViewData.current !== currentCanvas) {
        canvasViewData.current = currentCanvas;
        currentCanvasController.updateDisplay();
      }
    }, 100);

    gui.add(paramsRef.current, "depthFar", 1, 50, 1)
      .name("Depth Far")
      .onChange((value: number) => {
        paramsRef.current.depthFar = value;
        onChange({ ...paramsRef.current });
      });

    gui.add(paramsRef.current, "streamSource", ["threejs", "depth"])
      .name("Stream Source")
      .onChange((value: StreamSource) => {
        paramsRef.current.streamSource = value;
        onChange({ ...paramsRef.current });
      });

    // Daydream folder
    const daydreamFolder = gui.addFolder("Daydream");
    daydreamFolder.add(paramsRef.current, "vaceScale", 0, 1, 0.01)
      .name("Vace Scale")
      .onChange((value: number) => {
        paramsRef.current.vaceScale = value;
        onChange({ ...paramsRef.current });
      });

    return () => {
      clearInterval(positionInterval);
      gui.destroy();
    };
  }, [enabled]);

  // Update GUI when external values change
  useEffect(() => {
    paramsRef.current.depthFar = initialValues.depthFar;
    paramsRef.current.streamSource = initialValues.streamSource;
    paramsRef.current.vaceScale = initialValues.vaceScale;
    guiRef.current?.controllersRecursive().forEach((controller) => {
      controller.updateDisplay();
    });
  }, [initialValues.depthFar, initialValues.streamSource, initialValues.vaceScale]);
}
