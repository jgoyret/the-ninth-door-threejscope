const STATUS_LABELS: Record<string, string> = {
  idle: "Initializing...",
  "checking-model": "Checking model...",
  "loading-pipeline": "Loading pipeline...",
  "waiting-pipeline": "Waiting for pipeline...",
  "getting-stream": "Getting stream...",
  connecting: "Connecting...",
  connected: "Connected!",
  error: "Connection error",
};

interface LoadingScreenProps {
  status: string;
  error?: string | null;
  onBack?: () => void;
}

function getErrorMessage(error: string): string {
  // Detectar errores comunes de servidor no disponible
  if (
    error.includes("404") ||
    error.includes("Failed to fetch") ||
    error.includes("NetworkError") ||
    error.includes("ECONNREFUSED") ||
    error.includes("fetch")
  ) {
    return "Server is offline";
  }
  if (error.includes("Model not downloaded")) {
    return "Model not ready";
  }
  return error;
}

export function LoadingScreen({ status, error, onBack }: LoadingScreenProps) {
  const hasError = !!error || status === "error";
  const errorMessage = error ? getErrorMessage(error) : "Connection failed";
  const statusText = hasError ? errorMessage : STATUS_LABELS[status] || status;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        zIndex: 1000,
      }}
    >
      {/* Spinner or Error Icon */}
      {hasError ? (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "2px solid #f44336",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            fontSize: 24,
            color: "#f44336",
          }}
        >
          !
        </div>
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: 24,
          }}
        />
      )}

      {/* Status text */}
      <p
        style={{
          fontSize: 14,
          letterSpacing: 2,
          color: hasError ? "#f44336" : "rgba(255, 255, 255, 0.6)",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: hasError ? 8 : 0,
        }}
      >
        {statusText}
      </p>

      {/* Error description */}
      {hasError && (
        <p
          style={{
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.4)",
            margin: 0,
            marginBottom: 32,
          }}
        >
          The Scope server is not running or unavailable
        </p>
      )}

      {/* Back button when error */}
      {hasError && onBack && (
        <button
          onClick={onBack}
          style={{
            padding: "12px 32px",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 2,
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
          Back
        </button>
      )}

      {/* CSS animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
