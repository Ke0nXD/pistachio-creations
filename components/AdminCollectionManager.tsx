"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ImageCollectionName, ImageItem } from "../lib/types";

type Draft = {
  imageUrl: string;
  publicId: string;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
};

type ManagerProps = {
  initialItems: ImageItem[];
  onMessage: (message: string) => void;
};

type GenericManagerProps = ManagerProps & {
  title: string;
  endpoint: "gallery" | "finished-commissions";
  section: ImageCollectionName;
};

const EMPTY_DRAFT: Draft = {
  imageUrl: "",
  publicId: "",
  titlePt: "",
  titleEn: "",
  descriptionPt: "",
  descriptionEn: "",
  category: "",
  sortOrder: 0,
  isActive: true
};

export function AdminGalleryManager(props: ManagerProps) {
  return <AdminCollectionManager {...props} title="Galeria" endpoint="gallery" section="gallery_items" />;
}

export function AdminFinishedCommissionsManager(props: ManagerProps) {
  return (
    <AdminCollectionManager
      {...props}
      title="Comissões feitas"
      endpoint="finished-commissions"
      section="finished_commissions"
    />
  );
}

function itemToDraft(item: ImageItem): Draft {
  return {
    imageUrl: item.imageUrl,
    publicId: item.publicId,
    titlePt: item.titlePt,
    titleEn: item.titleEn,
    descriptionPt: item.descriptionPt,
    descriptionEn: item.descriptionEn,
    category: item.category || "",
    sortOrder: item.sortOrder,
    isActive: item.isActive
  };
}

function AdminCollectionManager({ initialItems, onMessage, title, endpoint, section }: GenericManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder), [items]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function refresh() {
    const response = await fetch(`/api/${endpoint}?admin=1`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Nao foi possivel atualizar lista.");
    setItems(data);
  }

  async function upload(file: File) {
    setBusy(true);
    onMessage("Enviando imagem para o Cloudinary...");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("section", section);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha no upload.");
      setDraft((current) => ({ ...current, imageUrl: data.imageUrl, publicId: data.publicId }));
      onMessage("Imagem enviada. Revise os textos e salve o card.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    onMessage(editingId ? "Atualizando card..." : "Criando card...");

    try {
      const response = await fetch(editingId ? `/api/${endpoint}/${editingId}` : `/api/${endpoint}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Nao foi possivel salvar card.");
      await refresh();
      setDraft(EMPTY_DRAFT);
      setEditingId("");
      onMessage(editingId ? "Card atualizado." : "Card criado.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nao foi possivel salvar card.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item: ImageItem) {
    setBusy(true);
    try {
      const response = await fetch(`/api/${endpoint}/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Nao foi possivel alterar status.");
      await refresh();
      onMessage(item.isActive ? "Card desativado." : "Card ativado.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nao foi possivel alterar status.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: ImageItem) {
    if (!window.confirm(`Remover "${item.titlePt || item.titleEn}"?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/${endpoint}/${item._id}`, {
        method: "DELETE",
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Nao foi possivel remover card.");
      await refresh();
      onMessage(data.warning ? `Card removido. Aviso Cloudinary: ${data.warning}` : "Card removido.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nao foi possivel remover card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-section-card admin-manager">
      <h2>{title}</h2>
      <form className="admin-form-grid" onSubmit={submit}>
        <label className="admin-field">
          Upload de imagem
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {draft.imageUrl ? (
          <div className="admin-thumb-wrap" style={{ width: "100%", height: 180 }}>
            <img className="admin-thumb" src={draft.imageUrl} alt="Preview" />
          </div>
        ) : null}
        <div className="admin-form-grid two">
          <label className="admin-field">
            Título PT
            <input value={draft.titlePt} onChange={(event) => update("titlePt", event.target.value)} />
          </label>
          <label className="admin-field">
            Título EN
            <input value={draft.titleEn} onChange={(event) => update("titleEn", event.target.value)} />
          </label>
        </div>
        <div className="admin-form-grid two">
          <label className="admin-field">
            Descrição PT
            <textarea value={draft.descriptionPt} onChange={(event) => update("descriptionPt", event.target.value)} />
          </label>
          <label className="admin-field">
            Descrição EN
            <textarea value={draft.descriptionEn} onChange={(event) => update("descriptionEn", event.target.value)} />
          </label>
        </div>
        <div className="admin-form-grid two">
          <label className="admin-field">
            Categoria
            <input value={draft.category} onChange={(event) => update("category", event.target.value)} />
          </label>
          <label className="admin-field">
            Ordem
            <input type="number" value={draft.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} />
          </label>
        </div>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.isActive} onChange={(event) => update("isActive", event.target.checked)} />
          Ativo no site público
        </label>
        <div className="admin-row-actions">
          <button className="admin-primary-btn" type="submit" disabled={busy}>
            {editingId ? "Salvar edição" : "Adicionar card"}
          </button>
          {editingId ? (
            <button
              className="admin-secondary-btn"
              type="button"
              onClick={() => {
                setEditingId("");
                setDraft(EMPTY_DRAFT);
              }}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-item-list">
        {sortedItems.length === 0 ? (
          <p className="admin-status-message">Nenhum card cadastrado ainda.</p>
        ) : (
          sortedItems.map((item) => (
            <article className="admin-item-row" key={item._id}>
              <div className="admin-thumb-wrap">
                <img className="admin-thumb" src={item.imageUrl} alt={item.titlePt || item.titleEn} />
              </div>
              <div className="admin-item-copy">
                <strong>{item.titlePt || item.titleEn}</strong>
                <span>{item.titleEn}</span>
                <span>
                  Ordem {item.sortOrder} • {item.isActive ? "ativo" : "inativo"}
                </span>
                <div className="admin-row-actions">
                  <button
                    className="admin-secondary-btn"
                    type="button"
                    onClick={() => {
                      setEditingId(item._id);
                      setDraft(itemToDraft(item));
                    }}
                  >
                    Editar
                  </button>
                  <button className="admin-secondary-btn" type="button" onClick={() => void toggleActive(item)} disabled={busy}>
                    {item.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button className="admin-danger-btn" type="button" onClick={() => void remove(item)} disabled={busy}>
                    Remover
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
