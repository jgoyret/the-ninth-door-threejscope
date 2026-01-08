import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, PointLight } from "three";
import DancingSphere from "../crazy-primitives/DancingSphere";
import { useOrbStore } from "../../stores/useOrbStore";
import { useCanvasManager } from "../../stores/useCanvasManager";
import { useDoorSequence } from "../../stores/useDoorSequence";
import { useGameUI } from "../../stores/useGameUI";
import { useGame } from "../../game/GameContext";

interface CollectorOrbProps {
  position?: [number, number, number];
  scale?: number;
}

type CollectorState = "inactive" | "active" | "absorbing" | "ready" | "completing";

// Constantes de animación
const ABSORPTION_DURATION = 10; // segundos
const CANVAS_SWITCH_DELAY = 3; // segundos antes de cambiar al canvas IA
const SPIRAL_RADIUS = 0.6; // radio del giro espiral
const SPIRAL_ROTATIONS = 3; // vueltas completas

// Easing functions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
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
    case "completing":
      return "#88ffff"; // Transición suave a cyan claro
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
    case "completing":
      return 0.6; // Se calma
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
    case "completing":
      return 2; // Se desacelera
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
  const mainLightRef = useRef<PointLight>(null);
  const smallLightRef = useRef<PointLight>(null);
  const absorptionStartTime = useRef<number>(0);
  const startDirection = useRef(new THREE.Vector3());
  const { camera } = useThree();

  // Intensidad de luces animada
  const lightIntensity = useRef({ main: 0.5, small: 1 });

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

  // Game context - para enviar vace_ref_images
  const { onOrbDeliver } = useGame();

  // Determinar estado visual (para renderizado)
  const collectorState: CollectorState = useMemo(() => {
    if (absorptionState === "completing") return "completing";
    if (absorptionState === "ready") return "ready";
    if (absorptionState === "absorbing") return "absorbing";
    if (carriedOrb !== null) return "active";
    return "inactive";
  }, [carriedOrb, absorptionState]);

  // Progreso de fade out durante completing (0-1)
  const completingProgress = useRef(0);
  const completingStartTime = useRef(0);

  // Animación
  useFrame((state) => {
    // Flotación del CollectorOrb
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Animación de absorción del orbe pequeño (3 fases)
    if (collectorState === "absorbing" && absorbingOrbRef.current) {
      // Inicializar tiempo de inicio y dirección desde el jugador
      if (absorptionStartTime.current === 0) {
        absorptionStartTime.current = state.clock.elapsedTime;
        // Calcular dirección desde el CollectorOrb hacia el jugador
        const collectorWorldPos = new THREE.Vector3(...position);
        startDirection.current = camera.position.clone().sub(collectorWorldPos).normalize();
      }

      // Calcular progreso basado en tiempo
      const elapsed = state.clock.elapsedTime - absorptionStartTime.current;
      const progress = Math.min(1, elapsed / ABSORPTION_DURATION);
      updateAbsorptionProgress(progress);

      // Fase 1: Viaje desde jugador hacia CollectorOrb (0 - 0.3)
      // Fase 2: Espiral alrededor del CollectorOrb (0.3 - 0.85)
      // Fase 3: Fusión final (0.85 - 1.0)

      let currentScale = 0.25;
      let intensityBoost = 0;

      if (progress < 0.3) {
        // Fase 1: Viaje desde jugador hacia cercanía del orbe
        const phaseProgress = progress / 0.3;
        const eased = easeOutQuad(phaseProgress);

        // Interpolar desde lejos hacia el radio de espiral
        const startDist = 2.0;
        const currentDist = THREE.MathUtils.lerp(startDist, SPIRAL_RADIUS, eased);
        const baseAngle = Math.atan2(startDirection.current.z, startDirection.current.x);

        absorbingOrbRef.current.position.set(
          Math.cos(baseAngle) * currentDist,
          Math.sin(state.clock.elapsedTime * 2) * 0.1,
          Math.sin(baseAngle) * currentDist
        );
        currentScale = THREE.MathUtils.lerp(0.25, 0.2, eased);
        intensityBoost = 0;
      } else if (progress < 0.85) {
        // Fase 2: Espiral hacia el centro
        const phaseProgress = (progress - 0.3) / 0.55;
        const eased = easeInOutCubic(phaseProgress);

        // Radio que se reduce
        const radius = SPIRAL_RADIUS * (1 - eased * 0.85);
        // Ángulo que aumenta (espiral)
        const baseAngle = Math.atan2(startDirection.current.z, startDirection.current.x);
        const angle = baseAngle + phaseProgress * Math.PI * 2 * SPIRAL_ROTATIONS;

        absorbingOrbRef.current.position.set(
          Math.cos(angle) * radius,
          Math.sin(state.clock.elapsedTime * 4) * 0.05 * (1 - eased),
          Math.sin(angle) * radius
        );
        currentScale = THREE.MathUtils.lerp(0.2, 0.1, eased);
        // Intensidad sube en la segunda mitad de esta fase
        intensityBoost = phaseProgress > 0.5 ? (phaseProgress - 0.5) * 2 * 3 : 0;
      } else {
        // Fase 3: Fusión final en el centro
        const phaseProgress = (progress - 0.85) / 0.15;
        const eased = easeInOutCubic(phaseProgress);

        // Pequeñas vibraciones mientras se fusiona
        const vibration = (1 - eased) * 0.08;
        absorbingOrbRef.current.position.set(
          Math.sin(state.clock.elapsedTime * 20) * vibration,
          Math.cos(state.clock.elapsedTime * 15) * vibration,
          Math.sin(state.clock.elapsedTime * 18) * vibration
        );
        currentScale = THREE.MathUtils.lerp(0.1, 0.02, eased);
        // Intensidad máxima al principio, baja al final
        intensityBoost = (1 - eased) * 5;
      }

      absorbingOrbRef.current.scale.setScalar(currentScale);
      absorbingOrbRef.current.rotation.y += 0.05 * (1 + progress * 5);

      // Actualizar intensidad de luces
      lightIntensity.current.main = 2 + absorptionProgress * 2 + intensityBoost;
      lightIntensity.current.small = 1 + absorptionProgress * 2 + intensityBoost * 1.5;

      if (mainLightRef.current) {
        mainLightRef.current.intensity = lightIntensity.current.main;
      }
      if (smallLightRef.current) {
        smallLightRef.current.intensity = lightIntensity.current.small;
      }
    }

    // Animación de fade out suave durante "completing"
    if (collectorState === "completing") {
      if (completingStartTime.current === 0) {
        completingStartTime.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - completingStartTime.current;
      const duration = 2.5; // 2.5 segundos de transición
      completingProgress.current = Math.min(1, elapsed / duration);

      const fadeOut = 1 - easeInOutCubic(completingProgress.current);

      // Reducir intensidad de luces gradualmente
      if (mainLightRef.current) {
        mainLightRef.current.intensity = THREE.MathUtils.lerp(0.5, 4, fadeOut);
      }
      if (smallLightRef.current) {
        smallLightRef.current.intensity = THREE.MathUtils.lerp(0.5, 3, fadeOut);
      }

      // Reducir escala del orbe pequeño si existe
      if (absorbingOrbRef.current) {
        const scale = 0.05 * fadeOut;
        absorbingOrbRef.current.scale.setScalar(Math.max(0.001, scale));
      }
    }

    // Reset cuando vuelve a inactive
    if (collectorState === "inactive") {
      absorptionStartTime.current = 0;
      completingStartTime.current = 0;
      completingProgress.current = 0;
      // Resetear luces a valores normales
      if (mainLightRef.current) {
        mainLightRef.current.intensity = collectorState === "inactive" ? 0.5 : 2;
      }
    }

    // Reset timer de absorción cuando no está absorbiendo
    if (collectorState !== "absorbing" && collectorState !== "completing") {
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

      // 2. Enviar vace_ref_images para el orbe
      onOrbDeliver();

      // 3. Iniciar animación de absorción (visible en ThreeJS primero)
      startAbsorption(doorNumber, color);

      showMessage("Absorption in progress...", "info");

      // 4. Activar canvas IA después de 3 segundos
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
        ref={mainLightRef}
        color={getCollectorColor(collectorState)}
        intensity={collectorState === "inactive" ? 0.5 : 2 + absorptionProgress * 2}
        distance={5}
        decay={2}
      />

      {/* Orbe pequeño durante absorción y completing */}
      {(collectorState === "absorbing" || collectorState === "ready" || collectorState === "completing") &&
        absorbingOrb && (
          <group ref={absorbingOrbRef}>
            <DancingSphere
              scale={1} // Controlado dinámicamente via group.scale
              color={absorbingOrb.color}
              distort={collectorState === "completing" ? 0.4 : 0.6 + absorptionProgress * 0.4}
              speed={collectorState === "completing" ? 1 : 2 + absorptionProgress * 8}
              materialProps={{
                roughness: 0.1,
                metalness: 0.1,
                iridescence: 1,
                transparent: true,
                opacity: collectorState === "ready" ? 0.3 : collectorState === "completing" ? 0.5 : 1,
              }}
            />
            <pointLight
              ref={smallLightRef}
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
