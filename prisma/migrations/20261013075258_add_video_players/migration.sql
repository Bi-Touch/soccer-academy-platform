-- CreateTable
CREATE TABLE "_PlayerToVideo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PlayerToVideo_AB_unique" ON "_PlayerToVideo"("A", "B");

-- CreateIndex
CREATE INDEX "_PlayerToVideo_B_index" ON "_PlayerToVideo"("B");

-- AddForeignKey
ALTER TABLE "_PlayerToVideo" ADD CONSTRAINT "_PlayerToVideo_A_fkey" FOREIGN KEY ("A") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerToVideo" ADD CONSTRAINT "_PlayerToVideo_B_fkey" FOREIGN KEY ("B") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
