import { useRef, useState } from "react";
import { Experience, type ExperienceRef } from "./components/Experience";
import { useScopeConnection } from "./hooks/useScopeConnection";

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
  const [prompt, setPrompt] = useState(
    "A 3D animated scene. A **panda** sitting in the grass, looking around."
  );

  const { status, error, isConnected, connect, disconnect } =
    useScopeConnection({
      onTrack: (stream) => {
        if (outputVideoRef.current) {
          outputVideoRef.current.srcObject = stream;
        }
      },
    });

  async function handleStart() {
    const stream = experienceRef.current?.getStream(30);
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

  const statusText = error ? `Error: ${error}` : STATUS_LABELS[status] || status;

  return (
    <div style={{ padding: 20, color: "white", fontFamily: "system-ui" }}>
      <h1>Scope WebRTC Client</h1>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Prompt:</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isConnected}
          style={{
            width: "100%",
            maxWidth: 600,
            height: 80,
            padding: 10,
            fontSize: 14,
            borderRadius: 4,
            border: "none",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        {!isConnected ? (
          <button
            onClick={handleStart}
            disabled={status !== "idle" && status !== "error"}
            style={{
              padding: "12px 24px",
              fontSize: 16,
              backgroundColor:
                status === "idle" || status === "error" ? "#4CAF50" : "#666",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor:
                status === "idle" || status === "error"
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            Start Session
          </button>
        ) : (
          <button
            onClick={handleStop}
            style={{
              padding: "12px 24px",
              fontSize: 16,
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Stop Session
          </button>
        )}
        <span style={{ marginLeft: 16 }}>{statusText}</span>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div>
          <h3>Input (Three.js)</h3>
          <Experience ref={experienceRef} width={512} height={512} />
        </div>
        <div>
          <h3>Output (Processed)</h3>
          <video
            ref={outputVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 512, height: 512, backgroundColor: "#333" }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
