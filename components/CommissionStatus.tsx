import type { SiteSettings } from "../lib/types";

type Props = {
  settings: SiteSettings;
  lang: "pt" | "en";
  compact?: boolean;
};

export function CommissionStatus({ settings, lang, compact = false }: Props) {
  const open = settings.commissionOpen !== false;
  const statusText = lang === "pt" ? (open ? "Aberto" : "Fechado") : open ? "Open" : "Closed";
  const queueWord = compact
    ? lang === "pt"
      ? "vagas"
      : "slots"
    : lang === "pt"
      ? "vagas preenchidas"
      : "slots filled";
  const delivery = lang === "pt" ? `${settings.deliveryDays} dias` : `${settings.deliveryDays} days`;

  return (
    <div className="commission-status">
      <div className="comm-item">
        <span className="comm-icon icon icon-star" aria-hidden="true" />
        <div className="comm-text">
          {compact ? "Status: " : lang === "pt" ? "Status das comissões: " : "Commission Status: "}
          <span className={open ? "" : "status-closed"}>{statusText}</span>
        </div>
      </div>
      <div className="comm-item">
        <span className="comm-icon icon icon-paw" aria-hidden="true" />
        <div className="comm-text">
          {lang === "pt" ? "Fila: " : "Queue: "}
          {settings.queueFilled}/{settings.queueTotal} <span>{queueWord}</span>
        </div>
      </div>
      <div className="comm-item">
        <span className="comm-icon icon icon-clock" aria-hidden="true" />
        <div className="comm-text">
          {compact ? (lang === "pt" ? "Prazo: " : "Delivery: ") : lang === "pt" ? "Prazo médio: " : "Avg. delivery: "}
          <span>{delivery}</span>
        </div>
      </div>
    </div>
  );
}
