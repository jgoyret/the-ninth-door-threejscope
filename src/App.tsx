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
import { DOOR_PROMPTS } from "./game/doorPrompts";

const GAME_WIDTH = 640;
const GAME_HEIGHT = 352;

// Debug mode: true = OrbitControls only, false = normal game
const DEBUG_MODE = true;

function App() {
  const experienceRef = useRef<ExperienceRef>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const depthContainerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState(
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
  // Send the same prompt as door 9 (index 8) with vaceScale 1
  useEffect(() => {
    if (isPostNinthDoor && isConnected) {
      const door9Prompt = DOOR_PROMPTS[8]; // Door 9 = index 8
      console.log("🚪 Post 9th door: Sending door 9 prompt with VACE scale 1");
      updatePrompt(door9Prompt, { vaceScale: 1 });
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

  function handleStop() {
    disconnect();
    if (outputVideoRef.current) {
      outputVideoRef.current.srcObject = null;
    }
  }

  function handleUpdatePrompt() {
    updatePrompt(prompt, { vaceScale });
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          visibility: DEBUG_MODE || phase === "playing" ? "visible" : "hidden",
        }}
      >
        <GameProvider
          updatePrompt={updatePrompt}
          isConnected={isConnected}
          debugMode={DEBUG_MODE}
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

        {/* Control bar - only visible when playing, hidden in debug mode */}
        {!DEBUG_MODE && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(20, 20, 20, 0.95)",
              borderTop: "2px solid rgba(255, 255, 255, 0.1)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Status indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 140,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "#4CAF50" : "#666",
                  boxShadow: isConnected
                    ? "0 0 10px rgba(76, 175, 80, 0.8)"
                    : "none",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>
                {isConnected ? "Streaming" : "Not streaming"}
              </span>
            </div>

            {/* Prompt input */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              data-daydream-ui
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 14,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 6,
                color: "white",
                outline: "none",
              }}
            />

            {/* Action buttons */}
            {isConnected && (
              <>
                <button
                  onClick={handleUpdatePrompt}
                  data-daydream-ui
                  style={{
                    padding: "10px 24px",
                    fontSize: 14,
                    fontWeight: 600,
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    minWidth: 100,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Update
                </button>
                <button
                  onClick={handleStop}
                  data-daydream-ui
                  style={{
                    padding: "10px 24px",
                    fontSize: 14,
                    fontWeight: 600,
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    minWidth: 100,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Stop
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
