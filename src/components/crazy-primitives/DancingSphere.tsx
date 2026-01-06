import { MeshDistortMaterial } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

interface DancingSphereProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  distort?: number;
  speed?: number;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export default function DancingSphere({
  position = [0, 0, 0],
  scale = 1,
  color = "cyan",
  distort = 0.6,
  speed = 2,
  onClick,
}: DancingSphereProps) {
  return (
    <mesh position={position} scale={scale} onClick={onClick}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <MeshDistortMaterial color={color} distort={distort} speed={speed} />
    </mesh>
  );
}
