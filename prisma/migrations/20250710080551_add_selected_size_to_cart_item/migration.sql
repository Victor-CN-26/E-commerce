/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,selectedSize]` on the table `cart_item` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_userId_fkey`;

-- DropIndex
DROP INDEX `cart_item_userId_productId_key` ON `cart_item`;

-- AlterTable
ALTER TABLE `cart_item` ADD COLUMN `selectedSize` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `cart_item_userId_productId_selectedSize_key` ON `cart_item`(`userId`, `productId`, `selectedSize`);

-- AddForeignKey
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
