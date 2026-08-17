-- CreateTable
CREATE TABLE `Empresa` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `planoAtual` ENUM('FREE', 'STARTER', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
    `trialExpiraEm` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: 1 Empresa por Tenant já existente, reaproveitando o mesmo id do
-- Tenant como id da Empresa (evita precisar de join na hora de popular
-- Tenant.empresaId logo abaixo).
INSERT INTO `Empresa` (`id`, `nome`, `planoAtual`, `trialExpiraEm`, `ativo`, `criadoEm`)
SELECT `id`, `nomeFantasia`, `planoAtual`, `trialExpiraEm`, `ativo`, `criadoEm` FROM `Tenant`;

-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `empresaId` VARCHAR(191) NULL;

UPDATE `Tenant` SET `empresaId` = `id`;

ALTER TABLE `Tenant` MODIFY COLUMN `empresaId` VARCHAR(191) NOT NULL;

ALTER TABLE `Tenant`
    DROP COLUMN `planoAtual`,
    DROP COLUMN `trialExpiraEm`,
    DROP COLUMN `ativo`;

-- CreateIndex
CREATE INDEX `Tenant_empresaId_idx` ON `Tenant`(`empresaId`);

-- AddForeignKey
ALTER TABLE `Tenant` ADD CONSTRAINT `Tenant_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `AcessoLoja` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AcessoLoja_usuarioId_tenantId_key`(`usuarioId`, `tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AcessoLoja` ADD CONSTRAINT `AcessoLoja_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcessoLoja` ADD CONSTRAINT `AcessoLoja_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
