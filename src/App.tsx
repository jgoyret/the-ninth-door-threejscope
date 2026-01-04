import { useRef, useState, useEffect, useCallback } from "react";
import {
  Experience,
  type ExperienceRef,
  type StreamSource,
} from "./components/Experience";
import { useScopeConnection } from "./hooks/useScopeConnection";
import { GameProvider } from "./game";
import { useDebugGUI, type DebugParams } from "./hooks/useDebugGUI";

const STATUS_LABELS: Record<string, string> = {
  idle: "Ready",
  "checking-model": "Checking model...",
  "loading-pipeline": "Loading pipeline...",
  "waiting-pipeline": "Waiting for pipeline...",
  "getting-stream": "Getting stream...",
  connecting: "Connecting...",
  connected: "Connected!",
  error: "Error",
};

function App() {
  const experienceRef = useRef<ExperienceRef>(null);
  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const depthContainerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState(
    "A magical forest. Elder creatures are guideing you."
  );
  const [depthFar, setDepthFar] = useState(30);
  const [streamSource, setStreamSource] = useState<StreamSource>("threejs");
  const [vaceScale, setVaceScale] = useState(0.5);

  const handleDebugChange = useCallback((params: DebugParams) => {
    setDepthFar(params.depthFar);
    setStreamSource(params.streamSource);
    setVaceScale(params.vaceScale);
  }, []);

  useDebugGUI({
    initialValues: { depthFar, streamSource, vaceScale },
    onChange: handleDebugChange,
  });

  // Mount depth canvas when ready
  useEffect(() => {
    const interval = setInterval(() => {
      const depthCanvas = experienceRef.current?.getDepthCanvas();
      if (depthCanvas && depthContainerRef.current) {
        if (!depthContainerRef.current.contains(depthCanvas)) {
          depthContainerRef.current.appendChild(depthCanvas);
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const { status, error, isConnected, connect, disconnect, updatePrompt } =
    useScopeConnection({
      onTrack: (stream) => {
        if (outputVideoRef.current) {
          outputVideoRef.current.srcObject = stream;
        }
      },
    });

  async function handleStart() {
    const stream = experienceRef.current?.getStream(30, streamSource);
    if (!stream) {
      console.error("Could not get canvas stream");
      return;
    }

    await connect(stream, {
      prompts: [{ text: prompt, weight: 100 }],
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

  const statusText = error
    ? `Error: ${error}`
    : STATUS_LABELS[status] || status;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "white",
        fontFamily: "system-ui",
        backgroundColor: "#0a0a0a",
        overflow: "auto",
      }}
    >
      {/* Video panels */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: 20,
          alignItems: "center",
        }}
      >
        <div className="flex-gap" style={{ display: "flex", gap: 20 }}>
          <div>
            <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>
              Input (Three.js)
            </h3>
            <GameProvider updatePrompt={updatePrompt} isConnected={isConnected}>
              <Experience
                ref={experienceRef}
                width={640}
                height={352}
                depthFar={depthFar}
              />
            </GameProvider>
          </div>
          <div>
            <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>
              Depth Map
            </h3>
            <div
              ref={depthContainerRef}
              style={{ width: 640, height: 352, backgroundColor: "#333" }}
            />
          </div>
        </div>
        <div>
          <h3 style={{ margin: "0 0 10px 0", textAlign: "center" }}>
            Output (Processed)
          </h3>
          <video
            ref={outputVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 640, height: 352, backgroundColor: "#333" }}
          />
        </div>
      </div>

      {/* Bottom control bar */}
      <div
        style={{
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
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {isConnected ? "Streaming" : "Not streaming"}
          </span>
        </div>

        {/* Prompt input */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
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
        {!isConnected ? (
          <button
            onClick={handleStart}
            disabled={status !== "idle" && status !== "error"}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              backgroundColor:
                status === "idle" || status === "error"
                  ? "#4CAF50"
                  : "rgba(76, 175, 80, 0.3)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor:
                status === "idle" || status === "error"
                  ? "pointer"
                  : "not-allowed",
              minWidth: 120,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {status === "idle" || status === "error"
              ? "Start Stream"
              : statusText}
          </button>
        ) : (
          <>
            <button
              onClick={handleUpdatePrompt}
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
    </div>
  );
}

export default App;
