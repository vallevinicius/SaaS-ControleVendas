-- AlterTable
ALTER TABLE `Tenant`
    ADD COLUMN `site` VARCHAR(191) NULL,
    ADD COLUMN `inscricaoEstadual` VARCHAR(191) NULL,
    ADD COLUMN `inscricaoMunicipal` VARCHAR(191) NULL,
    ADD COLUMN `regimeTributario` VARCHAR(191) NULL,
    ADD COLUMN `cep` VARCHAR(191) NULL,
    ADD COLUMN `logradouro` VARCHAR(191) NULL,
    ADD COLUMN `numero` VARCHAR(191) NULL,
    ADD COLUMN `complemento` VARCHAR(191) NULL,
    ADD COLUMN `bairro` VARCHAR(191) NULL,
    ADD COLUMN `cidade` VARCHAR(191) NULL,
    ADD COLUMN `uf` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Usuario`
    ADD COLUMN `cpf` VARCHAR(191) NULL,
    ADD COLUMN `telefone` VARCHAR(191) NULL;
