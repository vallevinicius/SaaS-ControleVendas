-- AlterTable
ALTER TABLE `Empresa`
    ADD COLUMN `assinaturaStatus` VARCHAR(191) NOT NULL DEFAULT 'NENHUMA',
    ADD COLUMN `mpAssinaturaId` VARCHAR(191) NULL,
    ADD COLUMN `mpCheckoutId` VARCHAR(191) NULL,
    ADD COLUMN `planoPendente` ENUM('FREE', 'STARTER', 'PRO', 'ENTERPRISE') NULL,
    ADD COLUMN `acessoAte` DATETIME(3) NULL,
    ADD COLUMN `canceladaEm` DATETIME(3) NULL;
