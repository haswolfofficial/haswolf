"use client";

import { useEffect, useRef } from "react";

const DRAGON_COIN_LABEL = "Dragon Coin (DC)";

function normalizeDragonCoinLabels(root: Node = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();

  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of nodes) {
    const parent = node.parentElement;
    const value = node.nodeValue;
    if (!parent || !value) continue;
    if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) continue;
    if (!/\bDC\b/i.test(value)) continue;
    if (value.includes(DRAGON_COIN_LABEL)) continue;
    node.nodeValue = value.replace(/\bDC\b/g, DRAGON_COIN_LABEL);
  }
}

export default function SitePolish() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef({ x: -100, y: -100 });
  const pressedRef = useRef(false);

  useEffect(() => {
    normalizeDragonCoinLabels();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node as Text;
            const value = text.nodeValue || "";
            if (/\bDC\b/i.test(value) && !value.includes(DRAGON_COIN_LABEL)) {
              text.nodeValue = value.replace(/\bDC\b/g, DRAGON_COIN_LABEL);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            normalizeDragonCoinLabels(node);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    document.documentElement.classList.add("haswolf-neon-cursor-enabled");

    const paint = () => {
      frameRef.current = null;
      const cursor = cursorRef.current;
      if (!cursor) return;
      const { x, y } = positionRef.current;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(-10deg) scale(${pressedRef.current ? 0.86 : 1})`;
    };

    const requestPaint = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(paint);
    };

    const move = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX - 4, y: event.clientY - 2 };
      requestPaint();
      if (cursorRef.current) cursorRef.current.dataset.visible = "true";
    };

    const leave = () => {
      if (cursorRef.current) cursorRef.current.dataset.visible = "false";
    };

    const down = () => {
      pressedRef.current = true;
      requestPaint();
    };

    const up = () => {
      pressedRef.current = false;
      requestPaint();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      document.documentElement.classList.remove("haswolf-neon-cursor-enabled");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="haswolf-neon-cursor" aria-hidden="true" data-visible="false">
        <svg viewBox="0 0 32 38" role="presentation">
          <path d="M4 2.5 27 22l-10.2 1.4 5.7 9.3-5.1 2.8-5.5-9.4L5 33.4 4 2.5Z" fill="#11051c" stroke="#d974ff" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M7.5 7.5 22 20l-8.2 1.1 4.3 7-1.9 1.1-4.2-7.1-5.1 5.4.6-20Z" fill="#7c3cff" opacity=".42" />
        </svg>
      </div>
      <style jsx global>{`
        @media (pointer: fine) {
          html.haswolf-neon-cursor-enabled,
          html.haswolf-neon-cursor-enabled body,
          html.haswolf-neon-cursor-enabled body * {
            cursor: none !important;
          }

          .haswolf-neon-cursor {
            position: fixed;
            left: 0;
            top: 0;
            width: 30px;
            height: 36px;
            z-index: 2147483647;
            pointer-events: none;
            opacity: 0;
            transition: opacity .14s ease, filter .14s ease;
            filter: drop-shadow(0 0 4px rgba(217,116,255,.95)) drop-shadow(0 0 12px rgba(124,60,255,.8)) drop-shadow(0 0 24px rgba(124,60,255,.42));
            will-change: transform;
          }

          .haswolf-neon-cursor[data-visible="true"] { opacity: 1; }
          .haswolf-neon-cursor svg { display: block; width: 100%; height: 100%; overflow: visible; }
        }

        @media (pointer: coarse), (prefers-reduced-motion: reduce) {
          .haswolf-neon-cursor { display: none !important; }
        }

        .haswolf-yang-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button {
          display: none !important;
        }
      `}</style>
    </>
  );
}
