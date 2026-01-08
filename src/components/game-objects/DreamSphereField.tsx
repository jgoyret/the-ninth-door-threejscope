import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import DancingSphere from "../crazy-primitives/DancingSphere";

interface Sphere {
  id: number;
  position: THREE.Vector3;
  scale: number;
  speed: number;
  color: string;
}

interface DreamSphereFieldProps {
  position?: [number, number, number];
  radius?: number;
  maxSpheres?: number;
  riseSpeed?: number;
}

// Colores para las esferas
const SPHERE_COLORS = [
  "#ff00ff", // magenta
  "#00ffff", // cyan
  "#ff88ff", // pink
  "#88ffff", // light cyan
  "#ffaaff", // light pink
  "#aaffff", // pale cyan
  "#ff66cc", // hot pink
  "#66ffcc", // turquoise
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createSphere(id: number, radius: number, startFromBottom: boolean = false): Sphere {
  // Posicion random dentro de una esfera de radio dado
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * radius; // cbrt for uniform distribution

  const x = r * Math.sin(phi) * Math.cos(theta);
  const z = r * Math.sin(phi) * Math.sin(theta);
  // Si startFromBottom, empieza desde abajo del radio
  const y = startFromBottom ? -radius + Math.random() * 0.5 : r * Math.cos(phi);

  return {
    id,
    position: new THREE.Vector3(x, y, z),
    scale: randomInRange(0.15, 0.5),
    speed: randomInRange(0.2, 0.5),
    color: SPHERE_COLORS[Math.floor(Math.random() * SPHERE_COLORS.length)],
  };
}

/**
 * Campo de esferas que flotan hacia arriba.
 * Cuando una esfera sale del radio, se destruye y aparece otra nueva.
 */
export function DreamSphereField({
  position = [0, 0, 0],
  radius = 4,
  maxSpheres = 20,
  riseSpeed = 0.3,
}: DreamSphereFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const nextIdRef = useRef(0);

  // Inicializar esferas
  useEffect(() => {
    const initialSpheres: Sphere[] = [];
    for (let i = 0; i < maxSpheres; i++) {
      initialSpheres.push(createSphere(nextIdRef.current++, radius, false));
    }
    setSpheres(initialSpheres);
  }, [maxSpheres, radius]);

  // Animacion y regeneracion
  useFrame((_, delta) => {
    setSpheres((currentSpheres) => {
      let needsUpdate = false;
      const updatedSpheres = currentSpheres.map((sphere) => {
        // Mover hacia arriba
        const newY = sphere.position.y + sphere.speed * riseSpeed * delta;
        const newPosition = sphere.position.clone();
        newPosition.y = newY;

        // Verificar si salio del radio
        if (newPosition.length() > radius) {
          needsUpdate = true;
          // Crear nueva esfera desde abajo
          return createSphere(nextIdRef.current++, radius, true);
        }

        // Actualizar posicion
        sphere.position.y = newY;
        return sphere;
      });

      return needsUpdate ? updatedSpheres : currentSpheres;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {spheres.map((sphere) => (
        <DancingSphere
          key={sphere.id}
          position={[sphere.position.x, sphere.position.y, sphere.position.z]}
          scale={sphere.scale}
          color={sphere.color}
          distort={0.3}
          speed={2}
          materialProps={{
            roughness: 0.1,
            metalness: 0.1,
            iridescence: 1,
            transparent: true,
            opacity: 0.8,
          }}
        />
      ))}
    </group>
  );
}

export default DreamSphereField;
