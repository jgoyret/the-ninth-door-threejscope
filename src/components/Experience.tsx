import { forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import OniricHallway from "./3D-models/OniricHallway";
import Player from "./Player";
import type { Object3D } from "three";

function Scene() {
  const handleInteract = useCallback((object: Object3D | null) => {
    if (!object) return;

    // Si tiene función onInteract en userData, ejecutarla
    if (object.userData?.onInteract) {
      object.userData.onInteract();
    }
  }, []);

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
          interactionDistance={3}
          onInteract={handleInteract}
        />
        {/* Hallway con puertas interactivas */}
        <OniricHallway />
      </Physics>
    </>
  );
}

export interface ExperienceRef {
  getStream: (fps?: number) => MediaStream | null;
}

interface ExperienceProps {
  width?: number;
  height?: number;
}

export const Experience = forwardRef<ExperienceRef, ExperienceProps>(
  function Experience({ width = 512, height = 512 }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getStream(fps = 30) {
        const canvas = containerRef.current?.querySelector("canvas");
        if (!canvas) return null;
        return canvas.captureStream(fps);
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{ width, height, backgroundColor: "#000000ff" }}
      >
        <Canvas>
          <Scene />
        </Canvas>
      </div>
    );
  }
);
