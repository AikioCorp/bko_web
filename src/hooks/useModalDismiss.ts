import { useEffect } from "react";

/**
 * Enables Escape-key dismissal and pointer-down backdrop dismissal
 * (triggers only when pressing directly on the backdrop, never on drag-out).
 */
export function useEscapeDismiss(isOpen: boolean, onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!isOpen || !enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, enabled]);
}

export function backdropPointerDown(onClose: () => void, enabled = true) {
  return (e: React.PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
}
