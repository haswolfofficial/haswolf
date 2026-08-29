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
      .haswolf-main-nav .haswolf-dragon-nav-label { min-width:0!important; padding-left:10px!important; padding-right:10px!important; font-size:13px!important; letter-spacing:0!important; white-space:nowrap!important; overflow:hidden!important; }
      .haswolf-bottom-nav .haswolf-dragon-nav-label { min-width:66px!important; max-width:78px!important; padding:0 5px!important; font-size:10px!important; line-height:1.05!important; white-space:nowrap!important; text-align:center!important; }
      @media (pointer: fine) {
        html, body, body *, a, button, [role="button"], input, textarea, select, label {
          cursor: url('data:image/x-icon;base64,AAACAAEAICAAAAAAAACoCAAAFgAAACgAAAAgAAAAQAAAAAEACAAAAAAAAAQAAAAAAAAAAAAAAAEAAAAAAAAAAAAA6+vrAD4+AAD///8AfHwAAPj4+AB4eHgAhYWFAKSgoACSkpIAn5+fABISEgAfHx8AwMDAACwsLAA5OTkAXV0AAKurqwCbmwAAuLi4AAkJCQDFxcUARUVFANLS0gBSUlIAX19fAICAAABsbGwAgICAAN7e3gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgYWFBQUFBQUFBQUFBQAAAAAAAAAAAAAAAAAAAAAAAAWBhYPDAsPDxsbGxsPDxQUAAAAAAAAAAAAAAAAAAAAABgGFhwPDxsCEBAQEBsbDxQUAAAAAAAAAAAAAAAAAAAAGBgWGw8CEBoaGhoEEAITDxQUAAAAAAAAAAAAAAAAABkYGA8MEAQaEhISEhISBBATDxQUAAAAAAAAAAAAAAAAGRwWDBAQGhoSEhISEgcJEhATDxQAAAAAAAAAAAAAAAAbBg8QEAQaGhAUABQEEgkHGgIbDxQAAAAAAAAAAAAAABsYDBAQBAQCFBQUCw8ZEhISEBsPFAAAAAAAAAAAAAAHBhYLEBAQEAsUFBQODw4EEhIEGw8UAAAAAAAAAAAAAAkcDxAQEBAMDBQUCw4MCwsSEhoCGxQAAAAAAAAAAAAACAYMEBAEEA4PCxQMCxQUABISGgIbFAAAAAAAAAAAAAARGwwQEAQEGRkOCxQUFBQUEhIaAhsUAAAAAAAAAAAACgoGDhQQEAcRExsMCxQUFBAaEgQbDxQAAAAAAAAAAAAKHBsYFBAEDQMDDRkWDgsCGhoaEA8PFAAAAAAAAAAACgoGGxsMEBATBQMVGA4MEAQEBBACDwsUAAAAAAAAAAAKHBsJGw8UEAQICAcEBBAQEBAQAg4PDBQAAAAAAAAAAAgGFgMbGQ4UEBAaGxsEBBAQEBAMGxwPFAAAAAAAAAATERsPCxMbGA4UEBAQEBAQEBAQDA8WFhYWAAAAAAAAAA0cFgsLGxMbGA4UFBAQEBAQCw4WGBgGBgYAAAAAAAAXFRsWGRkJGxMbGBYODAwPDxYYBhwWFg8PDwAAAAAAABccGBsLAxkLCwMJGxsZGwYcBhsZGBgAAAAAAAAAAAAXFxsWGwsLGQsPFhsGHAkJCAkHAAAAAAAAAAAAAAAAABccFgsJGxsWFhsGHAoKCQAAAAAAAAAAAAAAAAAAAAAdFxsPFAsWGBscEREICAAAAAAAAAAAAAAAAAAAAAAAAAEcFgsPFhscDQ0TAAAAAAAAAAAAAAAAAAAAAAAAAAADAwYJFhscFRUVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMcGAYcHR0dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAxwcAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/wAD//8AAP//AAB//wAAP/4AAB/+AAAf/gAAD/4AAA/8AAAP/AAAD/wAAA/8AAAP+AAAD/gAAA/wAAAP8AAAD/AAAA/gAAAP4AAAD8AAAA/AAAD/gAAP/4AA//8AA///AB///gB///4B///8B////B////h////5////9/////'), auto !important;
        }
      }
    `}</style>
  );
}
