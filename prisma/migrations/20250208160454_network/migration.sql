/*
  Warnings:

  - Made the column `timestamp` on table `NetworkError` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "NetworkError" ALTER COLUMN "timestamp" SET NOT NULL;
