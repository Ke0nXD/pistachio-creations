"use client";

import { FormEvent, useState } from "react";
import type { SiteSettings } from "../lib/types";

type Props = {
  initialSettings: SiteSettings;
  onMessage: (message: string) => void;
};

export function AdminForm({ initialSettings, onMessage }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    onMessage("Salvando configurações...");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Nao foi possivel salvar configuracoes.");
      setSettings(data);
      onMessage("Configurações salvas no MongoDB.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nao foi possivel salvar configuracoes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-section-card admin-form-grid" onSubmit={submit}>
      <h2>Configurações</h2>
      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={settings.commissionOpen}
          onChange={(event) => update("commissionOpen", event.target.checked)}
        />
        Comissões abertas
      </label>
      <div className="admin-form-grid two">
        <label className="admin-field">
          Vagas preenchidas
          <input
            type="number"
            min="0"
            value={settings.queueFilled}
            onChange={(event) => update("queueFilled", Number(event.target.value))}
          />
        </label>
        <label className="admin-field">
          Total de vagas
          <input
            type="number"
            min="1"
            value={settings.queueTotal}
            onChange={(event) => update("queueTotal", Number(event.target.value))}
          />
        </label>
      </div>
      <label className="admin-field">
        Prazo médio
        <input value={settings.deliveryDays} onChange={(event) => update("deliveryDays", event.target.value)} placeholder="7-14" />
      </label>
      <label className="admin-field">
        Link para comissionar
        <input value={settings.commissionLink} onChange={(event) => update("commissionLink", event.target.value)} placeholder="https://..." />
      </label>
      <div className="admin-form-grid two">
        <label className="admin-field">
          Discord
          <input value={settings.discord} onChange={(event) => update("discord", event.target.value)} placeholder="https://..." />
        </label>
        <label className="admin-field">
          TikTok
          <input value={settings.tiktok} onChange={(event) => update("tiktok", event.target.value)} placeholder="https://..." />
        </label>
      </div>
      <label className="admin-field">
        Instagram
        <input value={settings.instagram} onChange={(event) => update("instagram", event.target.value)} placeholder="https://..." />
      </label>
      <button className="admin-primary-btn" type="submit" disabled={busy}>
        {busy ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
