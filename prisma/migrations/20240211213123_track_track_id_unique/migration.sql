/*
  Warnings:

  - A unique constraint covering the columns `[trackId]` on the table `Track` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Track_trackId_key" ON "Track"("trackId");
