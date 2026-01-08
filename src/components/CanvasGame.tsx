import { type RefObject, useEffect } from "react";
import { Experience, type ExperienceRef } from "./Experience";
import { GameOverlay } from "./ui/GameOverlay";
import { AbsorptionUI } from "./ui/AbsorptionUI";
import { useCanvasManager } from "../stores/useCanvasManager";

interface CanvasGameProps {
  experienceRef: RefObject<ExperienceRef | null>;
  outputVideoRef: RefObject<HTMLVideoElement | null>;
  depthContainerRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  depthFar: number;
}

export function CanvasGame({
  experienceRef,
  outputVideoRef,
  depthContainerRef,
  width,
  height,
  depthFar,
}: CanvasGameProps) {
  const visibleCanvas = useCanvasManager((state) => state.visibleCanvas);

  // Mount depth canvas when ready
  useEffect(() => {
    const interval = setInterval(() => {
      const depthCanvas = experienceRef.current?.getDepthCanvas();
      if (depthCanvas && depthContainerRef.current) {
        if (!depthContainerRef.current.contains(depthCanvas)) {
          // Stretch canvas to fill container
          depthCanvas.style.width = "100%";
          depthCanvas.style.height = "100%";
          depthContainerRef.current.appendChild(depthCanvas);
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [experienceRef, depthContainerRef]);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "#000",
      }}
    >
      {/* Layer 1: Three.js - always renders, receives interaction */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <Experience
          ref={experienceRef}
          width={width}
          height={height}
          depthFar={depthFar}
        />
      </div>

      {/* Layer 2: Depth canvas */}
      <div
        ref={depthContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: visibleCanvas === "depth" ? 2 : 0,
          opacity: visibleCanvas === "depth" ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/* Layer 3: AI Output video - overlay with pointer-events none */}
      <video
        ref={outputVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: visibleCanvas === "ai-output" ? 3 : 0,
          opacity: visibleCanvas === "ai-output" ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/* Layer 100: GameOverlay - always visible on top */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <GameOverlay />
      </div>

      {/* AbsorptionUI - maneja lógica global de absorción */}
      <AbsorptionUI />
    </div>
  );
}
