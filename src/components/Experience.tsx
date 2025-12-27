import { forwardRef, useImperativeHandle, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  FirstPersonControls,
  MeshDistortMaterial,
  Environment,
} from "@react-three/drei";
import { Person } from "./3D-models/person";

function Scene() {
  return (
    <>
      <Environment
        background={true}
        preset="forest"
        backgroundBlurriness={0.1}
        ground={{ height: 5, radius: 50, scale: 100 }}
      />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh position={[-2.5, 2, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        {/* <meshStandardMaterial color="cyan" /> */}
        <MeshDistortMaterial color="cyan" distort={0.6} speed={2} />
      </mesh>
      <Person position={[0, 0, 0]} scale={2} />
      <mesh position={[2.5, 2, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        {/* <meshStandardMaterial color="yellow" /> */}
        <MeshDistortMaterial color="hotpink" distort={0.6} speed={2} />
      </mesh>
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
