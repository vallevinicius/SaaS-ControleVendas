-- AlterTable
ALTER TABLE `Usuario`
    ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `aceiteTermosEm` DATETIME(3) NULL,
    ADD COLUMN `aceiteTermosVersao` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `AdminPlataforma`
    ADD COLUMN `totpSegredo` VARCHAR(191) NULL,
    ADD COLUMN `totpAtivo` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `SessaoRefresh` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `revogadaEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(255) NULL,

    UNIQUE INDEX `SessaoRefresh_tokenHash_key`(`tokenHash`),
    INDEX `SessaoRefresh_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SessaoRefresh` ADD CONSTRAINT `SessaoRefresh_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
