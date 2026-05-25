import { SiteShell } from "../components/SiteShell";
import { getSettings, listImageItems } from "../lib/mongodb";
import { DEFAULT_SETTINGS, type ImageItem, type SiteSettings } from "../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadPublicData(): Promise<{
  settings: SiteSettings;
  gallery: ImageItem[];
  finishedCommissions: ImageItem[];
  error: string;
}> {
  try {
    const [settings, gallery, finishedCommissions] = await Promise.all([
      getSettings(),
      listImageItems("gallery_items"),
      listImageItems("finished_commissions")
    ]);

    return { settings, gallery, finishedCommissions, error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel carregar dados dinamicos.";
    return {
      settings: DEFAULT_SETTINGS,
      gallery: [],
      finishedCommissions: [],
      error: message
    };
  }
}

export default async function Home() {
  const data = await loadPublicData();
  return <SiteShell {...data} />;
}
