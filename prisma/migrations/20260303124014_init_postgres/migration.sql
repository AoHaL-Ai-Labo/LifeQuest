-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "period" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "primaryStat" TEXT NOT NULL,
    "statsExp" TEXT NOT NULL,
    "flavorTexts" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveData" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentExp" INTEGER NOT NULL DEFAULT 0,
    "stats" TEXT NOT NULL,
    "hiddenExp" TEXT NOT NULL DEFAULT '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":0}',
    "prefix" TEXT NOT NULL DEFAULT '',
    "prestigeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestHistory" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnknownQuestDaily" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "questId1" TEXT NOT NULL,
    "questId2" TEXT NOT NULL,
    "questId3" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnknownQuestDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnknownQuestDaily_date_key" ON "UnknownQuestDaily"("date");

-- AddForeignKey
ALTER TABLE "QuestHistory" ADD CONSTRAINT "QuestHistory_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
