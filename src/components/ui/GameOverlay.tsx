import { useEffect, useRef } from "react";
import { useGameUI, type MessageType } from "../../stores/useGameUI";

const MESSAGE_DURATION = 3000; // ms

const messageStyles: Record<MessageType, React.CSSProperties> = {
  info: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  action: {
    backgroundColor: "rgba(33, 150, 243, 0.85)",
    borderColor: "rgba(33, 150, 243, 0.5)",
  },
  warning: {
    backgroundColor: "rgba(255, 152, 0, 0.85)",
    borderColor: "rgba(255, 152, 0, 0.5)",
  },
};

export function GameOverlay() {
  const message = useGameUI((state) => state.message);
  const clearMessage = useGameUI((state) => state.clearMessage);
  const actionPrompt = useGameUI((state) => state.actionPrompt);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (message) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        clearMessage();
      }, MESSAGE_DURATION);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearMessage]);

  return (
    <>
      {/* Controls hint at bottom */}
      <div
        data-daydream-ui
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
          zIndex: 100,
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

      {/* Messages container */}
      {(message || actionPrompt) && (
        <div
          data-daydream-ui
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
      {/* Action prompt (mientras miras un objeto) */}
      {actionPrompt && (
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
          {actionPrompt}
        </div>
      )}

      {/* Notification message (auto-dismiss) */}
      {message && (
        <div
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "1px solid",
            backdropFilter: "blur(8px)",
            color: "white",
            fontSize: 16,
            fontWeight: 500,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            whiteSpace: "nowrap",
            animation: "fadeIn 0.2s ease-out",
            ...messageStyles[message.type],
          }}
        >
          {message.text}
        </div>
      )}
        </div>
      )}
    </>
  );
}
