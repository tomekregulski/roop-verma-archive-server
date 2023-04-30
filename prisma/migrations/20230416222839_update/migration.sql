/*
  Warnings:

  - You are about to alter the column `expiration` on the `Token` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `expirationDate` on the `Token` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `userId` on the `Token` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailToken" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expirationDate" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiration" INTEGER NOT NULL
);
INSERT INTO "new_Token" ("createdAt", "emailToken", "expiration", "expirationDate", "id", "type", "userId") SELECT "createdAt", "emailToken", "expiration", "expirationDate", "id", "type", "userId" FROM "Token";
DROP TABLE "Token";
ALTER TABLE "new_Token" RENAME TO "Token";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
