-- CreateTable
CREATE TABLE `RegistroAuditoria` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,
    `usuarioNome` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `detalhe` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RegistroAuditoria_tenantId_criadoEm_idx`(`tenantId`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RegistroAuditoria` ADD CONSTRAINT `RegistroAuditoria_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistroAuditoria` ADD CONSTRAINT `RegistroAuditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
