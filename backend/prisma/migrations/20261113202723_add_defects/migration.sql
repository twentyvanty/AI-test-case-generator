-- CreateTable
CREATE TABLE `Defect` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requirementId` INTEGER NOT NULL,
    `testCaseId` INTEGER NULL,
    `number` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `severity` ENUM('CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL') NOT NULL DEFAULT 'MAJOR',
    `priority` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `openedOn` DATE NOT NULL,
    `closedOn` DATE NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Defect_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `Defect_requirementId_number_key`(`requirementId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Defect` ADD CONSTRAINT `Defect_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `Requirement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Defect` ADD CONSTRAINT `Defect_testCaseId_fkey` FOREIGN KEY (`testCaseId`) REFERENCES `TestCase`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
