import { redirect } from "next/navigation";
import { AdminLogin } from "../../../components/AdminLogin";
import { isAdminSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LoginPage() {
  if (await isAdminSession()) redirect("/admin");
  return <AdminLogin />;
}
