-- CreateTable
CREATE TABLE "Tribute" (
    "id" SERIAL NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Tribute_pkey" PRIMARY KEY ("id")
);
