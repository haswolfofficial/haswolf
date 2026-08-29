"use client";

import { useEffect } from "react";

const DRAGON_COIN_LABEL = "Dragon Coin (DC)";
const DRAGON_COIN_NAV_LABEL = "Dragon Coin";
const HASWOLF_YOUTUBE_CHANNEL = "https://www.youtube.com/@ROYALEONLINEHASWOLF";
const HASWOLF_YOUTUBE_VIDEOS = `${HASWOLF_YOUTUBE_CHANNEL}/videos`;

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

function simplifyDragonCoinLabel(element: HTMLElement) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    const value = text.nodeValue || "";
    if (value.includes(DRAGON_COIN_LABEL)) {
      text.nodeValue = value.replaceAll(DRAGON_COIN_LABEL, DRAGON_COIN_NAV_LABEL);
      element.classList.add("haswolf-dragon-nav-label");
    }
    node = walker.nextNode();
  }
}

function fixDragonCoinNavigation() {
  document
    .querySelectorAll<HTMLElement>(".haswolf-main-nav a, .haswolf-main-nav button, .haswolf-bottom-nav a, .haswolf-bottom-nav button")
    .forEach(simplifyDragonCoinLabel);

  document.querySelectorAll<HTMLElement>(".haswolf-market-tabs button").forEach((element) => {
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (/Dragon Coin \(DC\) SATIŞ/i.test(text) || /^💎?\s*DC SATIŞ$/i.test(text)) {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        textNodes.push(node as Text);
        node = walker.nextNode();
      }
      for (const textNode of textNodes) {
        const value = textNode.nodeValue || "";
        if (/Dragon Coin \(DC\) SATIŞ/i.test(value)) textNode.nodeValue = value.replace(/Dragon Coin \(DC\) SATIŞ/gi, "Dragon Coin SATIŞ");
        else if (/\bDC SATIŞ\b/i.test(value)) textNode.nodeValue = value.replace(/\bDC SATIŞ\b/gi, "Dragon Coin SATIŞ");
      }
      element.classList.add("haswolf-dragon-market-label");
    }
  });
}

function enhanceCommunityYouTubeCard() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("p, h2, h3, strong"));
  const heading = headings.find((element) => element.textContent?.trim() === "HASWOLF TV");
  if (!heading) return;

  let card: HTMLElement | null = heading.parentElement;
  while (card && card !== document.body) {
    const text = card.textContent || "";
    if (text.includes("HASWOLF TV") && text.includes("YAYIN YOK") && card.children.length >= 2) break;
    card = card.parentElement;
  }

  if (!card || card === document.body || card.dataset.haswolfYoutubeEnhanced === "1") return;
  card.dataset.haswolfYoutubeEnhanced = "1";
  card.classList.add("haswolf-youtube-offline-card");

  const header = card.children.item(0) as HTMLElement | null;
  const body = card.children.item(1) as HTMLElement | null;
  if (!header || !body) return;

  const status = Array.from(header.querySelectorAll<HTMLElement>("span")).find((element) => element.textContent?.trim() === "YAYIN YOK");
  if (status) {
    status.textContent = "SON VİDEOLAR";
    status.className = "haswolf-youtube-status";
  }

  body.replaceChildren();
  body.className = "haswolf-youtube-offline-body";

  const playerWrap = document.createElement("div");
  playerWrap.className = "haswolf-youtube-player-wrap";

  const iframe = document.createElement("iframe");
  iframe.src = "https://www.youtube-nocookie.com/embed?listType=user_uploads&list=ROYALEONLINEHASWOLF&rel=0&modestbranding=1";
  iframe.title = "HASWOLF TV son videolar";
  iframe.loading = "lazy";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.setAttribute("allowfullscreen", "true");
  playerWrap.appendChild(iframe);

  const info = document.createElement("div");
  info.className = "haswolf-youtube-channel-info";
  info.innerHTML = `<div><b>ROYALE ONLINE HASWOLF</b><span>Canlı yayın yokken son videolar burada.</span></div>`;

  const channelLink = document.createElement("a");
  channelLink.href = HASWOLF_YOUTUBE_CHANNEL;
  channelLink.target = "_blank";
  channelLink.rel = "noreferrer";
  channelLink.textContent = "▶ Kanalı Aç";
  info.appendChild(channelLink);

  const videosLink = document.createElement("a");
  videosLink.href = HASWOLF_YOUTUBE_VIDEOS;
  videosLink.target = "_blank";
  videosLink.rel = "noreferrer";
  videosLink.className = "haswolf-youtube-videos-link";
  videosLink.textContent = "Tüm videoları gör →";

  body.append(playerWrap, info, videosLink);
}

export default function SitePolish() {
  useEffect(() => {
    normalizeDragonCoinLabels();
    fixDragonCoinNavigation();
    enhanceCommunityYouTubeCard();

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
      enhanceCommunityYouTubeCard();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .haswolf-yang-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button { display: none !important; }

      .haswolf-main-nav .haswolf-dragon-nav-label,
      .haswolf-market-tabs .haswolf-dragon-market-label {
        min-width: 0 !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
        font-size: 13px !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
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

      .haswolf-youtube-offline-card {
        border-color: rgba(220, 38, 38, .48) !important;
        background: linear-gradient(145deg, rgba(24, 8, 9, .98), rgba(7, 8, 10, .98)) !important;
        box-shadow: 0 16px 42px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.025);
      }
      .haswolf-youtube-status {
        border: 1px solid rgba(239,68,68,.3);
        border-radius: 999px;
        background: rgba(127,29,29,.22);
        padding: 4px 8px;
        color: #fca5a5 !important;
        font-size: 9px !important;
        font-weight: 800;
        letter-spacing: .12em;
      }
      .haswolf-youtube-offline-body {
        padding: 10px;
      }
      .haswolf-youtube-player-wrap {
        position: relative;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        border-radius: 11px;
        border: 1px solid rgba(255,255,255,.08);
        background: #050505;
      }
      .haswolf-youtube-player-wrap iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }
      .haswolf-youtube-channel-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 2px 6px;
      }
      .haswolf-youtube-channel-info b {
        display: block;
        color: #fff;
        font-size: 11px;
        letter-spacing: .035em;
      }
      .haswolf-youtube-channel-info span {
        display: block;
        margin-top: 2px;
        color: #71717a;
        font-size: 9px;
      }
      .haswolf-youtube-channel-info a {
        flex: 0 0 auto;
        border: 1px solid rgba(239,68,68,.42);
        border-radius: 8px;
        background: linear-gradient(180deg,#dc2626,#991b1b);
        padding: 7px 9px;
        color: white !important;
        font-size: 10px;
        font-weight: 900;
        text-decoration: none !important;
      }
      .haswolf-youtube-videos-link {
        display: block;
        padding: 3px 2px 1px;
        color: #f87171 !important;
        font-size: 10px;
        font-weight: 800;
        text-decoration: none !important;
      }
      .haswolf-youtube-videos-link:hover { color: #fca5a5 !important; }

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
