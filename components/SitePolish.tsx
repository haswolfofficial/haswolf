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
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
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

type YouTubeState = {
  live?: boolean;
  videoId?: string | null;
  channelId?: string | null;
  channelTitle?: string;
};

async function enhanceCommunityYouTubeCard() {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("p, h2, h3, strong"));
  const heading = headings.find((element) => element.textContent?.trim() === "HASWOLF TV");
  if (!heading) return;

  const card = heading.closest<HTMLElement>("div.overflow-hidden.rounded-2xl");
  if (!card || card.dataset.haswolfYoutubeEnhanced === "1") return;

  const header = card.children.item(0) as HTMLElement | null;
  const body = card.children.item(1) as HTMLElement | null;
  if (!header || !body) return;

  card.dataset.haswolfYoutubeEnhanced = "1";
  card.classList.add("haswolf-youtube-card");

  let state: YouTubeState = {};
  try {
    const response = await fetch("/api/youtube-live", { cache: "no-store" });
    if (response.ok) state = (await response.json()) as YouTubeState;
  } catch {
    state = {};
  }

  const status = Array.from(header.querySelectorAll<HTMLElement>("span"))[0];
  if (status) {
    status.textContent = state.live ? "● CANLI" : "SON VİDEOLAR";
    status.className = state.live ? "haswolf-youtube-status is-live" : "haswolf-youtube-status";
  }

  body.replaceChildren();
  body.className = "haswolf-youtube-body";

  const playerWrap = document.createElement("div");
  playerWrap.className = "haswolf-youtube-player-wrap";

  const iframe = document.createElement("iframe");
  const uploadsList = state.channelId?.startsWith("UC") ? `UU${state.channelId.slice(2)}` : null;
  if (state.live && state.videoId) {
    iframe.src = `https://www.youtube-nocookie.com/embed/${state.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
    iframe.title = "HASWOLF TV canlı yayın";
  } else if (uploadsList) {
    iframe.src = `https://www.youtube-nocookie.com/embed/videoseries?list=${uploadsList}&rel=0&modestbranding=1`;
    iframe.title = "HASWOLF TV son videolar";
  } else {
    playerWrap.classList.add("haswolf-youtube-fallback");
    const fallback = document.createElement("a");
    fallback.href = HASWOLF_YOUTUBE_VIDEOS;
    fallback.target = "_blank";
    fallback.rel = "noreferrer";
    fallback.textContent = "▶ Son videoları YouTube'da aç";
    playerWrap.appendChild(fallback);
  }

  if (iframe.src) {
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.setAttribute("allowfullscreen", "true");
    playerWrap.appendChild(iframe);
  }

  const footer = document.createElement("div");
  footer.className = "haswolf-youtube-footer";
  footer.innerHTML = `<div><b>${state.channelTitle || "ROYALE ONLINE HASWOLF"}</b><span>${state.live ? "Canlı yayın şu anda aktif." : "Canlı yayın yokken kanalın son videoları gösterilir."}</span></div>`;

  const channelLink = document.createElement("a");
  channelLink.href = HASWOLF_YOUTUBE_CHANNEL;
  channelLink.target = "_blank";
  channelLink.rel = "noreferrer";
  channelLink.textContent = state.live ? "YouTube'da Aç" : "Kanalı Aç";
  footer.appendChild(channelLink);

  body.append(playerWrap, footer);
}

export default function SitePolish() {
  useEffect(() => {
    normalizeDragonCoinLabels();
    fixDragonCoinNavigation();
    void enhanceCommunityYouTubeCard();

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
      void enhanceCommunityYouTubeCard();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .haswolf-yang-card:has(.haswolf-dc-flexible-calculator) .haswolf-yang-card__meta button { display: none !important; }
      .haswolf-main-nav .haswolf-dragon-nav-label,
      .haswolf-market-tabs .haswolf-dragon-market-label {
        min-width: 0 !important; padding-left: 10px !important; padding-right: 10px !important;
        font-size: 13px !important; letter-spacing: 0 !important; white-space: nowrap !important;
        overflow: hidden !important; text-overflow: ellipsis !important;
      }
      .haswolf-bottom-nav .haswolf-dragon-nav-label {
        min-width: 66px !important; max-width: 78px !important; padding: 0 5px !important;
        font-size: 10px !important; line-height: 1.05 !important; white-space: nowrap !important; text-align: center !important;
      }
      .haswolf-youtube-card {
        border-color: rgba(220,38,38,.5) !important;
        background: linear-gradient(145deg,rgba(24,8,9,.98),rgba(7,8,10,.98)) !important;
        box-shadow: 0 16px 42px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.025);
      }
      .haswolf-youtube-status {
        border: 1px solid rgba(239,68,68,.28); border-radius: 999px; background: rgba(127,29,29,.2);
        padding: 4px 8px; color: #fca5a5 !important; font-size: 9px !important; font-weight: 800; letter-spacing: .1em;
      }
      .haswolf-youtube-status.is-live { color: #86efac !important; border-color: rgba(34,197,94,.35); background: rgba(20,83,45,.28); }
      .haswolf-youtube-body { padding: 10px; }
      .haswolf-youtube-player-wrap {
        position: relative; aspect-ratio: 16/9; overflow: hidden; border-radius: 11px;
        border: 1px solid rgba(255,255,255,.08); background: #050505;
      }
      .haswolf-youtube-player-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
      .haswolf-youtube-fallback { display: flex; align-items: center; justify-content: center; }
      .haswolf-youtube-fallback a { color: #fff; font-size: 12px; font-weight: 800; text-decoration: none; }
      .haswolf-youtube-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 2px 2px; }
      .haswolf-youtube-footer b { display: block; color: #fff; font-size: 11px; letter-spacing: .03em; }
      .haswolf-youtube-footer span { display: block; margin-top: 2px; color: #71717a; font-size: 9px; }
      .haswolf-youtube-footer a {
        flex: 0 0 auto; border: 1px solid rgba(239,68,68,.42); border-radius: 8px;
        background: linear-gradient(180deg,#dc2626,#991b1b); padding: 7px 9px;
        color: white !important; font-size: 10px; font-weight: 900; text-decoration: none !important;
      }
      @media (pointer: fine) {
        html, body { cursor: default !important; }
        a, button, [role="button"], summary, label, select,
        input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"] { cursor: pointer !important; }
        input[type="text"], input[type="number"], input[type="email"], input[type="search"], input[type="password"], textarea,
        [contenteditable="true"] { cursor: text !important; }
        button:disabled, input:disabled, select:disabled, [aria-disabled="true"] { cursor: not-allowed !important; }
      }
    `}</style>
  );
}
