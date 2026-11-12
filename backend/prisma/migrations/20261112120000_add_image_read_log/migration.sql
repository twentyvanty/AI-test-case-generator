-- CreateTable
CREATE TABLE `ImageRead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(50) NOT NULL,
    `size` INTEGER NOT NULL,
    `status` ENUM('PASSED', 'NEEDS_REVIEW', 'FAILED') NOT NULL,
    `attempts` INTEGER NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `seconds` DOUBLE NOT NULL,
    `text` TEXT NULL,
    `validation` JSON NULL,
    `usage` JSON NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ImageRead_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ImageRead` ADD CONSTRAINT `ImageRead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

