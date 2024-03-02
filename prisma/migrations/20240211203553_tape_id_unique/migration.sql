/*
  Warnings:

  - A unique constraint covering the columns `[tapeId]` on the table `Tape` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tape_tapeId_key" ON "Tape"("tapeId");
