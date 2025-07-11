    // src/lib/db.ts

    import { PrismaClient } from '@prisma/client';

    // Deklarasi global untuk PrismaClient untuk menghindari inisialisasi berulang di pengembangan
    // Ini adalah praktik terbaik untuk Next.js dengan Prisma
    declare global {
      var prisma: PrismaClient | undefined;
    }

    // Menggunakan instance PrismaClient yang ada atau membuat yang baru
    // Ini mencegah pembuatan banyak instance PrismaClient saat Fast Refresh aktif di pengembangan
    const prisma = global.prisma || new PrismaClient();

    // Di lingkungan produksi, pastikan instance PrismaClient tidak disimpan secara global
    if (process.env.NODE_ENV === 'production') global.prisma = prisma;

    export default prisma;
    