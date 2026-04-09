"use client";

import React, { useState, useEffect, useRef } from "react";

export function InfiniteScrollList({
  children,
  chunkSize = 10,
}: {
  children: React.ReactNode;
  chunkSize?: number;
}) {
  const items = React.Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(chunkSize);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(chunkSize);
  }, [items.length, chunkSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + chunkSize, items.length));
        }
      },
      { threshold: 1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [items.length, chunkSize]);

  return (
    <>
      {items.slice(0, visibleCount)}
      {visibleCount < items.length && (
        <div ref={observerTarget} className="py-4 flex justify-center">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
        </div>
      )}
    </>
  );
}
