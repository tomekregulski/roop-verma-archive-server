/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Raga` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Raga_name_key" ON "Raga"("name");
