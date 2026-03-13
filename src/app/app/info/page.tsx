import { prisma } from "@/lib/prisma";

export default async function InfoPage() {
  const posts = await prisma.infoPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Info-Seiten</h1>

      {posts.map((post) => (
        <div
          key={post.id}
          className="p-6 rounded-xl border border-gray-700 bg-gray-900"
        >
          <h2 className="text-xl font-semibold">{post.title}</h2>

          <p className="text-gray-400 text-sm">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>

          <p className="mt-3">{post.content}</p>
        </div>
      ))}
    </div>
  );
}