import { useState, useRef, useEffect } from "react";

interface DreamPromptUIProps {
  onSubmit: (prompt: string, vaceScale: number) => void;
  visible: boolean;
}

/**
 * UI para que el usuario escriba prompts durante el sueño.
 * Aparece en la parte inferior de la pantalla.
 * Press E to expand, then type and press Enter to submit.
 */
const DEFAULT_VACE_SCALE = 0.6;

export function DreamPromptUI({ onSubmit, visible }: DreamPromptUIProps) {
  const [inputValue, setInputValue] = useState("");
  const [vaceScale, setVaceScale] = useState(DEFAULT_VACE_SCALE);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for E key to expand (when visible but not expanded)
  useEffect(() => {
    if (!visible || isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        setIsExpanded(true);
        // Release pointer lock so user can type
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  if (!visible) return null;

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim(), vaceScale);
      setInputValue("");
      setVaceScale(DEFAULT_VACE_SCALE);
      setIsExpanded(false);
      // Re-request pointer lock after submit
      document.body.requestPointerLock();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
      setInputValue("");
      setVaceScale(DEFAULT_VACE_SCALE);
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
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        pointerEvents: "auto",
        zIndex: 150,
      }}
    >
      {!isExpanded ? (
        // Collapsed state - prompt text (like other game prompts)
        <div
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(8px)",
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Press E to guide the dream
        </div>
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
              onKeyDown={handleInputKeyDown}
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
          {/* VACE Scale slider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              paddingTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "rgba(255, 255, 255, 0.5)",
                whiteSpace: "nowrap",
              }}
            >
              Vace Scale
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vaceScale}
              onChange={(e) => setVaceScale(parseFloat(e.target.value))}
              style={{
                flex: 1,
                height: 4,
                cursor: "pointer",
                accentColor: "rgba(138, 43, 226, 0.8)",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "rgba(255, 255, 255, 0.5)",
                minWidth: 28,
                textAlign: "right",
              }}
            >
              {vaceScale.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DreamPromptUI;
