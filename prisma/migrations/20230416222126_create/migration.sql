-- CreateTable
CREATE TABLE "EmailToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailToken" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expirationDate" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiration" DATETIME NOT NULL
);
