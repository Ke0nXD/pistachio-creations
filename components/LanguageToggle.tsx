"use client";

type Props = {
  lang: "pt" | "en";
  onToggle: () => void;
};

export function LanguageToggle({ lang, onToggle }: Props) {
  return (
    <button id="lang-btn" type="button" onClick={onToggle}>
      <span className="nav-icon lang-icon" aria-hidden="true" />
      <span id="lang-label">{lang === "pt" ? "EN" : "PT"}</span>
    </button>
  );
}
