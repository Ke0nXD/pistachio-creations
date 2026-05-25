import type { ImageItem, SiteSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type RawObject = Record<string, unknown>;

function isObject(value: unknown): value is RawObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = "", max = 500) {
  const clean = String(value ?? fallback).trim();
  return clean.slice(0, max);
}

function cleanNumber(value: unknown, fallback: number, min: number, max = 9999) {
  const number = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function cleanUrl(value: unknown, fieldName: string): ValidationResult<string> {
  const raw = cleanString(value, "", 1200);
  if (!raw) return { ok: true, data: "" };

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { ok: false, error: `${fieldName} precisa usar http ou https.` };
    }
    return { ok: true, data: url.toString() };
  } catch {
    return { ok: false, error: `${fieldName} precisa ser uma URL valida ou ficar vazio.` };
  }
}

export function validateSettingsInput(input: unknown): ValidationResult<SiteSettings> {
  if (!isObject(input)) return { ok: false, error: "Payload invalido." };

  const queueTotal = cleanNumber(input.queueTotal, DEFAULT_SETTINGS.queueTotal, 1, 99);
  const queueFilled = cleanNumber(input.queueFilled, DEFAULT_SETTINGS.queueFilled, 0, queueTotal);

  const commissionLink = cleanUrl(input.commissionLink, "Link para comissionar");
  if (!commissionLink.ok) return commissionLink;

  const discord = cleanUrl(input.discord, "Discord");
  if (!discord.ok) return discord;

  const tiktok = cleanUrl(input.tiktok, "TikTok");
  if (!tiktok.ok) return tiktok;

  const instagram = cleanUrl(input.instagram, "Instagram");
  if (!instagram.ok) return instagram;

  return {
    ok: true,
    data: {
      commissionOpen: input.commissionOpen !== false,
      queueFilled,
      queueTotal,
      deliveryDays: cleanString(input.deliveryDays, DEFAULT_SETTINGS.deliveryDays, 32)
        .replace(/\s*(dias|dia|days|day)$/i, "")
        .trim() || DEFAULT_SETTINGS.deliveryDays,
      commissionLink: commissionLink.data,
      discord: discord.data,
      tiktok: tiktok.data,
      instagram: instagram.data,
      updatedAt: new Date().toISOString()
    }
  };
}

export type ImageItemInput = Omit<ImageItem, "_id" | "createdAt" | "updatedAt">;

export function validateImageItemInput(input: unknown): ValidationResult<ImageItemInput>;
export function validateImageItemInput(
  input: unknown,
  options: { partial: true }
): ValidationResult<Partial<ImageItemInput>>;
export function validateImageItemInput(
  input: unknown,
  options: { partial?: boolean } = {}
): ValidationResult<Partial<ImageItemInput> | ImageItemInput> {
  if (!isObject(input)) return { ok: false, error: "Payload invalido." };

  const partial = options.partial === true;
  const imageUrl = cleanString(input.imageUrl, "", 1600);
  const publicId = cleanString(input.publicId, "", 600);
  const titlePt = cleanString(input.titlePt, "", 120);
  const titleEn = cleanString(input.titleEn, "", 120);

  if (!partial || imageUrl) {
    const imageUrlResult = cleanUrl(imageUrl, "URL da imagem");
    if (!imageUrlResult.ok) return imageUrlResult;
    if (!imageUrlResult.data) return { ok: false, error: "A imagem e obrigatoria." };
  }

  if ((!partial || titlePt !== "") && titlePt.length < 1) {
    return { ok: false, error: "Titulo PT e obrigatorio." };
  }

  if ((!partial || titleEn !== "") && titleEn.length < 1) {
    return { ok: false, error: "Titulo EN e obrigatorio." };
  }

  const data: Partial<ImageItemInput> = {
    imageUrl,
    publicId,
    titlePt,
    titleEn,
    descriptionPt: cleanString(input.descriptionPt, "", 500),
    descriptionEn: cleanString(input.descriptionEn, "", 500),
    category: cleanString(input.category, "", 120),
    sortOrder: cleanNumber(input.sortOrder, 0, -9999, 9999),
    isActive: input.isActive !== false
  };

  if (partial) {
    Object.keys(data).forEach((key) => {
      if (input[key] === undefined) delete data[key as keyof ImageItemInput];
    });
  }

  return { ok: true, data: data as ImageItemInput };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
