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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") optionsRef.current.onArrowLeft?.();
      else if (e.key === "ArrowRight") optionsRef.current.onArrowRight?.();
      else if (e.key === "ArrowUp") optionsRef.current.onArrowUp?.();
      else if (e.key === "ArrowDown") optionsRef.current.onArrowDown?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
