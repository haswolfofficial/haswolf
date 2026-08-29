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

function markDragonCoinNavigation() {
  const candidates = document.querySelectorAll<HTMLElement>("a, button");
  candidates.forEach((element) => {
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (text.includes(DRAGON_COIN_LABEL)) {
      element.classList.add("haswolf-dragon-nav-label");
    }
  });
}

export default function SitePolish() {
  useEffect(() => {
    normalizeDragonCoinLabels();
    markDragonCoinNavigation();

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
      markDragonCoinNavigation();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .haswolf-yang-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button {
        display: none !important;
      }

      /* Dragon Coin menu: keep the full label inside its own button. */
      .haswolf-main-nav .haswolf-dragon-nav-label {
        min-width: 0 !important;
        padding-left: 9px !important;
        padding-right: 9px !important;
        font-size: 11px !important;
        letter-spacing: -0.25px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: clip !important;
        line-height: 1 !important;
      }

      .haswolf-bottom-nav .haswolf-dragon-nav-label {
        min-width: 66px !important;
        max-width: 74px !important;
        padding-left: 5px !important;
        padding-right: 5px !important;
        font-size: 9px !important;
        line-height: 1.05 !important;
        white-space: normal !important;
        text-align: center !important;
      }

      /* Royale-style metallic cursor with a cyan energy core. Native CSS cursor avoids any startup flash. */
      @media (pointer: fine) {
        html,
        body,
        body * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='m' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23ffffff'/%3E%3Cstop offset='.45' stop-color='%238fa2ad'/%3E%3Cstop offset='1' stop-color='%23313b45'/%3E%3C/linearGradient%3E%3CradialGradient id='g'%3E%3Cstop stop-color='%23c8ffff'/%3E%3Cstop offset='.35' stop-color='%2300e5e8'/%3E%3Cstop offset='.72' stop-color='%23007c8c'/%3E%3Cstop offset='1' stop-color='%23001722'/%3E%3C/radialGradient%3E%3Cfilter id='mglow' x='-80%25' y='-80%25' width='260%25' height='260%25'%3E%3CfeGaussianBlur stdDeviation='1.1' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M2 2 L23 13 L17 16 L23 25 L18.4 28 L12.7 18.6 L8.8 24.7 Z' fill='%23070a0d' stroke='%23000' stroke-width='3' stroke-linejoin='round'/%3E%3Cpath d='M3.6 3.8 L20.2 13 L14.4 14.8 L20.2 24.2 L18.5 25.4 L12.6 15.9 L9.8 21.2 Z' fill='url(%23m)' stroke='%23d9e3e8' stroke-width='1.15' stroke-linejoin='round'/%3E%3Ccircle cx='13' cy='14.8' r='5.2' fill='%23031218' stroke='%2396f9ff' stroke-width='1.15' filter='url(%23mglow)'/%3E%3Ccircle cx='13' cy='14.8' r='3.65' fill='url(%23g)'/%3E%3Ccircle cx='11.8' cy='13.4' r='1.05' fill='%23ffffff' opacity='.85'/%3E%3Cpath d='M22.2 9.6 L28.4 12.3 L24.5 13.2 L28 16.8' fill='none' stroke='%237efcff' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M18.8 5.6 Q22 2.9 26 5.2 Q22 4.3 19.8 7.1' fill='none' stroke='%23a8bac4' stroke-width='1'/%3E%3C/svg%3E") 3 3, auto !important;
        }

        a,
        button,
        [role="button"],
        input[type="button"],
        input[type="submit"] {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='m' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23ffffff'/%3E%3Cstop offset='.45' stop-color='%238fa2ad'/%3E%3Cstop offset='1' stop-color='%23313b45'/%3E%3C/linearGradient%3E%3CradialGradient id='g'%3E%3Cstop stop-color='%23eaffff'/%3E%3Cstop offset='.35' stop-color='%2300ffff'/%3E%3Cstop offset='.72' stop-color='%23008ca2'/%3E%3Cstop offset='1' stop-color='%23001b27'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cpath d='M2 2 L23 13 L17 16 L23 25 L18.4 28 L12.7 18.6 L8.8 24.7 Z' fill='%23070a0d' stroke='%23000' stroke-width='3' stroke-linejoin='round'/%3E%3Cpath d='M3.6 3.8 L20.2 13 L14.4 14.8 L20.2 24.2 L18.5 25.4 L12.6 15.9 L9.8 21.2 Z' fill='url(%23m)' stroke='%23ffffff' stroke-width='1.25' stroke-linejoin='round'/%3E%3Ccircle cx='13' cy='14.8' r='5.4' fill='%23031218' stroke='%23baffff' stroke-width='1.4'/%3E%3Ccircle cx='13' cy='14.8' r='3.75' fill='url(%23g)'/%3E%3Ccircle cx='11.8' cy='13.4' r='1.1' fill='%23ffffff'/%3E%3Cpath d='M21.8 8.9 L29 12 L24.5 13.2 L28.3 17.2' fill='none' stroke='%239affff' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 3 3, pointer !important;
        }
      }

      @media (max-width: 1180px) {
        .haswolf-main-nav .haswolf-dragon-nav-label {
          font-size: 10px !important;
          padding-left: 6px !important;
          padding-right: 6px !important;
        }
      }
    `}</style>
  );
}
