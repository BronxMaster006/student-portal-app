-- CreateTable
CREATE TABLE "InfoPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfoPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InfoPost_createdAt_idx" ON "InfoPost"("createdAt");

-- AddForeignKey
ALTER TABLE "InfoPost" ADD CONSTRAINT "InfoPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
