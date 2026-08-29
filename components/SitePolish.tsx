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

      /* Single Metin2-inspired fantasy cursor across the entire desktop site. */
      @media (pointer: fine) {
        html,
        body,
        *,
        *::before,
        *::after {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Cdefs%3E%3ClinearGradient id='steel' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='.20' stop-color='%23d8e0e4'/%3E%3Cstop offset='.46' stop-color='%238b99a2'/%3E%3Cstop offset='.72' stop-color='%23f4f7f8'/%3E%3Cstop offset='1' stop-color='%23434c53'/%3E%3C/linearGradient%3E%3ClinearGradient id='edge' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23232a2f'/%3E%3Cstop offset='.5' stop-color='%23080b0d'/%3E%3Cstop offset='1' stop-color='%235c6972'/%3E%3C/linearGradient%3E%3CradialGradient id='orb' cx='.38' cy='.30'%3E%3Cstop offset='0' stop-color='%23e8ffff'/%3E%3Cstop offset='.18' stop-color='%236fffff'/%3E%3Cstop offset='.48' stop-color='%2300cfd8'/%3E%3Cstop offset='.76' stop-color='%23007886'/%3E%3Cstop offset='1' stop-color='%2300141d'/%3E%3C/radialGradient%3E%3Cfilter id='glow' x='-70%25' y='-70%25' width='240%25' height='240%25'%3E%3CfeGaussianBlur stdDeviation='1.15' result='b'/%3E%3CfeMerge%3E%3CfeMergeNode in='b'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M3.5 2.5 L27.7 15.2 L20.7 17.6 L26.2 26.3 L22.2 28.9 L16.7 20.1 L12.1 27.2 Z' fill='%23030608' stroke='%23000000' stroke-width='2.4' stroke-linejoin='round'/%3E%3Cpath d='M5.4 4.7 L24.2 14.8 L18.3 16.3 L22.8 23.8 L21.6 24.5 L16.6 16.7 L13.0 23.3 Z' fill='url(%23steel)' stroke='%23f7fbfc' stroke-width='1.05' stroke-linejoin='round'/%3E%3Cpath d='M7.6 7.0 L19.7 13.8 L14.8 14.8 L12.9 19.0 Z' fill='%23ffffff' opacity='.58'/%3E%3Cpath d='M15.4 14.5 L21.2 17.0' stroke='%23050a0d' stroke-width='1.2'/%3E%3Ccircle cx='17.1' cy='19.2' r='7.2' fill='url(%23edge)' stroke='%23131619' stroke-width='1.2'/%3E%3Ccircle cx='17.1' cy='19.2' r='5.75' fill='%23030b0f' stroke='%23b7f9ff' stroke-width='1.05' filter='url(%23glow)'/%3E%3Ccircle cx='17.1' cy='19.2' r='4.25' fill='url(%23orb)'/%3E%3Ccircle cx='15.6' cy='17.5' r='1.25' fill='%23ffffff' opacity='.9'/%3E%3Cpath d='M26.1 6.6 Q29.4 4.4 33.1 6.6 Q29.8 6.1 27.8 8.7' fill='none' stroke='%2398f8ff' stroke-width='1.05' stroke-linecap='round'/%3E%3Cpath d='M28.0 10.5 L33.6 12.8 L30.0 13.6 L33.0 16.2' fill='none' stroke='%236ff5ff' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 4 3, auto !important;
        }
      }
    `}</style>
  );
}
