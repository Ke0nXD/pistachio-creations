"use client";

import { FormEvent, useState } from "react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Nao foi possivel entrar.");
      window.location.href = "/admin";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bg-texture" />
      <canvas id="particles-canvas" />
      <main className="admin-page-shell">
        <div className="admin-login-card">
          <form className="admin-section-card" onSubmit={submit}>
            <div>
              <h1 className="admin-dashboard-title">Admin</h1>
              <p className="admin-dashboard-subtitle">Pistachio &amp; Creations</p>
            </div>
            <label className="admin-field">
              Senha
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha do admin"
              />
            </label>
            {message ? (
              <p className="admin-status-message" data-tone="error">
                {message}
              </p>
            ) : null}
            <button className="admin-primary-btn" type="submit" disabled={busy}>
              {busy ? "Entrando..." : "Entrar"}
            </button>
            <a className="admin-secondary-btn" href="/" style={{ textAlign: "center", textDecoration: "none" }}>
              Voltar ao site
            </a>
          </form>
        </div>
      </main>
    </>
  );
}
