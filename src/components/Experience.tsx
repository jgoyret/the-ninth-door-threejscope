import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  Sky,
  Clouds,
  Cloud,
} from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import { useGame } from "../game";
import OniricHallway from "./3D-models/OniricHallway";
import Player from "./Player";
import { useGameUI } from "../stores/useGameUI";
import { useDepthRenderer } from "../hooks/useDepthRenderer";
import { useCanvasManager } from "../stores/useCanvasManager";
import type { Object3D } from "three";
import MetaAngel from "./3D-models/MetaAngel";
import DancingSphere from "./crazy-primitives/DancingSphere";
import { useDoorSequence } from "../stores/useDoorSequence";
import { CollectorOrb, CarriedOrb, DreamSphereField } from "./game-objects";

interface SceneProps {
  width: number;
  height: number;
  depthFar?: number;
  onDepthCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

function BehindNinthDoor(props: any) {
  const [sphereVisible, setSphereVisible] = useState(true);
  const [dreamFieldActive, setDreamFieldActive] = useState(false);
  const onLookingAtMetaAngel = useCanvasManager(
    (state) => state.onLookingAtMetaAngel
  );

  return (
    <group {...props}>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh position={[0, -1.5, 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="white" side={2} />
        </mesh>
      </RigidBody>
      <MetaAngel position={[0, 0, -4]} scale={10} animationSpeed={0.05} />
      {/* Interactive sphere - disappears after interaction */}
      {sphereVisible && (
        <group
          position={[0, 0, 6]}
          userData={{
            interactable: true,
            type: "dancingsphere",
            getActionPrompt: () => "Press E to enter the dream",
            onInteract: () => {
              console.log("🔮 DancingSphere interacted!");
              setSphereVisible(false);
              setDreamFieldActive(true);
              onLookingAtMetaAngel();
            },
          }}
        >
          <DancingSphere
            color="magenta"
            distort={0.4}
            speed={3}
            scale={0.5}
            position={[0, 0, -1]}
          />
        </group>
      )}
      {/* Dream sphere field - appears after interaction */}
      {dreamFieldActive && (
        <DreamSphereField
          position={[0, 0, 6]}
          radius={4}
          maxSpheres={20}
          riseSpeed={0.3}
        />
      )}
    </group>
  );
}

function Scene({ width, height, depthFar, onDepthCanvasReady }: SceneProps) {
  const setActionPrompt = useGameUI((state) => state.setActionPrompt);
  const { getCanvas } = useDepthRenderer({ width, height, far: depthFar });
  const ninthDoorOpen = useDoorSequence((state) => state.openedDoors.has(9));
  const hallwayHidden = useCanvasManager((state) => state.hallwayHidden);
  const { debugMode } = useGame();

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

  // Debug mode: OrbitControls sin Player (pero con Physics para los RigidBody)
  if (debugMode) {
    return (
      <>
        <Environment
          background={true}
          preset="night"
          backgroundBlurriness={0.1}
        />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, -5]} intensity={1} />
        <OrbitControls makeDefault target={[-10, 1, 0]} />
        <Physics gravity={[0, -9.81, 0]}>
          <CollectorOrb position={[5, 1.2, 0]} scale={0.5} />
          <OniricHallway />
          <BehindNinthDoor
            position={[-20, 1.5, 0]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </Physics>
      </>
    );
  }

  // Normal game mode
  return (
    <>
      {/* Lighting and environment */}
      <Sky
        azimuth={0.1}
        distance={100}
        inclination={0.6}
        rayleigh={2.5}
        sunPosition={[1, 100, -100]}
        turbidity={0.1}
      />
      <Clouds position={[0, 15, 0]}>
        <Cloud
          segments={40}
          bounds={[100, 2, 100]}
          volume={100}
          color="orange"
          speed={0.5}
          opacity={0.1}
        />
        {/* <Cloud seed={1} scale={2} volume={5} color="hotpink" fade={100} /> */}
      </Clouds>
      <Environment
        background={false}
        preset="night"
        backgroundBlurriness={0.1}
      />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, -5]} intensity={1} />

      {/* Orbe que sigue al jugador (fuera de Physics) */}
      <CarriedOrb />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Player */}
        <Player
          speed={1}
          spawn={[2.5, 5, 0]}
          interactionDistance={2}
          onInteract={handleInteract}
          onLookingAt={handleLookingAt}
        />
        {/* Collector Orb - al inicio del pasillo */}
        {!hallwayHidden && <CollectorOrb position={[5, 1.2, 0]} scale={0.5} />}
        {/* Hallway con puertas interactivas - hidden after sphere interaction */}
        {!hallwayHidden && <OniricHallway />}
        {ninthDoorOpen && (
          <BehindNinthDoor
            position={[-20, 1.5, 0]}
            rotation={[0, Math.PI / 2, 0]}
          />
        )}
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
      </div>
    );
  }
);
