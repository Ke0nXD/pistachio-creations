"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommissionStatus } from "./CommissionStatus";
import { FinishedCommissions } from "./FinishedCommissions";
import { Gallery } from "./Gallery";
import { LanguageToggle } from "./LanguageToggle";
import { Mascot } from "./Mascot";
import { MusicButton } from "./MusicButton";
import { SocialButtons } from "./SocialButtons";
import type { ImageItem, SiteSettings } from "../lib/types";

type Lang = "pt" | "en";
type PageKey = "home-pt" | "home-en" | "pistachio-pt" | "pistachio-en";

type Props = {
  settings: SiteSettings;
  gallery: ImageItem[];
  finishedCommissions: ImageItem[];
  error?: string;
};

const COMMISSION_TYPES = {
  pt: [
    ["gallery-mark-mask", "Ícone de personagem", "ver preço →"],
    ["gallery-mark-brush", "Meio corpo", "ver preço →"],
    ["gallery-mark-star", "Corpo inteiro", "ver preço →"],
    ["gallery-mark-doc", "Reference sheet", "ver preço →"],
    ["gallery-mark-brush", "Design de personagem", "ver preço →"],
    ["shape-spark", "Criação personalizada", "ver preço →"]
  ],
  en: [
    ["gallery-mark-mask", "Character Icon", "see price →"],
    ["gallery-mark-brush", "Half Body", "see price →"],
    ["gallery-mark-star", "Full Body", "see price →"],
    ["gallery-mark-doc", "Reference Sheet", "see price →"],
    ["gallery-mark-brush", "Character Design", "see price →"],
    ["shape-spark", "Custom Creation", "see price →"]
  ]
};

export function SiteShell({ settings, gallery, finishedCommissions, error = "" }: Props) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [lang, setLang] = useState<Lang>("pt");
  const [page, setPage] = useState<PageKey>("home-pt");
  const [toast, setToast] = useState("");

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const playClick = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Sound is decorative; no visible error is needed when the browser blocks it.
    }
  }, []);

  const navigate = useCallback((nextPage: PageKey) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function toggleLang() {
    const nextLang: Lang = lang === "pt" ? "en" : "pt";
    setLang(nextLang);
    localStorage.setItem("pistachio-lang", nextLang);
    setPage((current) => (current.startsWith("home") ? `home-${nextLang}` : `pistachio-${nextLang}`) as PageKey);
  }

  function openLink(url: string) {
    if (url && !url.includes("SEULINK") && !url.includes("SEUUSER")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    showToast(lang === "pt" ? "Configure esse link no admin." : "Set this link in admin.");
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("pistachio-lang") === "en" ? "en" : "pt";
    setLang(savedLang);
    setPage(savedLang === "pt" ? "home-pt" : "home-en");

    if (window.location.hash === "#admin" || new URLSearchParams(window.location.search).has("admin")) {
      window.location.href = "/admin";
    }

    function keyHandler(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        window.location.href = "/admin";
      }
    }

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  useEffect(() => {
    function mouseMove(event: MouseEvent) {
      const cursor = cursorRef.current;
      if (!cursor) return;
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }

    function mouseOver(event: MouseEvent) {
      if ((event.target as Element | null)?.closest("button, a, [role='button']")) {
        cursorRef.current?.classList.add("hover");
      }
    }

    function mouseOut(event: MouseEvent) {
      if ((event.target as Element | null)?.closest("button, a, [role='button']")) {
        cursorRef.current?.classList.remove("hover");
      }
    }

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseover", mouseOver);
    document.addEventListener("mouseout", mouseOut);
    return () => {
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseover", mouseOver);
      document.removeEventListener("mouseout", mouseOut);
    };
  }, []);

  useEffect(() => {
    function spawnParticle(x: number, y: number) {
      const particle = document.createElement("div");
      const shape = Math.random() > 0.5 ? "shape-heart" : "shape-paw";
      particle.className = `click-particle ${shape}`;
      particle.style.left = `${x + (Math.random() - 0.5) * 28}px`;
      particle.style.top = `${y}px`;
      particle.style.animationDuration = `${0.75 + Math.random() * 0.3}s`;
      document.body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 1100);
    }

    function clickHandler(event: MouseEvent) {
      if ((event.target as Element | null)?.closest("input, textarea, select")) return;
      for (let i = 0; i < 5; i += 1) {
        window.setTimeout(() => spawnParticle(event.clientX, event.clientY), i * 45);
      }
    }

    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const canvasElement = canvas;
    const context = ctx;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      shape: "heart" | "paw";
      alpha: number;
      phase: number;
    };

    let animation = 0;
    const particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasElement.width = Math.floor(window.innerWidth * dpr);
      canvasElement.height = Math.floor(window.innerHeight * dpr);
      canvasElement.style.width = `${window.innerWidth}px`;
      canvasElement.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeGradient(x: number, y: number, size: number, start: string, end: string, t: number, phase: number) {
      const shift = Math.sin(t * 0.8 + phase) * size * 0.42;
      const gradient = context.createLinearGradient(x - size + shift, y - size, x + size, y + size + shift);
      gradient.addColorStop(0, start);
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.72)");
      gradient.addColorStop(1, end);
      return gradient;
    }

    function drawHeart(x: number, y: number, size: number, color: CanvasGradient) {
      context.save();
      context.translate(x, y);
      context.scale(size / 24, size / 24);
      context.beginPath();
      context.moveTo(0, 8);
      context.bezierCurveTo(-14, -3, -10, -15, 0, -8);
      context.bezierCurveTo(10, -15, 14, -3, 0, 8);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.restore();
    }

    function drawPaw(x: number, y: number, size: number, color: CanvasGradient) {
      context.fillStyle = color;
      context.beginPath();
      context.ellipse(x, y + size * 0.25, size * 0.34, size * 0.25, 0, 0, Math.PI * 2);
      context.fill();
      [
        [-0.46, -0.2],
        [-0.16, -0.36],
        [0.18, -0.36],
        [0.48, -0.18]
      ].forEach(([tx, ty]) => {
        context.beginPath();
        context.ellipse(x + tx * size, y + ty * size, size * 0.17, size * 0.2, 0, 0, Math.PI * 2);
        context.fill();
      });
    }

    function draw() {
      context.clearRect(0, 0, canvasElement.width, canvasElement.height);
      const t = Date.now() / 1000;
      particles.forEach((particle) => {
        particle.x += particle.vx + Math.sin(t + particle.phase) * 0.05;
        particle.y += particle.vy;
        if (particle.y < -30) {
          particle.y = window.innerHeight + 20;
          particle.x = Math.random() * window.innerWidth;
        }
        if (particle.x < -30) particle.x = window.innerWidth + 20;
        if (particle.x > window.innerWidth + 30) particle.x = -20;
        context.globalAlpha = particle.alpha * (0.7 + 0.3 * Math.sin(t * 1.5 + particle.phase));
        const size = particle.size * (0.82 + Math.sin(t + particle.phase) * 0.12);
        if (particle.shape === "paw") {
          drawPaw(particle.x, particle.y, size, makeGradient(particle.x, particle.y, size, "#ff78b4", "#ffd1e3", t, particle.phase));
        } else {
          drawHeart(particle.x, particle.y, size, makeGradient(particle.x, particle.y, size, "#8be85c", "#d8ffbf", t, particle.phase));
        }
      });
      context.globalAlpha = 1;
      animation = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    const count = window.innerWidth < 720 ? 18 : 32;
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.1 - Math.random() * 0.18,
        size: 8 + Math.random() * 8,
        shape: Math.random() > 0.5 ? "heart" : "paw",
        alpha: 0.28 + Math.random() * 0.34,
        phase: Math.random() * Math.PI * 2
      });
    }
    draw();

    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const open = settings.commissionOpen !== false;

  return (
    <>
      <div id="custom-cursor" ref={cursorRef} aria-hidden="true" />
      <div className="bg-texture" />
      <canvas id="particles-canvas" ref={canvasRef} />
      <MusicButton lang={lang} onToast={showToast} onClickSound={playClick} />
      <LanguageToggle lang={lang} onToggle={toggleLang} />
      <Mascot lang={lang} commissionOpen={open} playClick={playClick} />

      <div id="app">
        <HomePanel
          active={page === "home-pt"}
          lang="pt"
          settings={settings}
          navigate={() => {
            playClick();
            navigate("pistachio-pt");
          }}
          openLink={openLink}
          playClick={playClick}
        />
        <HomePanel
          active={page === "home-en"}
          lang="en"
          settings={settings}
          navigate={() => {
            playClick();
            navigate("pistachio-en");
          }}
          openLink={openLink}
          playClick={playClick}
        />
        <PistachioPanel
          active={page === "pistachio-pt"}
          lang="pt"
          settings={settings}
          gallery={gallery}
          finishedCommissions={finishedCommissions}
          openLink={openLink}
          playClick={playClick}
          goHome={() => {
            playClick();
            navigate("home-pt");
          }}
        />
        <PistachioPanel
          active={page === "pistachio-en"}
          lang="en"
          settings={settings}
          gallery={gallery}
          finishedCommissions={finishedCommissions}
          openLink={openLink}
          playClick={playClick}
          goHome={() => {
            playClick();
            navigate("home-en");
          }}
        />
      </div>

      {toast ? <div className="site-error-banner">{toast}</div> : null}
      {error ? <div className="site-error-banner">{error}</div> : null}
    </>
  );
}

function HomePanel({
  active,
  lang,
  settings,
  navigate,
  openLink,
  playClick
}: {
  active: boolean;
  lang: Lang;
  settings: SiteSettings;
  navigate: () => void;
  openLink: (url: string) => void;
  playClick: () => void;
}) {
  const open = settings.commissionOpen !== false;

  return (
    <div id={`page-home-${lang}`} className={`page${active ? " active" : ""}`}>
      <div className="home-wrapper">
        <div className="main-card">
          <div className="profile-wrap">
            <div className="profile-pic">
              <div className="profile-pic-placeholder profile-pic-image" aria-label={lang === "pt" ? "Mascote Pistachio" : "Pistachio mascot"}>
                <img className="profile-avatar-img" src="/assets/profile-icon.jpeg" alt={lang === "pt" ? "Mascote Pistachio" : "Pistachio mascot"} />
              </div>
            </div>
          </div>

          <h1 className="card-title">Pistachio &amp; Creations</h1>
          <p className="card-subtitle">
            {lang === "pt" ? "Arte digital • Comissões personalizadas • Designs fofos" : "Digital art • Custom commissions • Cute designs"}
          </p>
          <p className="card-desc">
            {lang === "pt"
              ? "Um cantinho criativo para personagens fofos, artes únicas e criações feitas com carinho."
              : "A cozy creative space for cute characters, unique art and handcrafted creations."}
          </p>

          <div className="badges">
            <span className={`badge green${open ? "" : " closed"}`}>
              <span className="icon icon-star" aria-hidden="true" /> {lang === "pt" ? (open ? "Comissões Abertas" : "Comissões Fechadas") : open ? "Open Commissions" : "Closed Commissions"}
            </span>
            <span className="badge">
              <span className="icon icon-heart" aria-hidden="true" /> {lang === "pt" ? "Arte Digital" : "Digital Artist"}
            </span>
            <span className="badge green">
              <span className="icon icon-star" aria-hidden="true" /> {lang === "pt" ? "Designs Fofos" : "Cute Designs"}
            </span>
          </div>

          <CommissionStatus settings={settings} lang={lang} />

          <div className="main-buttons">
            <button className="btn-main btn-green" onClick={navigate} type="button">
              Pistachio &amp; Creations <span className="btn-icon icon icon-paw" aria-hidden="true" />
            </button>
            <button
              className="btn-main btn-pink"
              onClick={() => {
                playClick();
                openLink(settings.commissionLink);
              }}
              type="button"
            >
              {lang === "pt" ? "Quero Comissionar!" : "Request a Commission"} <span className="btn-icon icon icon-heart" aria-hidden="true" />
            </button>
          </div>

          <div className="cute-divider">{lang === "pt" ? "Redes sociais" : "Social media"}</div>
          <SocialButtons settings={settings} openLink={openLink} playClick={playClick} />
        </div>
      </div>
    </div>
  );
}

function PistachioPanel({
  active,
  lang,
  settings,
  gallery,
  finishedCommissions,
  openLink,
  playClick,
  goHome
}: {
  active: boolean;
  lang: Lang;
  settings: SiteSettings;
  gallery: ImageItem[];
  finishedCommissions: ImageItem[];
  openLink: (url: string) => void;
  playClick: () => void;
  goHome: () => void;
}) {
  const types = COMMISSION_TYPES[lang];

  return (
    <div id={`page-pistachio-${lang}`} className={`page${active ? " active" : ""}`}>
      {active ? (
        <button className="back-btn" onClick={goHome} type="button">
          <span className="nav-icon back-icon" aria-hidden="true" /> {lang === "pt" ? "Voltar" : "Back"}
        </button>
      ) : null}
      <div className="inner-page">
        <div className="inner-hero">
          <h1 className="inner-title">Pistachio &amp; Creations</h1>
          <p className="inner-subtitle">
            {lang === "pt"
              ? "Artes, personagens e criações feitas com carinho, cor e personalidade."
              : "Art, characters and creations made with care, color and personality."}
          </p>
        </div>

        <Gallery items={gallery} lang={lang} />

        <FinishedCommissions items={finishedCommissions} lang={lang} />

        <div className="about-section">
          <h2 className="section-title">
            <span className="icon icon-paw" aria-hidden="true" />
            {lang === "pt" ? "Sobre" : "About"}
          </h2>
          <p className="about-text">
            {lang === "pt"
              ? "Cada criação nasce para carregar identidade, fofura e um toque único de personalidade. Feito com amor, carinho e muita cor."
              : "Each creation is made to carry identity, cuteness and a unique touch of personality. Made with love, care and lots of color."}
          </p>
        </div>

        <div className="comm-cards-section">
          <h2 className="section-title" style={{ textAlign: "center", marginBottom: 14 }}>
            <span className="icon icon-paw" aria-hidden="true" />
            {lang === "pt" ? "Tipos de Comissão" : "Commission Types"}
          </h2>
          <div className="comm-cards-grid">
            {types.map(([mark, name, price]) => (
              <div className="comm-card" key={name}>
                <span className={`comm-card-icon ${mark}`} aria-hidden="true" />
                <div className="comm-card-name">{name}</div>
                <div className="comm-card-price">{price}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="inner-status">
          <h2 className="section-title" style={{ marginBottom: 12 }}>
            <span className="icon icon-star" aria-hidden="true" />
            {lang === "pt" ? "Status das Comissões" : "Commission Status"}
          </h2>
          <CommissionStatus settings={settings} lang={lang} compact />
        </div>

        <div className="contact-area">
          <button
            className="btn-main btn-pink"
            style={{ maxWidth: 400, margin: "0 auto 16px", display: "flex" }}
            onClick={() => {
              playClick();
              openLink(settings.commissionLink);
            }}
            type="button"
          >
            {lang === "pt" ? "Quero Comissionar!" : "Request a Commission"} <span className="btn-icon icon icon-heart" aria-hidden="true" />
          </button>
          <button className="btn-main btn-green" style={{ maxWidth: 400, margin: "0 auto", display: "flex" }} onClick={goHome} type="button">
            {lang === "pt" ? "Voltar ao início" : "Back to Home"} <span className="btn-icon nav-icon back-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
