-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Raga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "alternateSpelling" TEXT,
    "time" TEXT,
    "rasa" TEXT
);
INSERT INTO "new_Raga" ("alternateSpelling", "id", "name", "rasa", "time") SELECT "alternateSpelling", "id", "name", "rasa", "time" FROM "Raga";
DROP TABLE "Raga";
ALTER TABLE "new_Raga" RENAME TO "Raga";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
