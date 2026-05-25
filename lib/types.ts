export type SiteSettings = {
  commissionOpen: boolean;
  queueFilled: number;
  queueTotal: number;
  deliveryDays: string;
  commissionLink: string;
  discord: string;
  tiktok: string;
  instagram: string;
  updatedAt: string;
};

export type ImageItem = {
  _id: string;
  imageUrl: string;
  publicId: string;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ImageCollectionName = "gallery_items" | "finished_commissions";

export const SETTINGS_ID = "site-settings";

export const DEFAULT_SETTINGS: SiteSettings = {
  commissionOpen: true,
  queueFilled: 1,
  queueTotal: 6,
  deliveryDays: "7-14",
  commissionLink: "https://SEULINK.com/comissoes",
  discord: "https://discord.gg/SEULINK",
  tiktok: "https://tiktok.com/@SEUUSER",
  instagram: "https://instagram.com/SEUUSER",
  updatedAt: "2026-05-25T17:13:38.492Z"
};

export const COLLECTION_LABELS: Record<
  ImageCollectionName,
  { singular: string; uploadFolder: string }
> = {
  gallery_items: {
    singular: "gallery item",
    uploadFolder: "gallery"
  },
  finished_commissions: {
    singular: "finished commission",
    uploadFolder: "finished-commissions"
  }
};
