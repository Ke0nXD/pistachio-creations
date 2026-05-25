"use client";

type Props = {
  lang: "pt" | "en";
  onToast: (message: string) => void;
  onClickSound: () => void;
};

export function MusicButton({ lang, onToast, onClickSound }: Props) {
  const label = lang === "pt" ? "Somzinho" : "Music";

  function handleClick() {
    onClickSound();
    onToast(lang === "pt" ? "Música pronta para conectar quando houver um arquivo." : "Music is ready once an audio file is added.");
  }

  return (
    <button id="music-btn" type="button" onClick={handleClick}>
      <span className="nav-icon music-icon" aria-hidden="true" />
      <span id="music-label">{label}</span>
    </button>
  );
}
