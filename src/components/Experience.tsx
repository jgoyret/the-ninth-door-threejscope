import { forwardRef, useImperativeHandle, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh position={[-2.5, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="cyan" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <mesh position={[2.5, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
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
        style={{ width, height, backgroundColor: "#333" }}
      >
        <Canvas>
          <Scene />
        </Canvas>
      </div>
    );
  }
);
