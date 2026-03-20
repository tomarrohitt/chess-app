import { useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let lastExecution = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastExecution < 50) return;

      let handled = false;
      if (e.key === "ArrowLeft" && optionsRef.current.onArrowLeft) {
        optionsRef.current.onArrowLeft();
        handled = true;
      } else if (e.key === "ArrowRight" && optionsRef.current.onArrowRight) {
        optionsRef.current.onArrowRight();
        handled = true;
      } else if (e.key === "ArrowUp" && optionsRef.current.onArrowUp) {
        optionsRef.current.onArrowUp();
        handled = true;
      } else if (e.key === "ArrowDown" && optionsRef.current.onArrowDown) {
        optionsRef.current.onArrowDown();
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        lastExecution = now;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
