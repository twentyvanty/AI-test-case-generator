-- CreateTable
CREATE TABLE `DefectImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `defectId` INTEGER NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(50) NOT NULL,
    `size` INTEGER NOT NULL,
    `storedName` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DefectImage_defectId_idx`(`defectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DefectImage` ADD CONSTRAINT `DefectImage_defectId_fkey` FOREIGN KEY (`defectId`) REFERENCES `Defect`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
