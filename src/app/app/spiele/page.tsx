import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SpielePageClient from "@/components/spiele-page-client";

export default async function SpielePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <SpielePageClient />;
}