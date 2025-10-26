/*
  Warnings:

  - You are about to drop the `images` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."images" DROP CONSTRAINT "images_user_id_fkey";

-- DropTable
DROP TABLE "public"."images";

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "tone" TEXT,
    "keywords" JSONB,
    "fontFamily" TEXT DEFAULT 'Arial',
    "fontSize" INTEGER DEFAULT 24,
    "textColor" TEXT DEFAULT '#FFFFFF',
    "align" TEXT DEFAULT 'center',
    "showBg" BOOLEAN DEFAULT true,
    "bgColor" TEXT DEFAULT '#3B3F4A',
    "bgOpacity" DOUBLE PRECISION DEFAULT 0.8,
    "posX" INTEGER DEFAULT 120,
    "posY" INTEGER DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_user_id_createdAt_idx" ON "media"("user_id", "createdAt");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
