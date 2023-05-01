-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackId" INTEGER NOT NULL,
    "tapeId" INTEGER NOT NULL,
    "ragaId" INTEGER NOT NULL,
    "primaryArtistId" INTEGER NOT NULL,
    "plays" INTEGER DEFAULT 0,
    "alap" BOOLEAN NOT NULL,
    "jor" BOOLEAN NOT NULL,
    "jhalla" BOOLEAN NOT NULL,
    "slowGat" BOOLEAN NOT NULL,
    "mediumGat" BOOLEAN NOT NULL,
    "fastGat" BOOLEAN NOT NULL,
    "accompanied" BOOLEAN NOT NULL,
    "notes" TEXT,
    "audioQuality" TEXT,
    "master" BOOLEAN NOT NULL,
    "mediaTypeId" INTEGER NOT NULL,
    "public" BOOLEAN NOT NULL,
    "url" TEXT NOT NULL,
    CONSTRAINT "Track_tapeId_fkey" FOREIGN KEY ("tapeId") REFERENCES "Tape" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_ragaId_fkey" FOREIGN KEY ("ragaId") REFERENCES "Raga" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_primaryArtistId_fkey" FOREIGN KEY ("primaryArtistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_mediaTypeId_fkey" FOREIGN KEY ("mediaTypeId") REFERENCES "MediaType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("accompanied", "alap", "audioQuality", "fastGat", "id", "jhalla", "jor", "master", "mediaTypeId", "mediumGat", "notes", "plays", "primaryArtistId", "public", "ragaId", "slowGat", "tapeId", "trackId", "url") SELECT "accompanied", "alap", "audioQuality", "fastGat", "id", "jhalla", "jor", "master", "mediaTypeId", "mediumGat", "notes", "plays", "primaryArtistId", "public", "ragaId", "slowGat", "tapeId", "trackId", "url" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE UNIQUE INDEX "Track_trackId_key" ON "Track"("trackId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
