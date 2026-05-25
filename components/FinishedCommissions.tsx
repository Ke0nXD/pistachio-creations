import type { ImageItem } from "../lib/types";

type Props = {
  items: ImageItem[];
  lang: "pt" | "en";
};

export function FinishedCommissions({ items, lang }: Props) {
  return (
    <section className="finished-section">
      <h2 className="section-title" style={{ textAlign: "center", marginBottom: 14 }}>
        <span className="icon icon-star" aria-hidden="true" />
        {lang === "pt" ? "Comissões feitas" : "Finished Commissions"}
      </h2>
      <div className="finished-grid">
        {items.length === 0 ? (
          <div className="empty-gallery-note">
            {lang === "pt"
              ? "As comissões finalizadas aparecerão aqui quando forem cadastradas no admin."
              : "Finished commissions will appear here after they are added in admin."}
          </div>
        ) : (
          items.map((item) => {
            const title = lang === "pt" ? item.titlePt : item.titleEn;
            const description = lang === "pt" ? item.descriptionPt : item.descriptionEn;
            return (
              <figure className="finished-item has-image" key={item._id}>
                <img className="finished-media-img" src={item.imageUrl} alt={title} loading="lazy" />
                <figcaption className="finished-card-copy">
                  <strong>{title}</strong>
                  {description ? <span>{description}</span> : null}
                </figcaption>
              </figure>
            );
          })
        )}
      </div>
    </section>
  );
}
