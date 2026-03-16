import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminInfoPageClient from "@/components/admin-info-page-client";

export default async function AdminInfoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/app");
  }

  return <AdminInfoPageClient />;
}