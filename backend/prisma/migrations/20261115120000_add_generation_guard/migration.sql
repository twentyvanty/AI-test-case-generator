-- Generation guard (D-039): the "generating" mark on a requirement, and one TC
-- number per requirement (deleted test cases keep theirs, so no row breaks it;
-- checked before writing: no duplicates in the database).

-- DropForeignKey (MySQL needs the foreign key off while its index is replaced)
ALTER TABLE `TestCase` DROP FOREIGN KEY `TestCase_requirementId_fkey`;

-- DropIndex
DROP INDEX `TestCase_requirementId_number_idx` ON `TestCase`;

-- AlterTable
ALTER TABLE `Requirement` ADD COLUMN `generatingKind` ENUM('TECHNIQUE_SUGGESTION', 'SCENARIOS', 'TEST_CASES', 'TEST_DATA_PLAN') NULL,
    ADD COLUMN `generatingSince` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TestCase_requirementId_number_key` ON `TestCase`(`requirementId`, `number`);

-- AddForeignKey
-- (Prisma generated Defect_requirementId_fkey here by mistake, which already
-- exists; the key dropped above is TestCase_requirementId_fkey)
ALTER TABLE `TestCase` ADD CONSTRAINT `TestCase_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `Requirement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
