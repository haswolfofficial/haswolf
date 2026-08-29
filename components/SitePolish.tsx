"use client";

import { useEffect } from "react";

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

  return (
    <style jsx global>{`
      .haswolf-yang-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button {
        display: none !important;
      }
    `}</style>
  );
}
