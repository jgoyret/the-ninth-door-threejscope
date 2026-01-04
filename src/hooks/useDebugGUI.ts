import { useEffect, useRef } from "react";
import GUI from "lil-gui";
import type { StreamSource } from "../components/Experience";

export interface DebugParams {
  depthFar: number;
  streamSource: StreamSource;
  vaceScale: number;
}

interface UseDebugGUIOptions {
  initialValues: DebugParams;
  onChange: (params: DebugParams) => void;
}

export function useDebugGUI({ initialValues, onChange }: UseDebugGUIOptions) {
  const guiRef = useRef<GUI | null>(null);
  const paramsRef = useRef<DebugParams>({ ...initialValues });

  useEffect(() => {
    const gui = new GUI({ title: "Debug Controls" });
    guiRef.current = gui;

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
      gui.destroy();
    };
  }, []);

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
