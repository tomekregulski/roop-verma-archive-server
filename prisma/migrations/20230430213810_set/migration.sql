-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tape" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tapeId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    CONSTRAINT "Tape_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tape" ("eventId", "id", "tapeId") SELECT "eventId", "id", "tapeId" FROM "Tape";
DROP TABLE "Tape";
ALTER TABLE "new_Tape" RENAME TO "Tape";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
