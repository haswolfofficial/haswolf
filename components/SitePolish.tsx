"use client";

import { useEffect } from "react";

const DRAGON_COIN_LABEL = "Dragon Coin (DC)";
const DRAGON_COIN_NAV_LABEL = "Dragon Coin";

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

function fixDragonCoinNavigation() {
  document.querySelectorAll<HTMLElement>(".haswolf-main-nav a, .haswolf-main-nav button, .haswolf-bottom-nav a, .haswolf-bottom-nav button").forEach((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node as Text;
      if (text.nodeValue?.includes(DRAGON_COIN_LABEL)) {
        text.nodeValue = text.nodeValue.replaceAll(DRAGON_COIN_LABEL, DRAGON_COIN_NAV_LABEL);
        element.classList.add("haswolf-dragon-nav-label");
      }
      node = walker.nextNode();
    }
  });
}

export default function SitePolish() {
  useEffect(() => {
    normalizeDragonCoinLabels();
    fixDragonCoinNavigation();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node as Text;
            const value = text.nodeValue || "";
            if (/\bDC\b/i.test(value) && !value.includes(DRAGON_COIN_LABEL)) text.nodeValue = value.replace(/\bDC\b/g, DRAGON_COIN_LABEL);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            normalizeDragonCoinLabels(node);
          }
        }
      }
      fixDragonCoinNavigation();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .haswolf-yang-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button { display: none !important; }

      .haswolf-main-nav .haswolf-dragon-nav-label {
        min-width: 0 !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
        font-size: 13px !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
      }

      .haswolf-bottom-nav .haswolf-dragon-nav-label {
        min-width: 66px !important;
        max-width: 78px !important;
        padding: 0 5px !important;
        font-size: 10px !important;
        line-height: 1.05 !important;
        white-space: nowrap !important;
        text-align: center !important;
      }

      /* Professional cursor system: native, crisp and consistent across browsers. */
      @media (pointer: fine) {
        html, body { cursor: default !important; }
        a, button, [role="button"], summary, label, select,
        input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"] {
          cursor: pointer !important;
        }
        input[type="text"], input[type="number"], input[type="email"], input[type="search"], input[type="password"], textarea,
        [contenteditable="true"] {
          cursor: text !important;
        }
        button:disabled, input:disabled, select:disabled, [aria-disabled="true"] {
          cursor: not-allowed !important;
        }
      }
    `}</style>
  );
}
