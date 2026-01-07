import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import DancingSphere from "../crazy-primitives/DancingSphere";
import { useOrbStore } from "../../stores/useOrbStore";
import { useCanvasManager } from "../../stores/useCanvasManager";

interface CollectorOrbProps {
  position?: [number, number, number];
  scale?: number;
}

/**
 * Esfera grande que recibe los orbes del jugador.
 * Cuando el jugador entrega un orbe aquí, se activa el IA canvas.
 */
export function CollectorOrb({
  position = [0, 1, 0],
  scale = 1,
}: CollectorOrbProps) {
  const meshRef = useRef<Mesh>(null);
  const hasCarriedOrb = useOrbStore((state) => state.hasCarriedOrb);
  const deliverOrb = useOrbStore((state) => state.deliverOrb);
  const onFirstDoorOpened = useCanvasManager(
    (state) => state.onFirstDoorOpened
  );

  // Animación de flotación
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const handleDeliver = () => {
    if (!hasCarriedOrb()) {
      console.log("🔮 No orb to deliver");
      return;
    }

    const deliveredDoor = deliverOrb();
    if (deliveredDoor !== null) {
      console.log(
        `✨ Orb from door ${deliveredDoor} absorbed! Activating IA canvas...`
      );
      // Activar el IA canvas
      onFirstDoorOpened();
    }
  };

  const carriedOrb = useOrbStore((state) => state.carriedOrb);
  const isActive = carriedOrb !== null;

  return (
    <group
      position={position}
      ref={meshRef as any}
      userData={{
        interactable: true,
        type: "collector-orb",
        getActionPrompt: () => {
          if (isActive) {
            return "Press E to deliver the orb";
          }
          return null;
        },
        onInteract: handleDeliver,
      }}
    >
      <DancingSphere
        scale={scale}
        color={isActive ? "#00ff88" : "#ffffffff"}
        distort={isActive ? 0.8 : 0.5}
        speed={isActive ? 3 : 1}
        materialProps={{
          roughness: 0.1,
          metalness: 0.1,
          anisotropy: 16,
        }}
      />
      {/* Glow effect when active */}
      {isActive && (
        <pointLight color="#00ff88" intensity={2} distance={5} decay={2} />
      )}
    </group>
  );
}

export default CollectorOrb;
