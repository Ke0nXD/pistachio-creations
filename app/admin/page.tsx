import { redirect } from "next/navigation";
import { AdminDashboard } from "../../components/AdminDashboard";
import { isAdminSession } from "../../lib/auth";
import { getSettings, listImageItems } from "../../lib/mongodb";
import { DEFAULT_SETTINGS, type ImageItem, type SiteSettings } from "../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadAdminData(): Promise<{
  settings: SiteSettings;
  gallery: ImageItem[];
  finishedCommissions: ImageItem[];
  error: string;
}> {
  try {
    const [settings, gallery, finishedCommissions] = await Promise.all([
      getSettings(),
      listImageItems("gallery_items", { includeInactive: true }),
      listImageItems("finished_commissions", { includeInactive: true })
    ]);
    return { settings, gallery, finishedCommissions, error: "" };
  } catch (error) {
    return {
      settings: DEFAULT_SETTINGS,
      gallery: [],
      finishedCommissions: [],
      error: error instanceof Error ? error.message : "Nao foi possivel carregar admin."
    };
  }
}

export default async function AdminPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const data = await loadAdminData();
  return <AdminDashboard {...data} />;
}
