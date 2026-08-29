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

function markPurchaseActions() {
  document.querySelectorAll<HTMLElement>("a, button").forEach((element) => {
    const text = (element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (text.includes("satın al") || text.includes("bize sat") || text.includes("markete git")) {
      element.classList.add("haswolf-luxury-purchase-cursor");
    }
  });
}

export default function SitePolish() {
  useEffect(() => {
    normalizeDragonCoinLabels();
    fixDragonCoinNavigation();
    markPurchaseActions();
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
      markPurchaseActions();
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

      /* Default site cursor stays normal and familiar. */
      @media (pointer: fine) {
        html,
        body,
        body * {
          cursor: default !important;
        }

        a,
        button,
        [role="button"],
        input[type="button"],
        input[type="submit"],
        label,
        select {
          cursor: pointer !important;
        }

        input[type="text"],
        input[type="number"],
        input[type="email"],
        input[type="search"],
        textarea {
          cursor: text !important;
        }

        /* Luxury gold cursor is reserved for buying/selling CTAs only. */
        .haswolf-luxury-purchase-cursor,
        .haswolf-luxury-purchase-cursor * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23fff3bf'/%3E%3Cstop offset='.28' stop-color='%23f4c95d'/%3E%3Cstop offset='.62' stop-color='%23a86a0a'/%3E%3Cstop offset='1' stop-color='%23492703'/%3E%3C/linearGradient%3E%3CradialGradient id='j'%3E%3Cstop stop-color='%23fff8d6'/%3E%3Cstop offset='.35' stop-color='%23ffd66b'/%3E%3Cstop offset='.72' stop-color='%23c78008'/%3E%3Cstop offset='1' stop-color='%236d3a00'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cpath d='M2.8 2.4 L23.4 13.1 L17 15.1 L22.6 23.6 L18.8 26.1 L13.2 17.6 L9.2 23.7 Z' fill='%230d0a05' stroke='%23000000' stroke-width='2.4' stroke-linejoin='round'/%3E%3Cpath d='M4.4 4.1 L20.5 12.7 L15.3 14.1 L19.8 21.3 L18.6 22 L13.7 14.5 L10.6 20 Z' fill='url(%23g)' stroke='%23fff0ad' stroke-width='1.15' stroke-linejoin='round'/%3E%3Ccircle cx='16.4' cy='17.7' r='5.8' fill='%23130c03' stroke='%23f4c95d' stroke-width='1.25'/%3E%3Ccircle cx='16.4' cy='17.7' r='3.9' fill='url(%23j)'/%3E%3Ccircle cx='15.2' cy='16.5' r='1.05' fill='%23ffffff' opacity='.9'/%3E%3Cpath d='M23.2 7.7 l3.7 1.6 -2.5 1 2 2.1' fill='none' stroke='%23ffd86e' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 3 3, pointer !important;
        }
      }
    `}</style>
  );
}
