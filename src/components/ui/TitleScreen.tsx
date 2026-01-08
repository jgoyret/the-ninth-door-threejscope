interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
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
          "linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
        zIndex: 1000,
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(100, 100, 255, 0.15) 0%, transparent 70%)",
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
        onClick={onStart}
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
