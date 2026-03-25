import { AppHeader } from "@/components/app-header";
import { Chat } from "@/components/Chat";
import { Heartbeat } from "@/components/heartbeat";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-4xl space-y-6">
        <AppHeader title="Gruppenchat" />
        <Chat />
      </div>
    </main>
  );
}
