-- CreateTable
CREATE TABLE "Track" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackId" INTEGER NOT NULL,
    "tapeId" INTEGER NOT NULL,
    "ragaId" INTEGER NOT NULL,
    "primaryArtistId" INTEGER NOT NULL,
    "plays" INTEGER NOT NULL,
    "alap" BOOLEAN NOT NULL,
    "jor" BOOLEAN NOT NULL,
    "jhalla" BOOLEAN NOT NULL,
    "slow_gat" BOOLEAN NOT NULL,
    "medium_gat" BOOLEAN NOT NULL,
    "fast_gat" BOOLEAN NOT NULL,
    "accompanied" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "audio_quality" TEXT NOT NULL,
    "master" BOOLEAN NOT NULL,
    "mediaTypeId" INTEGER NOT NULL,
    "public" BOOLEAN NOT NULL,
    "url" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "locationId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "notes" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MediaType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Raga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "alternateSpelling" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "rasa" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tape" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tapeId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "TrackArtist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "artistId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "TrackPlay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "secondsListened" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Track_trackId_key" ON "Track"("trackId");
