"use client";
import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isDanger, setIsDanger] = useState(false);

  useEffect(() => {
    let ringX = 0;
    let ringY = 0;
    let dotX = 0;
    let dotY = 0;
    let animFrame: number;

    const onMouseMove = (e: MouseEvent) => {
      dotX = e.clientX;
      dotY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.left = `${dotX}px`;
        dotRef.current.style.top = `${dotY}px`;
      }

      // Check if hovering danger element
      const target = e.target as HTMLElement;
      const isDangerElement =
        target.closest("[data-danger]") !== null ||
        target.closest(".badge-danger") !== null ||
        target.closest(".risk-danger") !== null;
      setIsDanger(isDangerElement);
    };

    const animate = () => {
      ringX += (dotX - ringX) * 0.12;
      ringY += (dotY - ringY) * 0.12;

      if (ringRef.current) {
        ringRef.current.style.left = `${ringX}px`;
        ringRef.current.style.top = `${ringY}px`;
      }

      animFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className={`cursor-dot ${isDanger ? "danger" : ""}`} />
      <div ref={ringRef} className={`cursor-ring ${isDanger ? "danger" : ""}`} />
    </>
  );
}
