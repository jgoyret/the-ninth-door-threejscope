import { useRef, useState, useEffect, useCallback } from "react";
import { type ExperienceRef } from "./components/Experience";
import { useScopeConnection } from "./hooks/useScopeConnection";
import { GameProvider } from "./game";
import { useDebugGUI, type DebugParams } from "./hooks/useDebugGUI";
import { useGameState } from "./stores/useGameState";
import { useCanvasManager } from "./stores/useCanvasManager";
import { TitleScreen } from "./components/ui/TitleScreen";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { CanvasGame } from "./components/CanvasGame";
import { getDoorByNumber } from "./game/doorPrompts";
import { Analytics } from "@vercel/analytics/react";

// Render resolution (Daydream will downscale as needed)
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 704;

// Debug mode: true = OrbitControls only, false = normal game
const DEBUG_MODE = false;

function App() {
  const experienceRef = useRef<ExperienceRef>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const depthContainerRef = useRef<HTMLDivElement>(null);
  const [prompt] = useState(
    "A magical forest. Elder creatures are guideing you."
  );
  const [depthFar, setDepthFar] = useState(30);
  const [vaceScale, setVaceScale] = useState(0.45);

  // Game state
  const phase = useGameState((state) => state.phase);
  const startGame = useGameState((state) => state.startGame);
  const onStreamReady = useGameState((state) => state.onStreamReady);
  const resetGame = useGameState((state) => state.reset);

  // Canvas manager
  const streamSource = useCanvasManager((state) => state.streamSource);
  const isPostNinthDoor = useCanvasManager((state) => state.isPostNinthDoor);

  // Debug GUI - streamSource is now controlled by canvas manager, not debug
  const handleDebugChange = useCallback((params: DebugParams) => {
    setDepthFar(params.depthFar);
    setVaceScale(params.vaceScale);
  }, []);

  useDebugGUI({
    enabled: DEBUG_MODE,
    initialValues: { depthFar, streamSource, vaceScale },
    onChange: handleDebugChange,
  });

  const {
    status,
    error,
    isConnected,
    connect,
    disconnect,
    updatePrompt,
    updateVaceRefImages,
    updateVaceScale,
    replaceVideoTrack,
  } = useScopeConnection({
    onTrack: (stream) => {
      if (outputVideoRef.current) {
        outputVideoRef.current.srcObject = stream;
      }
    },
  });

  // Transition to playing when connected
  useEffect(() => {
    if (status === "connected" && phase === "loading") {
      onStreamReady();
    }
  }, [status, phase, onStreamReady]);

  // Replace video track when streamSource changes (after door 9)
  useEffect(() => {
    if (isConnected && experienceRef.current) {
      const newStream = experienceRef.current.getStream(30, streamSource);
      if (newStream) {
        replaceVideoTrack(newStream);
      }
    }
  }, [streamSource, isConnected, replaceVideoTrack]);

  // Update VACE settings when entering post-ninth-door state
  // Send the same prompt as door 9 with vaceScale 1
  useEffect(() => {
    if (isPostNinthDoor && isConnected) {
      const door9Config = getDoorByNumber(9);
      if (door9Config?.prompt) {
        console.log(
          "🚪 Post 9th door: Sending door 9 prompt with VACE scale 1"
        );
        updatePrompt(door9Config.prompt, { vaceScale: 0.7 });
      }
    }
  }, [isPostNinthDoor, isConnected, updatePrompt]);

  async function handleStart() {
    // Start loading phase
    startGame();

    // Get stream and connect
    const stream = experienceRef.current?.getStream(30, streamSource);
    if (!stream) {
      console.error("Could not get canvas stream");
      return;
    }

    await connect(stream, {
      prompts: [{ text: prompt, weight: 100 }],
      vace_context_scale: vaceScale,
    });
  }

  function handleBackToTitle() {
    disconnect();
    resetGame();
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundColor: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      <Analytics />
      {/* Title Screen - skip in debug mode */}
      {!DEBUG_MODE && phase === "title" && (
        <TitleScreen onStart={handleStart} />
      )}

      {/* Loading Screen - skip in debug mode */}
      {!DEBUG_MODE && phase === "loading" && (
        <LoadingScreen
          status={status}
          error={error}
          onBack={handleBackToTitle}
        />
      )}

      {/* Game - always renders but hidden during title/loading (always visible in debug mode) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          visibility: DEBUG_MODE || phase === "playing" ? "visible" : "hidden",
        }}
      >
        <GameProvider
          updatePrompt={updatePrompt}
          updateVaceRefImages={updateVaceRefImages}
          updateVaceScale={updateVaceScale}
          isConnected={isConnected}
          debugMode={DEBUG_MODE}
          vaceScale={vaceScale}
        >
          <CanvasGame
            experienceRef={experienceRef}
            outputVideoRef={outputVideoRef}
            depthContainerRef={depthContainerRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            depthFar={depthFar}
          />
        </GameProvider>
      </div>

      {/* Controls hint - fixed to bottom of screen */}
      {(DEBUG_MODE || phase === "playing") && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 200,
            fontSize: 11,
            letterSpacing: 1,
            color: "rgba(255, 255, 255, 0.35)",
            textTransform: "uppercase",
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          WASD to move • Mouse to look • E to interact
        </div>
      )}
    </div>
  );
}

export default App;
