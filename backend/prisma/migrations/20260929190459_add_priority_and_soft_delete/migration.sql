-- DropForeignKey
ALTER TABLE `Scenario` DROP FOREIGN KEY `Scenario_requirementId_fkey`;

-- DropForeignKey
ALTER TABLE `TestCase` DROP FOREIGN KEY `TestCase_requirementId_fkey`;

-- DropIndex
DROP INDEX `Scenario_requirementId_number_key` ON `Scenario`;

-- DropIndex
DROP INDEX `TestCase_requirementId_number_key` ON `TestCase`;

-- AlterTable
ALTER TABLE `Requirement` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Scenario` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `priority` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE `TestCase` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Requirement_deletedAt_idx` ON `Requirement`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Scenario_requirementId_number_idx` ON `Scenario`(`requirementId`, `number`);

-- CreateIndex
CREATE INDEX `Scenario_deletedAt_idx` ON `Scenario`(`deletedAt`);

-- CreateIndex
CREATE INDEX `TestCase_requirementId_number_idx` ON `TestCase`(`requirementId`, `number`);

-- CreateIndex
CREATE INDEX `TestCase_deletedAt_idx` ON `TestCase`(`deletedAt`);

-- AddForeignKey
ALTER TABLE `Scenario` ADD CONSTRAINT `Scenario_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `Requirement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- (Prisma generated TestCase_scenarioId_fkey here by mistake; the key that was dropped above is TestCase_requirementId_fkey)
ALTER TABLE `TestCase` ADD CONSTRAINT `TestCase_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `Requirement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
