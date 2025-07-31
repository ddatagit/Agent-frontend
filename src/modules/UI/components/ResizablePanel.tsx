"use client";

import { useRef, useState, useEffect } from "react";

export const ResizablePanel = ({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(400); // default 400px
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newLeftWidth = e.clientX - containerLeft;
      setLeftWidth(Math.max(200, Math.min(newLeftWidth, 800))); // min 200px, max 800px
    };

    const stopResizing = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  return (
    <div ref={containerRef} className="flex w-full h-full relative overflow-hidden">
      <div
        className="h-full overflow-y-auto border-r"
        style={{ width: leftWidth }}
      >
        {left}
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="w-1 bg-border hover:bg-primary cursor-col-resize transition"
      />

      <div className="flex-1 h-full overflow-y-auto">{right}</div>
    </div>
  );
};
