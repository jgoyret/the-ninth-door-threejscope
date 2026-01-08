import { MeshDistortMaterial } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { ComponentProps } from "react";

type MaterialProps = Omit<
  ComponentProps<typeof MeshDistortMaterial>,
  "color" | "distort" | "speed"
>;

interface DancingSphereProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  distort?: number;
  speed?: number;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  materialProps?: MaterialProps;
}

export default function DancingSphere({
  position = [0, 0, 0],
  scale = 1,
  color = "cyan",
  distort = 0.6,
  speed = 2,
  onClick,
  materialProps,
}: DancingSphereProps) {
  return (
    <mesh position={position} scale={scale} onClick={onClick}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <MeshDistortMaterial
        color={color}
        distort={distort}
        speed={speed}
        {...materialProps}
      />
    </mesh>
  );
}
