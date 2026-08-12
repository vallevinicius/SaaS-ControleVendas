-- AlterTable
ALTER TABLE `transacao` ADD COLUMN `caixaId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Caixa` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `status` ENUM('ABERTO', 'FECHADO') NOT NULL DEFAULT 'ABERTO',
    `valorAbertura` DECIMAL(12, 2) NOT NULL,
    `abertoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `abertoPorId` VARCHAR(191) NOT NULL,
    `valorContadoFechamento` DECIMAL(12, 2) NULL,
    `observacaoFechamento` VARCHAR(191) NULL,
    `fechadoEm` DATETIME(3) NULL,
    `fechadoPorId` VARCHAR(191) NULL,

    INDEX `Caixa_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transacao_caixaId_idx` ON `Transacao`(`caixaId`);

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_caixaId_fkey` FOREIGN KEY (`caixaId`) REFERENCES `Caixa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Caixa` ADD CONSTRAINT `Caixa_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Caixa` ADD CONSTRAINT `Caixa_abertoPorId_fkey` FOREIGN KEY (`abertoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Caixa` ADD CONSTRAINT `Caixa_fechadoPorId_fkey` FOREIGN KEY (`fechadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
