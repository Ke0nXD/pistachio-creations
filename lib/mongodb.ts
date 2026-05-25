import { MongoClient, ObjectId, type Collection, type Db, type Document } from "mongodb";
import type { ImageCollectionName, ImageItem, SiteSettings } from "./types";
import { DEFAULT_SETTINGS, SETTINGS_ID } from "./types";

type SettingsDocument = SiteSettings & {
  _id: typeof SETTINGS_ID;
};

type ImageItemDocument = Omit<ImageItem, "_id"> & {
  _id: ObjectId;
};

let clientPromise: Promise<MongoClient> | null = null;

function getMongoUrl() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL nao configurado.");
  return url;
}

function getDbName() {
  return process.env.DB_NAME || "pistachio_creations";
}

export function hasMongoConfig() {
  return Boolean(process.env.MONGO_URL);
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(getMongoUrl()).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(getDbName());
}

function settingsCollection(db: Db) {
  return db.collection<SettingsDocument>("settings");
}

function imageCollection(db: Db, name: ImageCollectionName): Collection<ImageItemDocument> {
  return db.collection<ImageItemDocument>(name);
}

function normalizeSettings(document?: SettingsDocument | null): SiteSettings {
  if (!document) return DEFAULT_SETTINGS;
  return {
    commissionOpen: document.commissionOpen !== false,
    queueFilled: Number(document.queueFilled ?? DEFAULT_SETTINGS.queueFilled),
    queueTotal: Number(document.queueTotal ?? DEFAULT_SETTINGS.queueTotal),
    deliveryDays: String(document.deliveryDays || DEFAULT_SETTINGS.deliveryDays),
    commissionLink: String(document.commissionLink || ""),
    discord: String(document.discord || ""),
    tiktok: String(document.tiktok || ""),
    instagram: String(document.instagram || ""),
    updatedAt: String(document.updatedAt || new Date().toISOString())
  };
}

function normalizeItem(document: ImageItemDocument): ImageItem {
  return {
    _id: document._id.toString(),
    imageUrl: document.imageUrl,
    publicId: document.publicId || "",
    titlePt: document.titlePt,
    titleEn: document.titleEn,
    descriptionPt: document.descriptionPt || "",
    descriptionEn: document.descriptionEn || "",
    category: document.category || "",
    sortOrder: Number(document.sortOrder || 0),
    isActive: document.isActive !== false,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

export async function getSettings(): Promise<SiteSettings> {
  if (!hasMongoConfig()) return DEFAULT_SETTINGS;

  const db = await getDb();
  const collection = settingsCollection(db);
  const existing = await collection.findOne({ _id: SETTINGS_ID });

  if (existing) return normalizeSettings(existing);

  const seeded: SettingsDocument = {
    _id: SETTINGS_ID,
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString()
  };
  await collection.insertOne(seeded);
  return normalizeSettings(seeded);
}

export async function updateSettings(settings: SiteSettings): Promise<SiteSettings> {
  const db = await getDb();
  const document: SettingsDocument = {
    _id: SETTINGS_ID,
    ...settings,
    updatedAt: new Date().toISOString()
  };

  await settingsCollection(db).updateOne(
    { _id: SETTINGS_ID },
    { $set: document },
    { upsert: true }
  );

  return normalizeSettings(document);
}

export async function listImageItems(
  name: ImageCollectionName,
  options: { includeInactive?: boolean } = {}
): Promise<ImageItem[]> {
  if (!hasMongoConfig()) return [];

  const db = await getDb();
  const query: Document = options.includeInactive ? {} : { isActive: { $ne: false } };
  const items = await imageCollection(db, name)
    .find(query)
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray();

  return items.map(normalizeItem);
}

export async function createImageItem(
  name: ImageCollectionName,
  input: Omit<ImageItem, "_id" | "createdAt" | "updatedAt">
): Promise<ImageItem> {
  const db = await getDb();
  const now = new Date().toISOString();
  const document: ImageItemDocument = {
    _id: new ObjectId(),
    ...input,
    publicId: input.publicId || "",
    descriptionPt: input.descriptionPt || "",
    descriptionEn: input.descriptionEn || "",
    category: input.category || "",
    sortOrder: Number(input.sortOrder || 0),
    isActive: input.isActive !== false,
    createdAt: now,
    updatedAt: now
  };

  await imageCollection(db, name).insertOne(document);
  return normalizeItem(document);
}

export async function updateImageItem(
  name: ImageCollectionName,
  id: string,
  input: Partial<Omit<ImageItem, "_id" | "createdAt" | "updatedAt">>
): Promise<ImageItem | null> {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const update = {
    ...input,
    updatedAt: new Date().toISOString()
  };

  const result = await imageCollection(db, name).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" }
  );

  return result ? normalizeItem(result) : null;
}

export async function deleteImageItem(
  name: ImageCollectionName,
  id: string
): Promise<ImageItem | null> {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const result = await imageCollection(db, name).findOneAndDelete({ _id: new ObjectId(id) });
  return result ? normalizeItem(result) : null;
}
