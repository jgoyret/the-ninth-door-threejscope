import { useState } from "react";
import { useScopeUrl } from "../../stores/useScopeUrl";

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const { setUrl } = useScopeUrl();
  const [inputValue, setInputValue] = useState("");

  const handleStart = () => {
    if (inputValue.trim()) {
      // Remove trailing slash to avoid API errors
      const cleanUrl = inputValue.trim().replace(/\/+$/, "");
      setUrl(cleanUrl);
    }
    onStart();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, #0a0a0a 0%, #2e2e2eff 50%, #0a0a0a 100%)",
        zIndex: 1000,
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(53, 53, 53, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <h1
        style={{
          fontSize: 48,
          fontWeight: 300,
          letterSpacing: 12,
          textTransform: "uppercase",
          color: "white",
          margin: 0,
          marginBottom: 8,
          textShadow: "0 0 40px rgba(255, 255, 255, 0.3)",
        }}
      >
        The Ninth Door
      </h1>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 200,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.6)",
          margin: 0,
          marginBottom: 60,
        }}
      >
        by Juan Goyret
      </h2>

      {/* Start button */}
      <button
        onClick={handleStart}
        style={{
          padding: "16px 48px",
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "white",
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: 4,
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
        }}
      >
        Start
      </button>

      {/* Scope URL input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Scope URL"
        style={{
          marginTop: 24,
          width: 400,
          padding: "12px 16px",
          fontSize: 14,
          color: "white",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 4,
          outline: "none",
          textAlign: "center",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
        }}
      />

      {/* Powered by */}
      <p
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 12,
          letterSpacing: 2,
          color: "rgba(255, 255, 255, 0.3)",
          textTransform: "uppercase",
        }}
      >
        powered by Daydream
      </p>
    </div>
  );
}
