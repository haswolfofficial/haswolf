"use client";

import { useEffect } from "react";

const STORAGE_PREFIX = "haswolf-chat-scroll:";
const BOTTOM_THRESHOLD = 120;

type SavedScroll = {
  top: number;
  atBottom: boolean;
};

function getChatScroller() {
  return Array.from(document.querySelectorAll<HTMLElement>("div")).find(
    (element) =>
      element.classList.contains("overflow-y-auto") &&
      element.classList.contains("flex-1") &&
      element.closest("main") !== null &&
      element.querySelector("textarea") === null
  ) ?? null;
}

function getCurrentRoomKey() {
  const roomButton = document.querySelector<HTMLElement>(
    "main header button[aria-expanded]"
  );
  const roomText = roomButton?.textContent?.replace(/\s+/g, " ").trim();
  return roomText ? `${STORAGE_PREFIX}${roomText}` : `${STORAGE_PREFIX}default`;
}

function readSavedScroll(key: string): SavedScroll | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedScroll;
    if (typeof parsed.top !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveScroll(scroller: HTMLElement, key: string) {
  const distanceFromBottom =
    scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
  const payload: SavedScroll = {
    top: scroller.scrollTop,
    atBottom: distanceFromBottom <= BOTTOM_THRESHOLD,
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

export default function ChatScrollMemory() {
  useEffect(() => {
    let scroller: HTMLElement | null = null;
    let currentKey = getCurrentRoomKey();
    let restoreUntil = Date.now() + 1800;
    let restoreTimer: number | undefined;
    let lastKnownTop = 0;
    let lastKnownAtBottom = true;

    const originalScrollIntoView = Element.prototype.scrollIntoView;

    function restorePosition(force = false) {
      if (!scroller) return;
      if (!force && Date.now() > restoreUntil) return;

      const saved = readSavedScroll(currentKey);
      if (!saved) {
        scroller.scrollTop = scroller.scrollHeight;
        lastKnownTop = scroller.scrollTop;
        lastKnownAtBottom = true;
        return;
      }

      if (saved.atBottom) {
        scroller.scrollTop = scroller.scrollHeight;
      } else {
        scroller.scrollTop = Math.min(saved.top, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
      }

      lastKnownTop = scroller.scrollTop;
      lastKnownAtBottom = saved.atBottom;
    }

    function attachScroller() {
      const next = getChatScroller();
      if (!next || next === scroller) return;

      if (scroller) {
        saveScroll(scroller, currentKey);
      }

      scroller = next;
      currentKey = getCurrentRoomKey();
      restoreUntil = Date.now() + 1800;

      const onScroll = () => {
        if (!scroller) return;
        const distanceFromBottom =
          scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        lastKnownTop = scroller.scrollTop;
        lastKnownAtBottom = distanceFromBottom <= BOTTOM_THRESHOLD;
        saveScroll(scroller, currentKey);
      };

      scroller.addEventListener("scroll", onScroll, { passive: true });
      (scroller as HTMLElement & { __haswolfScrollCleanup?: () => void }).__haswolfScrollCleanup = () => {
        scroller?.removeEventListener("scroll", onScroll);
      };

      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(() => restorePosition(true), 80);
    }

    Element.prototype.scrollIntoView = function scrollIntoViewPatched(
      arg?: boolean | ScrollIntoViewOptions
    ) {
      const activeScroller = getChatScroller();
      if (
        activeScroller &&
        activeScroller.contains(this) &&
        !lastKnownAtBottom &&
        Date.now() > restoreUntil
      ) {
        return;
      }
      return originalScrollIntoView.call(this, arg as boolean | ScrollIntoViewOptions);
    };

    attachScroller();

    const observer = new MutationObserver(() => {
      const nextKey = getCurrentRoomKey();
      if (nextKey !== currentKey) {
        if (scroller) saveScroll(scroller, currentKey);
        currentKey = nextKey;
        restoreUntil = Date.now() + 1800;
        lastKnownAtBottom = readSavedScroll(currentKey)?.atBottom ?? true;
      }

      attachScroller();

      if (scroller && Date.now() <= restoreUntil) {
        window.clearTimeout(restoreTimer);
        restoreTimer = window.setTimeout(() => restorePosition(), 60);
      } else if (scroller && lastKnownAtBottom) {
        scroller.scrollTop = scroller.scrollHeight;
      } else if (scroller && !lastKnownAtBottom) {
        scroller.scrollTop = Math.min(lastKnownTop, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const handlePageHide = () => {
      if (scroller) saveScroll(scroller, currentKey);
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      observer.disconnect();
      window.clearTimeout(restoreTimer);
      window.removeEventListener("pagehide", handlePageHide);
      if (scroller) {
        saveScroll(scroller, currentKey);
        (scroller as HTMLElement & { __haswolfScrollCleanup?: () => void }).__haswolfScrollCleanup?.();
      }
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  }, []);

  return null;
}
