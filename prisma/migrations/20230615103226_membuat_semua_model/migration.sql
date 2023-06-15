-- CreateTable
CREATE TABLE `users` (
    `id_user` VARCHAR(191) NOT NULL,
    `fullname` VARCHAR(100) NULL,
    `email` VARCHAR(100) NOT NULL,
    `username` VARCHAR(31) NOT NULL,
    `role` ENUM('ADMIN', 'CUSTOMER') NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `photo_profile` LONGBLOB NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang` (
    `id_barang` CHAR(6) NOT NULL,
    `id_kategori` INTEGER NOT NULL,
    `id_brand` INTEGER NOT NULL,
    `nm_brg` VARCHAR(100) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `slogan` VARCHAR(191) NOT NULL,
    `likes` INTEGER NOT NULL,
    `rating` TINYINT NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id_barang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand` (
    `id_brand` INTEGER NOT NULL AUTO_INCREMENT,
    `nm_brand` VARCHAR(25) NOT NULL,

    UNIQUE INDEX `brand_nm_brand_key`(`nm_brand`),
    PRIMARY KEY (`id_brand`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori` (
    `id_kategori` INTEGER NOT NULL AUTO_INCREMENT,
    `nm_kategori` VARCHAR(25) NOT NULL,

    UNIQUE INDEX `kategori_nm_kategori_key`(`nm_kategori`),
    PRIMARY KEY (`id_kategori`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_barang` (
    `id_detail_barang` INTEGER NOT NULL AUTO_INCREMENT,
    `id_barang` CHAR(6) NOT NULL,
    `harga` INTEGER UNSIGNED NOT NULL,
    `stok` SMALLINT UNSIGNED NOT NULL,
    `photo` MEDIUMBLOB NOT NULL,
    `color` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_detail_barang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barang` ADD CONSTRAINT `barang_to_kategori_fk` FOREIGN KEY (`id_kategori`) REFERENCES `kategori`(`id_kategori`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang` ADD CONSTRAINT `barang_to_brand_fk` FOREIGN KEY (`id_brand`) REFERENCES `brand`(`id_brand`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_barang` ADD CONSTRAINT `detailBarang_to_barang_fk` FOREIGN KEY (`id_barang`) REFERENCES `barang`(`id_barang`) ON DELETE RESTRICT ON UPDATE CASCADE;
