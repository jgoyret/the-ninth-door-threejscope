import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerPosition } from "../stores/usePlayerPosition";
import { usePlayerCommands } from "../stores/usePlayerCommands";
import { useRaycastDebug } from "../stores/useRaycastDebug";

interface PlayerProps {
  speed?: number;
  spawn?: [number, number, number] | null;
  initialRotation?: [number, number]; // [yaw, pitch] en radianes
  interactionDistance?: number;
  onInteract?: (object: THREE.Object3D | null) => void;
  onLookingAt?: (object: THREE.Object3D | null) => void;
}

export interface PlayerRef {
  current: RapierRigidBody | null;
}

const Player = forwardRef<PlayerRef, PlayerProps>(function Player(
  {
    speed = 4,
    spawn = null,
    initialRotation = [1.5, 0],
    interactionDistance = 3,
    onInteract,
    onLookingAt,
  },
  ref
) {
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(initialRotation[0]);
  const pitch = useRef(initialRotation[1]);
  const { camera, scene } = useThree();
  const rbRef = useRef<RapierRigidBody>(null);
  const initialSpawn = useRef(spawn);

  // Raycast setup
  const raycaster = useRef(new THREE.Raycaster());
  const currentLookingAt = useRef<THREE.Object3D | null>(null);
  const canInteract = useRef(true);
  const lastTeleportTimestamp = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      get current() {
        return rbRef.current;
      },
    }),
    []
  );

  useEffect(() => {
    camera.rotation.order = "YXZ";

    const onPointerLockChange = () => {
      if (document.pointerLockElement) {
        document.body.classList.add("pointer-locked");
      } else {
        document.body.classList.remove("pointer-locked");
        keys.current = {};
      }
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Escape") {
        document.exitPointerLock();
      }
      // Interacción con E
      if (
        e.code === "KeyE" &&
        canInteract.current &&
        document.pointerLockElement
      ) {
        canInteract.current = false;
        onInteract?.(currentLookingAt.current);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === "KeyE") {
        canInteract.current = true;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;

      const mx = e.movementX || 0;
      const my = e.movementY || 0;
      yaw.current -= mx * 0.0025;
      pitch.current -= my * 0.0025;
      const limit = Math.PI / 2 - 0.01;
      pitch.current = Math.max(-limit, Math.min(limit, pitch.current));
    };
    window.addEventListener("mousemove", onMouseMove);

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const daydreamUI = target.closest("[data-daydream-ui]");
      if (daydreamUI) {
        return;
      }

      const canvas = document.querySelector("canvas");
      if (canvas && (e.target === canvas || canvas.contains(target))) {
        document.body.requestPointerLock();
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("click", onClick);
      document.body.classList.remove("pointer-locked");
    };
  }, [camera, onInteract]);

  useFrame(() => {
    if (!rbRef.current) return;

    // Check for teleport commands
    const { teleportCommand, clearTeleport } = usePlayerCommands.getState();
    if (teleportCommand && teleportCommand.timestamp > lastTeleportTimestamp.current) {
      lastTeleportTimestamp.current = teleportCommand.timestamp;
      const [x, y, z] = teleportCommand.position;
      rbRef.current.setTranslation({ x, y, z }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      console.log("🚀 Teleported to:", x, y, z);
      clearTeleport();
    }

    const isControlActive = !!document.pointerLockElement;

    // Raycast para detectar objetos interactables
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.current.far = interactionDistance;

    const intersects = raycaster.current.intersectObjects(scene.children, true);

    // Buscar el primer objeto interactable
    let foundInteractable: THREE.Object3D | null = null;
    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData?.interactable) {
          foundInteractable = obj;
          break;
        }
        obj = obj.parent;
      }
      if (foundInteractable) break;
    }

    // Update raycast debug store
    const raycastDebug = useRaycastDebug.getState();
    if (intersects.length > 0) {
      const firstHit = intersects[0];
      raycastDebug.setHit(
        firstHit.object.name || "unnamed",
        firstHit.distance,
        foundInteractable?.userData?.type || "-"
      );
    } else {
      raycastDebug.clearHit();
    }

    // Notificar cambio de objeto mirando
    if (foundInteractable !== currentLookingAt.current) {
      currentLookingAt.current = foundInteractable;
      onLookingAt?.(foundInteractable);
    }

    // Movimiento
    let vx = 0;
    let vz = 0;

    if (isControlActive) {
      const inputX =
        (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) +
        (keys.current["KeyA"] || keys.current["ArrowLeft"] ? -1 : 0);
      const inputZ =
        (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) +
        (keys.current["KeyS"] || keys.current["ArrowDown"] ? -1 : 0);
      const isSprinting =
        keys.current["ShiftLeft"] || keys.current["ShiftRight"];
      const runSpeed = speed * (isSprinting ? 2 : 1);

      const sinY = Math.sin(yaw.current);
      const cosY = Math.cos(yaw.current);
      const forward = { x: -sinY, z: -cosY };
      const right = { x: cosY, z: -sinY };

      vx = (forward.x * inputZ + right.x * inputX) * runSpeed;
      vz = (forward.z * inputZ + right.z * inputX) * runSpeed;
    }

    const currentVel = rbRef.current.linvel();

    // const isGrounded = Math.abs(currentVel.y) < 0.5;
    let newVelY = currentVel.y;
    // if (isControlActive && keys.current["Space"] && isGrounded) {
    //   newVelY = 7;
    // }

    rbRef.current.setLinvel({ x: vx, y: newVelY, z: vz }, true);

    const pos = rbRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.6, pos.z);
    camera.rotation.set(pitch.current, yaw.current, 0);

    // Update position store for debug
    usePlayerPosition.getState().setPosition(pos.x, pos.y, pos.z);
  });

  const sx = initialSpawn.current?.[0] ?? 0;
  const sy = initialSpawn.current?.[1] ?? 2;
  const sz = initialSpawn.current?.[2] ?? 0;

  return (
    <RigidBody
      ref={rbRef}
      position={[sx, sy, sz]}
      enabledRotations={[false, false, false]}
      lockRotations
      type="dynamic"
      colliders={false}
    >
      <CapsuleCollider args={[0.8, 0.2]} />
    </RigidBody>
  );
});

export default Player;
