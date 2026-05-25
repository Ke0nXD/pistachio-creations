"use client";

import { useState } from "react";
import { AdminFinishedCommissionsManager, AdminGalleryManager } from "./AdminCollectionManager";
import { AdminForm } from "./AdminForm";
import type { ImageItem, SiteSettings } from "../lib/types";

type Props = {
  settings: SiteSettings;
  gallery: ImageItem[];
  finishedCommissions: ImageItem[];
  error: string;
};

export function AdminDashboard({ settings, gallery, finishedCommissions, error }: Props) {
  const [message, setMessage] = useState(error);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    window.location.href = "/admin/login";
  }

  return (
    <>
      <div className="bg-texture" />
      <canvas id="particles-canvas" />
      <main className="admin-page-shell">
        <div className="admin-dashboard">
          <header className="admin-dashboard-header">
            <div>
              <h1 className="admin-dashboard-title">Admin Pistachio</h1>
              <p className="admin-dashboard-subtitle">Configurações, galeria e comissões feitas sem GitHub token.</p>
            </div>
            <button className="admin-secondary-btn" type="button" onClick={logout}>
              Sair
            </button>
          </header>

          {message ? (
            <p className="admin-status-message" data-tone={error ? "error" : "ok"}>
              {message}
            </p>
          ) : null}

          <div className="admin-dashboard-grid">
            <AdminForm initialSettings={settings} onMessage={setMessage} />
            <div className="admin-manager">
              <AdminGalleryManager initialItems={gallery} onMessage={setMessage} />
              <AdminFinishedCommissionsManager initialItems={finishedCommissions} onMessage={setMessage} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
