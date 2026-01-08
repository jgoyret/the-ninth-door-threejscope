import { type RefObject, useEffect, useState } from "react";
import { Experience, type ExperienceRef } from "./Experience";
import { GameOverlay } from "./ui/GameOverlay";
import { AbsorptionUI } from "./ui/AbsorptionUI";
import { DreamPromptUI } from "./ui/DreamPromptUI";
import { useCanvasManager } from "../stores/useCanvasManager";
import { useGame } from "../game";

interface CanvasGameProps {
  experienceRef: RefObject<ExperienceRef | null>;
  outputVideoRef: RefObject<HTMLVideoElement | null>;
  depthContainerRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  depthFar: number;
}

const DREAM_PROMPT_DELAY = 10000; // 10 segundos después de "Enter the dream"

export function CanvasGame({
  experienceRef,
  outputVideoRef,
  depthContainerRef,
  width,
  height,
  depthFar,
}: CanvasGameProps) {
  const visibleCanvas = useCanvasManager((state) => state.visibleCanvas);
  const isExitBlending = useCanvasManager((state) => state.isExitBlending);
  const hallwayHidden = useCanvasManager((state) => state.hallwayHidden);
  const { sendDreamPrompt } = useGame();
  const [showDreamPrompt, setShowDreamPrompt] = useState(false);

  // Show dream prompt UI 10 seconds after entering the dream
  useEffect(() => {
    if (hallwayHidden && !showDreamPrompt) {
      const timer = setTimeout(() => {
        setShowDreamPrompt(true);
      }, DREAM_PROMPT_DELAY);
      return () => clearTimeout(timer);
    }
  }, [hallwayHidden, showDreamPrompt]);

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
        boxShadow: `
          0 0 60px 20px rgba(180, 180, 190, 0.15),
          0 0 120px 60px rgba(140, 140, 150, 0.1),
          0 0 200px 100px rgba(100, 100, 110, 0.08)
        `,
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
          transition: "opacity 4s ease-in-out",
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
          zIndex: visibleCanvas === "ai-output" || isExitBlending ? 3 : 0,
          opacity: isExitBlending ? 0 : visibleCanvas === "ai-output" ? 1 : 0,
          pointerEvents: "none",
          // 5s transition during exit blend, 4s for normal transitions
          transition: isExitBlending
            ? "opacity 5s ease-in-out"
            : "opacity 4s ease-in-out",
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

      {/* Dream Prompt UI - aparece 10s después de "Enter the dream" */}
      <DreamPromptUI
        visible={showDreamPrompt}
        onSubmit={sendDreamPrompt}
      />
    </div>
  );
}
