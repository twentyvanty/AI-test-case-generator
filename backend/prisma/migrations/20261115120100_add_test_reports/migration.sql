-- AlterTable
ALTER TABLE `Requirement` ADD COLUMN `reportConclusion` TEXT NULL;

-- CreateTable
CREATE TABLE `TestReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requirementId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `verdict` ENUM('READY', 'NOT_READY') NOT NULL,
    `withOpenRisks` BOOLEAN NOT NULL,
    `conclusion` TEXT NOT NULL,
    `snapshot` JSON NOT NULL,
    `fingerprint` VARCHAR(64) NOT NULL,
    `finalizedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TestReport_requirementId_version_key`(`requirementId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TestReport` ADD CONSTRAINT `TestReport_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `Requirement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
