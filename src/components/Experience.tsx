import { forwardRef, useImperativeHandle, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  FirstPersonControls,
  Environment,
} from "@react-three/drei";
import OniricHallway from "./3D-models/OniricHallway";
import type { OniricHallwayRef } from "./3D-models/OniricHallway";
import DancingSphere from "./crazy-primitives/DancingSphere";

function Scene() {
  const hallwayRef = useRef<OniricHallwayRef>(null);

  return (
    <>
      {/* Lighting and environment */}
      <Environment
        background={true}
        preset="forest"
        backgroundBlurriness={0.1}
        ground={{ height: 5, radius: 50, scale: 100 }}
      />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {/* Objects */}
      <DancingSphere
        position={[-2.5, 5, 0]}
        color="cyan"
        distort={0.6}
        speed={2}
        onClick={() => hallwayRef.current?.openDoor()}
      />
      <DancingSphere
        position={[2.5, 5, 0]}
        color="hotpink"
        distort={0.6}
        speed={2}
        onClick={() => hallwayRef.current?.closeDoor()}
      />
      <OniricHallway ref={hallwayRef} />

      {/* Controls */}
      <FirstPersonControls
        movementSpeed={5}
        lookSpeed={0.1}
        activeLook={false}
      />
      <OrbitControls />
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
