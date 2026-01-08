import { useEffect, useRef } from "react";
import { useGameUI } from "../../stores/useGameUI";

const MESSAGE_DURATION = 3000; // ms

export function GameOverlay() {
  const message = useGameUI((state) => state.message);
  const clearMessage = useGameUI((state) => state.clearMessage);
  const actionPrompt = useGameUI((state) => state.actionPrompt);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // No auto-dismiss si es persistente
    if (message && !message.persistent) {
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
      {/* Action prompt - Tipo 1: raycast (abajo, cerca del crosshair) */}
      {actionPrompt && (
        <div
          data-daydream-ui
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 100,
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

      {/* Notification message - Tipo 2: eventos (abajo, blur sin caja) */}
      {message && (
        <div
          data-daydream-ui
          style={{
            position: "absolute",
            bottom: actionPrompt ? 110 : 60,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 99,
            padding: "10px 20px",
            borderRadius: 8,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "rgba(255, 255, 255, 0.95)",
            fontSize: 16,
            fontWeight: 500,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            whiteSpace: "nowrap",
            animation: "fadeIn 0.3s ease-out",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
          }}
        >
          {message.text}
        </div>
      )}
    </>
  );
}
