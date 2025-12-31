import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import OniricHallway from "./3D-models/OniricHallway";
import Player from "./Player";
import { GameOverlay } from "./ui/GameOverlay";
import { useGameUI } from "../stores/useGameUI";
import { useDepthRenderer } from "../hooks/useDepthRenderer";
import type { Object3D } from "three";

interface SceneProps {
  width: number;
  height: number;
  onDepthCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

function Scene({ width, height, onDepthCanvasReady }: SceneProps) {
  const setActionPrompt = useGameUI((state) => state.setActionPrompt);
  const { getCanvas } = useDepthRenderer({ width, height });

  useEffect(() => {
    const canvas = getCanvas();
    onDepthCanvasReady?.(canvas);
  }, [getCanvas, onDepthCanvasReady]);

  const handleInteract = useCallback((object: Object3D | null) => {
    if (!object) return;

    if (object.userData?.onInteract) {
      object.userData.onInteract();
    }
  }, []);

  const handleLookingAt = useCallback(
    (object: Object3D | null) => {
      if (!object) {
        setActionPrompt(null);
        return;
      }

      const getPrompt = object.userData?.getActionPrompt;
      if (typeof getPrompt === "function") {
        setActionPrompt(getPrompt());
      } else {
        setActionPrompt(null);
      }
    },
    [setActionPrompt]
  );

  return (
    <>
      {/* Lighting and environment */}
      <Environment
        background={true}
        preset="forest"
        backgroundBlurriness={0.1}
      />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, -5]} intensity={1} />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Player */}
        <Player
          speed={1}
          spawn={[2.5, 5, 0]}
          interactionDistance={1}
          onInteract={handleInteract}
          onLookingAt={handleLookingAt}
        />
        {/* Hallway con puertas interactivas */}
        <OniricHallway />
      </Physics>
    </>
  );
}

export interface ExperienceRef {
  getStream: (fps?: number) => MediaStream | null;
  getDepthCanvas: () => HTMLCanvasElement | null;
}

interface ExperienceProps {
  width?: number;
  height?: number;
}

export const Experience = forwardRef<ExperienceRef, ExperienceProps>(
  function Experience({ width = 512, height = 512 }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const depthCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleDepthCanvasReady = useCallback(
      (canvas: HTMLCanvasElement | null) => {
        depthCanvasRef.current = canvas;
      },
      []
    );

    useImperativeHandle(ref, () => ({
      getStream(fps = 30) {
        const canvas = containerRef.current?.querySelector("canvas");
        if (!canvas) return null;
        return canvas.captureStream(fps);
      },
      getDepthCanvas() {
        return depthCanvasRef.current;
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{
          width,
          height,
          backgroundColor: "#000000ff",
          position: "relative",
        }}
      >
        <Canvas camera={{ near: 0.1, far: 30 }}>
          <Scene
            width={width}
            height={height}
            onDepthCanvasReady={handleDepthCanvasReady}
          />
        </Canvas>
        <GameOverlay />
      </div>
    );
  }
);
