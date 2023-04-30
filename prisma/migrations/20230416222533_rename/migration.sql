/*
  Warnings:

  - You are about to drop the `EmailToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EmailToken";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailToken" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expirationDate" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiration" DATETIME NOT NULL
);
