import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import DancingSphere from "../crazy-primitives/DancingSphere";
import { useOrbStore } from "../../stores/useOrbStore";
import { useCanvasManager } from "../../stores/useCanvasManager";
import { useDoorSequence } from "../../stores/useDoorSequence";
import { useGameUI } from "../../stores/useGameUI";

interface CollectorOrbProps {
  position?: [number, number, number];
  scale?: number;
}

type CollectorState = "inactive" | "active" | "absorbing" | "ready";

// Constantes de animación
const ABSORPTION_DURATION = 10; // segundos
const ORB_START_DISTANCE = 1.5; // distancia inicial del orbe pequeño
const CANVAS_SWITCH_DELAY = 3; // segundos antes de cambiar al canvas IA

// Easing function para movimiento suave
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Helpers para estilos visuales según estado
function getCollectorColor(state: CollectorState): string {
  switch (state) {
    case "active":
      return "#00ff88";
    case "absorbing":
      return "#ff8800";
    case "ready":
      return "#00ffff";
    default:
      return "#ffffff";
  }
}

function getDistortLevel(state: CollectorState, progress: number): number {
  switch (state) {
    case "active":
      return 0.8;
    case "absorbing":
      return 0.6 + progress * 0.4; // 0.6 -> 1.0
    case "ready":
      return 0.9;
    default:
      return 0.5;
  }
}

function getSpeedLevel(state: CollectorState, progress: number): number {
  switch (state) {
    case "active":
      return 3;
    case "absorbing":
      return 2 + progress * 6; // 2 -> 8
    case "ready":
      return 4;
    default:
      return 1;
  }
}

/**
 * Esfera grande que recibe los orbes del jugador.
 * Cuando el jugador entrega un orbe aquí:
 * 1. La puerta se cierra automáticamente
 * 2. Se activa el canvas IA
 * 3. El orbe es absorbido visualmente (~10 seg)
 * 4. El jugador completa la absorción presionando E
 */
export function CollectorOrb({
  position = [0, 1, 0],
  scale = 1,
}: CollectorOrbProps) {
  const groupRef = useRef<Group>(null);
  const absorbingOrbRef = useRef<Group>(null);
  const absorptionStartTime = useRef<number>(0);

  // Orb store
  const carriedOrb = useOrbStore((state) => state.carriedOrb);
  const absorbingOrb = useOrbStore((state) => state.absorbingOrb);
  const absorptionProgress = useOrbStore((state) => state.absorptionProgress);
  const absorptionState = useOrbStore((state) => state.absorptionState);
  const deliverOrb = useOrbStore((state) => state.deliverOrb);
  const startAbsorption = useOrbStore((state) => state.startAbsorption);
  const updateAbsorptionProgress = useOrbStore(
    (state) => state.updateAbsorptionProgress
  );
  const hasCarriedOrb = useOrbStore((state) => state.hasCarriedOrb);

  // Door sequence
  const closeDoor = useDoorSequence((state) => state.closeDoor);

  // Canvas manager
  const onOrbDelivered = useCanvasManager((state) => state.onOrbDelivered);

  // UI
  const showMessage = useGameUI((state) => state.showMessage);

  // Determinar estado visual (para renderizado)
  const collectorState: CollectorState = useMemo(() => {
    if (absorptionState === "ready") return "ready";
    if (absorptionState === "absorbing") return "absorbing";
    if (carriedOrb !== null) return "active";
    return "inactive";
  }, [carriedOrb, absorptionState]);

  // Animación
  useFrame((state) => {
    // Flotación del CollectorOrb
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Animación de absorción del orbe pequeño
    if (collectorState === "absorbing" && absorbingOrbRef.current) {
      // Inicializar tiempo de inicio
      if (absorptionStartTime.current === 0) {
        absorptionStartTime.current = state.clock.elapsedTime;
      }

      // Calcular progreso basado en tiempo
      const elapsed = state.clock.elapsedTime - absorptionStartTime.current;
      const progress = Math.min(1, elapsed / ABSORPTION_DURATION);

      updateAbsorptionProgress(progress);

      // Posición del orbe: viaja en espiral hacia el centro
      const easedProgress = easeInOutCubic(progress);
      const distance = ORB_START_DISTANCE * (1 - easedProgress);
      const angle = progress * Math.PI * 4; // 2 vueltas completas

      absorbingOrbRef.current.position.set(
        Math.cos(angle) * distance,
        Math.sin(state.clock.elapsedTime * 3) * 0.1 * (1 - easedProgress), // bobbing que se reduce
        Math.sin(angle) * distance
      );

      // Escala reduciéndose
      const startScale = 0.25;
      const endScale = 0.05;
      const currentScale = THREE.MathUtils.lerp(
        startScale,
        endScale,
        easedProgress
      );
      absorbingOrbRef.current.scale.setScalar(currentScale);

      // Rotación acelerando
      absorbingOrbRef.current.rotation.y += 0.05 * (1 + progress * 5);
    }

    // Reset timer cuando termina absorción
    if (collectorState !== "absorbing") {
      absorptionStartTime.current = 0;
    }
  });

  const handleDeliver = () => {
    if (!hasCarriedOrb()) {
      console.log("🔮 No orb to deliver");
      return;
    }

    const delivered = deliverOrb();
    if (delivered) {
      const { doorNumber, color } = delivered;

      console.log(
        `✨ Orb from door ${doorNumber} - closing door and starting absorption...`
      );

      // 1. Cerrar puerta automáticamente
      closeDoor(doorNumber);

      // 2. Iniciar animación de absorción (visible en ThreeJS primero)
      startAbsorption(doorNumber, color);

      showMessage("Absorption in progress...", "info");

      // 3. Activar canvas IA después de 3 segundos
      setTimeout(() => {
        onOrbDelivered();
      }, CANVAS_SWITCH_DELAY * 1000);
    }
  };

  const handleInteract = () => {
    // Leer directamente del store para estado más reciente
    const orbState = useOrbStore.getState();
    const currentAbsorptionState = orbState.absorptionState;
    const hasOrb = orbState.carriedOrb !== null;

    // Solo manejar entrega - la completación la maneja AbsorptionUI globalmente
    if (hasOrb && currentAbsorptionState === "idle") {
      handleDeliver();
    }
  };

  const getActionPrompt = (): string | null => {
    // Leer directamente del store para estado más reciente (evita delays de React)
    const orbState = useOrbStore.getState();
    const currentAbsorptionState = orbState.absorptionState;
    const hasOrb = orbState.carriedOrb !== null;

    // Durante absorción o ready, no mostrar prompt local (es global)
    if (currentAbsorptionState !== "idle") return null;

    if (hasOrb) return "Press E to deliver the orb";
    return null;
  };

  return (
    <group
      position={position}
      ref={groupRef}
      userData={{
        interactable: true,
        type: "collector-orb",
        getActionPrompt,
        onInteract: handleInteract,
      }}
    >
      {/* CollectorOrb principal */}
      <DancingSphere
        scale={scale}
        color={getCollectorColor(collectorState)}
        distort={getDistortLevel(collectorState, absorptionProgress)}
        speed={getSpeedLevel(collectorState, absorptionProgress)}
        materialProps={{
          roughness: 0.1,
          metalness: 0.1,
          iridescence: 1,
        }}
      />

      {/* Glow según estado */}
      <pointLight
        color={getCollectorColor(collectorState)}
        intensity={collectorState === "inactive" ? 0.5 : 2 + absorptionProgress * 2}
        distance={5}
        decay={2}
      />

      {/* Orbe pequeño durante absorción - efecto metaball simulado */}
      {(collectorState === "absorbing" || collectorState === "ready") &&
        absorbingOrb && (
          <group ref={absorbingOrbRef}>
            <DancingSphere
              scale={1} // Controlado dinámicamente via group.scale
              color={absorbingOrb.color}
              distort={0.6 + absorptionProgress * 0.4}
              speed={2 + absorptionProgress * 8}
              materialProps={{
                roughness: 0.1,
                metalness: 0.1,
                iridescence: 1,
                transparent: true,
                opacity: collectorState === "ready" ? 0.3 : 1,
              }}
            />
            <pointLight
              color={absorbingOrb.color}
              intensity={1 + absorptionProgress * 2}
              distance={3}
              decay={2}
            />
          </group>
        )}

      {/* Anillo pulsante para estado ready */}
      {collectorState === "ready" && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9 * scale, 1.1 * scale, 32]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default CollectorOrb;
