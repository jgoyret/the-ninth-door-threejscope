import { useState, useRef, useEffect } from "react";

interface DreamPromptUIProps {
  onSubmit: (prompt: string) => void;
  visible: boolean;
}

/**
 * UI para que el usuario escriba prompts durante el sueño.
 * Aparece en la parte inferior de la pantalla.
 */
export function DreamPromptUI({ onSubmit, visible }: DreamPromptUIProps) {
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
      // Release pointer lock so user can type
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }, [isExpanded]);

  if (!visible) return null;

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue("");
      setIsExpanded(false);
      // Re-request pointer lock after submit
      document.body.requestPointerLock();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
      setInputValue("");
      document.body.requestPointerLock();
    }
    // Stop propagation to prevent game controls
    e.stopPropagation();
  };

  return (
    <div
      data-daydream-ui
      style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        pointerEvents: "auto",
      }}
    >
      {!isExpanded ? (
        // Collapsed state - just a button
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 1,
            color: "rgba(255, 255, 255, 0.8)",
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 8,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
        >
          Guide the dream...
        </button>
      ) : (
        // Expanded state - input and submit
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: 16,
            background: "rgba(0, 0, 0, 0.7)",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.6)",
              letterSpacing: 1,
            }}
          >
            Where should the dream go?
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the dream..."
              style={{
                width: 280,
                padding: "10px 14px",
                fontSize: 14,
                color: "white",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 6,
                outline: "none",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: inputValue.trim() ? "white" : "rgba(255, 255, 255, 0.4)",
                background: inputValue.trim()
                  ? "rgba(138, 43, 226, 0.6)"
                  : "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: 6,
                cursor: inputValue.trim() ? "pointer" : "default",
                transition: "all 0.2s ease",
              }}
            >
              Go
            </button>
          </div>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            Press Enter to send, Escape to cancel
          </span>
        </div>
      )}
    </div>
  );
}

export default DreamPromptUI;
