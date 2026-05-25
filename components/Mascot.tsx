"use client";

import { useRef, useState } from "react";

type Props = {
  lang: "pt" | "en";
  commissionOpen: boolean;
  playClick: () => void;
};

type DragState = {
  active: boolean;
  moved: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

const PHRASES = {
  pt: ["Boop!", "Pistache gostou do carinho!", "Comissões abertas!", "Você encontrou o cantinho secreto!"],
  en: ["Boop!", "Pistache liked that!", "Commissions open!", "You found the cozy corner!"]
};

export function Mascot({ lang, commissionOpen, playClick }: Props) {
  const mascotRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState>({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const phraseRef = useRef(0);
  const [bubble, setBubble] = useState("");
  const [booped, setBooped] = useState(false);

  function phrases() {
    const statusPhrase = commissionOpen
      ? lang === "pt"
        ? "Comissões abertas!"
        : "Commissions open!"
      : lang === "pt"
        ? "Comissões fechadas por enquanto!"
        : "Commissions are closed for now!";

    return lang === "pt"
      ? [PHRASES.pt[0], PHRASES.pt[1], statusPhrase, PHRASES.pt[3]]
      : [PHRASES.en[0], PHRASES.en[1], statusPhrase, PHRASES.en[3]];
  }

  function mascotClick() {
    playClick();
    const options = phrases();
    setBubble(options[phraseRef.current % options.length]);
    phraseRef.current += 1;
    setBooped(true);
    window.clearTimeout(window._pistachioMascotBubbleTimer);
    window.clearTimeout(window._pistachioMascotReactTimer);
    window._pistachioMascotReactTimer = window.setTimeout(() => setBooped(false), 3200);
    window._pistachioMascotBubbleTimer = window.setTimeout(() => setBubble(""), 2800);
  }

  function clampPosition(x: number, y: number) {
    const mascot = mascotRef.current;
    if (!mascot) return { x, y };
    const rect = mascot.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - rect.width);
    const maxY = Math.max(0, window.innerHeight - rect.height);
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(0, y))
    };
  }

  function applyPosition(x: number, y: number) {
    const mascot = mascotRef.current;
    if (!mascot) return;
    const position = clampPosition(x, y);
    mascot.style.left = `${position.x}px`;
    mascot.style.top = `${position.y}px`;
    mascot.style.right = "auto";
    mascot.style.bottom = "auto";
  }

  function pointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const mascot = event.currentTarget;
    const rect = mascot.getBoundingClientRect();
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    mascot.classList.add("is-dragging");
    mascot.style.left = `${rect.left}px`;
    mascot.style.top = `${rect.top}px`;
    mascot.style.right = "auto";
    mascot.style.bottom = "auto";
    mascot.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    applyPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
    event.preventDefault();
  }

  function pointerEnd(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    event.currentTarget.classList.remove("is-dragging");
    event.currentTarget.releasePointerCapture(event.pointerId);
    const wasDrag = drag.moved;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    if (!wasDrag && event.type === "pointerup") mascotClick();
    event.preventDefault();
  }

  return (
    <button
      id="mascot"
      ref={mascotRef}
      className={`mascot-button${booped ? " booped" : ""}`}
      type="button"
      aria-label={lang === "pt" ? "Interagir e arrastar o pet Pistache" : "Interact with and drag Pistachio"}
      title="Pistache"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
    >
      <span className={`speech-bubble${bubble ? " visible" : ""}`} id="speech-bubble">
        {bubble}
      </span>
      <span className="mascot-body" aria-hidden="true">
        <img className="mascot-img mascot-img-normal" src="/assets/mascot-normal.png" alt="" draggable={false} />
        <img className="mascot-img mascot-img-boop" src="/assets/mascot-boop.png" alt="" draggable={false} />
      </span>
    </button>
  );
}

declare global {
  interface Window {
    _pistachioMascotBubbleTimer?: number;
    _pistachioMascotReactTimer?: number;
  }
}
