import { useEffect, useRef } from "react";

interface KeyboardNavigationOptions {
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export function useKeyboardNavigation(callbacks: KeyboardNavigationOptions) {
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") callbacksRef.current.onArrowLeft?.();
      if (e.key === "ArrowRight") callbacksRef.current.onArrowRight?.();
      if (e.key === "ArrowUp") callbacksRef.current.onArrowUp?.();
      if (e.key === "ArrowDown") callbacksRef.current.onArrowDown?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
