import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import DancingSphere from "../crazy-primitives/DancingSphere";
import { useOrbStore } from "../../stores/useOrbStore";

interface CarriedOrbProps {
  offsetX?: number; // Offset horizontal (derecha positivo)
  offsetY?: number; // Offset vertical (arriba positivo)
  offsetZ?: number; // Offset hacia adelante (negativo = enfrente)
  scale?: number;
}

/**
 * Esfera pequeña que flota enfrente del jugador cuando tiene un orbe.
 * Sigue la posición y rotación de la cámara.
 */
export function CarriedOrb({
  offsetX = 0.1,
  offsetY = -0.2,
  offsetZ = -0.8,
  scale = 0.15,
}: CarriedOrbProps) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const carriedOrb = useOrbStore((state) => state.carriedOrb);

  // Vector temporal para calcular posición
  const tempVector = useRef(new THREE.Vector3());
  const bobOffset = useRef(0);

  useFrame((state) => {
    if (!groupRef.current || !carriedOrb) return;

    // Efecto de bobbing (flotar arriba/abajo)
    bobOffset.current = Math.sin(state.clock.elapsedTime * 3) * 0.03;

    // Calcular posición relativa a la cámara
    tempVector.current.set(offsetX, offsetY + bobOffset.current, offsetZ);
    tempVector.current.applyQuaternion(camera.quaternion);
    tempVector.current.add(camera.position);

    // Aplicar posición
    groupRef.current.position.copy(tempVector.current);

    // Rotar suavemente
    groupRef.current.rotation.y += 0.02;
  });

  // No renderizar si no hay orbe
  if (!carriedOrb) return null;

  return (
    <group ref={groupRef}>
      <DancingSphere
        scale={scale}
        color={carriedOrb.color}
        distort={0.4}
        speed={4}
      />
      {/* Pequeño glow */}
      <pointLight
        color={carriedOrb.color}
        intensity={0.5}
        distance={2}
        decay={2}
      />
    </group>
  );
}

export default CarriedOrb;
