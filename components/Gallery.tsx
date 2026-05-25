import type { ImageItem } from "../lib/types";

type Props = {
  items: ImageItem[];
  lang: "pt" | "en";
};

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#d4edaa,#c8f0a0)",
  "linear-gradient(135deg,#fce7f3,#fbb6d4)",
  "linear-gradient(135deg,#ddd6fe,#c4b5fd)",
  "linear-gradient(135deg,#bae6fd,#93c5fd)",
  "linear-gradient(135deg,#fde68a,#fcd34d)",
  "linear-gradient(135deg,#fca5a5,#f87171)"
];

const PLACEHOLDER_MARKS = [
  "gallery-mark-brush",
  "gallery-mark-mask",
  "gallery-mark-star",
  "gallery-mark-mask",
  "icon icon-paw",
  "gallery-mark-bow"
];

export function Gallery({ items, lang }: Props) {
  if (items.length === 0) {
    return (
      <div className="gallery-grid" aria-label={lang === "pt" ? "Galeria" : "Gallery"}>
        {PLACEHOLDER_GRADIENTS.map((background, index) => (
          <div className="gallery-item" style={{ background }} key={background}>
            <span className={`gallery-mark ${PLACEHOLDER_MARKS[index]}`} aria-hidden="true" />
            <div className="gallery-placeholder-text">
              {lang === "pt" ? `Arte ${index + 1}` : `Art ${index + 1}`}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="gallery-grid" aria-label={lang === "pt" ? "Galeria" : "Gallery"}>
      {items.map((item) => {
        const title = lang === "pt" ? item.titlePt : item.titleEn;
        const description = lang === "pt" ? item.descriptionPt : item.descriptionEn;
        return (
          <figure className="gallery-item has-image" key={item._id}>
            <img className="gallery-media-img" src={item.imageUrl} alt={title} loading="lazy" />
            <figcaption className="gallery-card-copy">
              <strong>{title}</strong>
              {description ? <span>{description}</span> : null}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
