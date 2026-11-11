-- AlterTable
ALTER TABLE `GenerationRun` ADD COLUMN `reviewedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Scenario` DROP COLUMN `priority`,
    DROP COLUMN `selected`;

-- AlterTable
ALTER TABLE `TestCase` ADD COLUMN `deletedWithScenario` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `runId` INTEGER NULL,
    ADD COLUMN `status` ENUM('OPEN', 'PASS', 'FAIL') NOT NULL DEFAULT 'OPEN';

-- AddForeignKey
ALTER TABLE `TestCase` ADD CONSTRAINT `TestCase_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `GenerationRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

