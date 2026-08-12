-- AlterTable
ALTER TABLE `transacao` ADD COLUMN `vendedorId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Vendedor` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `comissaoPercentual` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Vendedor_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transacao_vendedorId_idx` ON `Transacao`(`vendedorId`);

-- AddForeignKey
ALTER TABLE `Vendedor` ADD CONSTRAINT `Vendedor_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `Vendedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
