-- CreateTable
CREATE TABLE "NetworkError" (
    "id" SERIAL NOT NULL,
    "errorCode" INTEGER NOT NULL,
    "errorMessage" INTEGER NOT NULL,
    "isRegisteredUser" BOOLEAN NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "NetworkError_pkey" PRIMARY KEY ("id")
);
