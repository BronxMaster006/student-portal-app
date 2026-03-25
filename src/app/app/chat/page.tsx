import { AppHeader } from "@/components/app-header";
import { Chat } from "@/components/Chat";
import { Heartbeat } from "@/components/heartbeat";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export default async function ChatPage() {
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MS);

  const [rawMessages, rawOnlineUsers] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: {
            firstName: true
          }
        }
      }
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        lastSeenAt: {
          gte: onlineSince
        }
      },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastSeenAt: true
      }
    })
  ]);

  const messages = rawMessages
    .slice()
    .reverse()
    .map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      author: {
        firstName: message.author.firstName
      }
    }));

  const onlineUsers = rawOnlineUsers.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastSeenAt: user.lastSeenAt?.toISOString() ?? new Date(0).toISOString()
  }));

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-4xl space-y-6">
        <AppHeader title="Gruppenchat" />
        <Chat messages={messages} onlineUsers={onlineUsers} />
      </div>
    </main>
  );
}
