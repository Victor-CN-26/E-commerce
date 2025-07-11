/*
  Warnings:

  - You are about to drop the column `isDropship` on the `product` table. All the data in the column will be lost.
  - You are about to drop the `product_sizes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `stock` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `product_sizes` DROP FOREIGN KEY `product_sizes_productId_fkey`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `isDropship`,
    ADD COLUMN `sizeStocks` TEXT NOT NULL DEFAULT '[]',
    ADD COLUMN `sizes` TEXT NOT NULL DEFAULT '[]',
    ADD COLUMN `stock` INTEGER NOT NULL;

-- DropTable
DROP TABLE `product_sizes`;
