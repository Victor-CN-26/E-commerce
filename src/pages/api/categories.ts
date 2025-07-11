// pages/api/categories.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Mengimpor instance Prisma Client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        // Ambil semua kategori, diurutkan berdasarkan nama, sertakan imageUrl
        // Perubahan di sini: Menggunakan prisma.category (singular)
        const categories = await prisma.category.findMany({
          orderBy: {
            name: 'asc', // Urutkan berdasarkan nama secara ascending
          },
          select: { // Pilih field yang ingin dikembalikan, termasuk imageUrl
            id: true,
            name: true,
            slug: true,
            description: true,
            imageUrl: true, // Sertakan imageUrl
            createdAt: true,
            updatedAt: true,
          }
        });
        return res.status(200).json(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'Failed to fetch categories.' });
      }

    case 'POST':
      try {
        const { name, slug, description, imageUrl } = req.body; // Tambahkan imageUrl

        // Validasi input
        if (!name || !slug) {
          return res.status(400).json({ message: 'Nama dan Slug kategori wajib diisi.' });
        }

        // Pastikan slug unik
        // Perubahan di sini: Menggunakan prisma.category (singular)
        const existingCategory = await prisma.category.findUnique({
          where: { slug: slug },
        });

        if (existingCategory) {
          return res.status(409).json({ message: 'Slug kategori sudah ada. Mohon pilih slug lain.' });
        }

        // Perubahan di sini: Menggunakan prisma.category (singular)
        const newCategory = await prisma.category.create({
          data: {
            name,
            slug,
            description,
            imageUrl, // Simpan imageUrl
          },
        });
        return res.status(201).json({ message: 'Kategori berhasil dibuat!', category: newCategory });
      } catch (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ message: 'Gagal membuat kategori.' });
      }

    case 'PUT':
      try {
        const { id } = req.query; // ID kategori dari query parameter
        const { name, slug, description, imageUrl } = req.body; // Tambahkan imageUrl

        if (!id) {
          return res.status(400).json({ message: 'ID kategori wajib diisi untuk pembaruan.' });
        }
        if (!name || !slug) {
          return res.status(400).json({ message: 'Nama dan Slug kategori wajib diisi.' });
        }

        // Pastikan slug unik untuk kategori lain (kecuali kategori yang sedang diedit)
        // Perubahan di sini: Menggunakan prisma.category (singular)
        const existingCategoryWithSlug = await prisma.category.findFirst({
          where: {
            slug: slug,
            NOT: { id: String(id) }, // Kecualikan kategori yang sedang diedit
          },
        });

        if (existingCategoryWithSlug) {
          return res.status(409).json({ message: 'Slug kategori sudah ada untuk kategori lain. Mohon pilih slug lain.' });
        }

        // Perubahan di sini: Menggunakan prisma.category (singular)
        const updatedCategory = await prisma.category.update({
          where: { id: String(id) },
          data: {
            name,
            slug,
            description,
            imageUrl, // Perbarui imageUrl
          },
        });
        return res.status(200).json({ message: 'Kategori berhasil diperbarui!', category: updatedCategory });
      } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ message: 'Gagal memperbarui kategori.' });
      }

    case 'DELETE':
      try {
        const { id } = req.query; // ID kategori dari query parameter

        if (!id) {
          return res.status(400).json({ message: 'ID kategori wajib diisi untuk penghapusan.' });
        }

        // Perubahan di sini: Menggunakan prisma.category (singular)
        await prisma.category.delete({
          where: { id: String(id) },
        });
        return res.status(200).json({ message: 'Kategori berhasil dihapus!' });
      } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ message: 'Gagal menghapus kategori.' });
      }

    default:
      // Metode HTTP tidak diizinkan
      return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
  }
}
