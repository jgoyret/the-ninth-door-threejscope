import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
// import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import OniricHallway from "./3D-models/OniricHallway";
import Player from "./Player";
import { GameOverlay } from "./ui/GameOverlay";
import { useGameUI } from "../stores/useGameUI";
import { useDepthRenderer } from "../hooks/useDepthRenderer";
import type { Object3D } from "three";
import MetaAngel from "./3D-models/MetaAngel";
import { useDoorSequence } from "../stores/useDoorSequence";

interface SceneProps {
  width: number;
  height: number;
  depthFar?: number;
  onDepthCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

function BehindNinthDoor(props: any) {
  return (
    <group {...props}>
      <mesh position={[0, -1.5, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="white" side={2} />
      </mesh>
      <MetaAngel position={[0, 0, -4]} scale={10} animationSpeed={0.05} />
    </group>
  );
}

function Scene({ width, height, depthFar, onDepthCanvasReady }: SceneProps) {
  const setActionPrompt = useGameUI((state) => state.setActionPrompt);
  const { getCanvas } = useDepthRenderer({ width, height, far: depthFar });
  const ninthDoorOpen = useDoorSequence((state) => state.openedDoors.has(9));

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
        preset="night"
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
        {/* <OrbitControls zoomToCursor /> */}
        {/* Hallway con puertas interactivas */}
        <OniricHallway />
        {ninthDoorOpen && <BehindNinthDoor position={[-18, 1.5, -10]} />}
      </Physics>
    </>
  );
}

export type StreamSource = "threejs" | "depth";

export interface ExperienceRef {
  getStream: (fps?: number, source?: StreamSource) => MediaStream | null;
  getDepthCanvas: () => HTMLCanvasElement | null;
}

interface ExperienceProps {
  width?: number;
  height?: number;
  depthFar?: number;
}

export const Experience = forwardRef<ExperienceRef, ExperienceProps>(
  function Experience({ width = 512, height = 512, depthFar }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const depthCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleDepthCanvasReady = useCallback(
      (canvas: HTMLCanvasElement | null) => {
        depthCanvasRef.current = canvas;
      },
      []
    );

    useImperativeHandle(ref, () => ({
      getStream(fps = 30, source: StreamSource = "threejs") {
        if (source === "depth") {
          const depthCanvas = depthCanvasRef.current;
          if (!depthCanvas) return null;
          return depthCanvas.captureStream(fps);
        }
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
        <Canvas camera={{ near: 0.1, far: 50 }}>
          <Scene
            width={width}
            height={height}
            depthFar={depthFar}
            onDepthCanvasReady={handleDepthCanvasReady}
          />
        </Canvas>
        <GameOverlay />
      </div>
    );
  }
);
