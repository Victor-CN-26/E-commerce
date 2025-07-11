// pages/api/products.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Mengimpor instance Prisma Client
import { getServerSession } from 'next-auth'; // Untuk mendapatkan sesi di API Route
import { authOptions } from '@/lib/auth'; // Mengimpor authOptions Anda

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;
  const { id, slug } = query; // Ambil id atau slug dari query parameter

  switch (method) {
    case 'GET':
      try {
        if (id) {
          // Ambil satu produk berdasarkan ID
          const product = await prisma.product.findUnique({
            where: { id: String(id) },
            include: {
              category: true,
              supplier: true,
            },
          });
          if (!product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan.' });
          }
          // Parse imageUrls, sizes, dan sizeStocks dari string JSON menjadi array
          const parsedImageUrls = product.imageUrls ? JSON.parse(product.imageUrls) : [];
          const parsedSizes = product.sizes ? JSON.parse(product.sizes) : [];
          const parsedSizeStocks = product.sizeStocks ? JSON.parse(product.sizeStocks) : [];

          return res.status(200).json({ 
            ...product, 
            imageUrls: parsedImageUrls,
            sizes: parsedSizes,
            sizeStocks: parsedSizeStocks,
          });
        } else if (slug) {
          // Ambil satu produk berdasarkan SLUG
          const product = await prisma.product.findUnique({
            where: { slug: String(slug) },
            include: {
              category: true,
              supplier: true,
            },
          });
          if (!product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan.' });
          }
          // Parse imageUrls, sizes, dan sizeStocks dari string JSON menjadi array
          const parsedImageUrls = product.imageUrls ? JSON.parse(product.imageUrls) : [];
          const parsedSizes = product.sizes ? JSON.parse(product.sizes) : [];
          const parsedSizeStocks = product.sizeStocks ? JSON.parse(product.sizeStocks) : [];
          
          return res.status(200).json({ 
            ...product, 
            imageUrls: parsedImageUrls,
            sizes: parsedSizes,
            sizeStocks: parsedSizeStocks,
          });
        } else {
          // Ambil semua produk
          const products = await prisma.product.findMany({
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              category: {
                select: { id: true, name: true }, // Hanya ambil ID dan nama kategori
              },
              supplier: {
                select: { id: true, name: true }, // Hanya ambil ID dan nama supplier
              },
            },
          });
          // Parse imageUrls, sizes, dan sizeStocks untuk setiap produk
          const formattedProducts = products.map(product => ({
            ...product,
            imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : [],
            sizes: product.sizes ? JSON.parse(product.sizes) : [],
            sizeStocks: product.sizeStocks ? JSON.parse(product.sizeStocks) : [],
          }));
          return res.status(200).json(formattedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ message: 'Gagal mengambil produk.' });
      }

    case 'POST':
    case 'PUT':
    case 'DELETE':
      // Untuk metode POST, PUT, dan DELETE, periksa autentikasi dan peran
      const session = await getServerSession(req, res, authOptions);
      if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ message: 'Akses Ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.' });
      }

      // Lanjutkan dengan logika CRUD setelah otorisasi
      if (method === 'POST') {
        try {
          const { name, slug, description, price, stock, imageUrls, sizes, sizeStocks, categoryId, supplierId } = body;

          // Validasi input
          if (!name || !slug || !price || !stock || !categoryId) {
            return res.status(400).json({ message: 'Nama, slug, harga, stok, dan kategori wajib diisi.' });
          }
          if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return res.status(400).json({ message: 'Harga harus angka positif.' });
          }
          // Stok keseluruhan (stock) bisa diabaikan jika menggunakan sizeStocks
          // Namun, jika Anda ingin mempertahankan, pastikan validasinya.
          // Untuk saat ini, kita akan fokus pada sizeStocks sebagai sumber kebenaran stok.
          // if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
          //   return res.status(400).json({ message: 'Stok harus angka non-negatif.' });
          // }
          if (typeof categoryId !== 'string' || categoryId.trim() === '') {
            return res.status(400).json({ message: 'Kategori wajib diisi dan harus valid.' });
          }
          if (!Array.isArray(sizes) || sizes.some(s => typeof s !== 'string' || s.trim() === '')) {
            return res.status(400).json({ message: 'Ukuran harus berupa array string non-kosong.' });
          }
          if (!Array.isArray(sizeStocks) || sizeStocks.some(s => isNaN(parseInt(s)) || parseInt(s) < 0)) {
            return res.status(400).json({ message: 'Stok ukuran harus berupa array angka non-negatif.' });
          }
          if (sizes.length !== sizeStocks.length) {
            return res.status(400).json({ message: 'Jumlah ukuran dan stok ukuran harus sama.' });
          }

          // Cek apakah slug sudah ada
          const existingProduct = await prisma.product.findUnique({
            where: { slug: slug },
          });
          if (existingProduct) {
            return res.status(409).json({ message: 'Slug produk sudah ada. Mohon pilih slug lain.' });
          }

          // Stringify imageUrls, sizes, dan sizeStocks array menjadi JSON string
          const serializedImageUrls = JSON.stringify(imageUrls || []);
          const serializedSizes = JSON.stringify(sizes || []);
          const serializedSizeStocks = JSON.stringify(sizeStocks || []);


          const newProduct = await prisma.product.create({
            data: {
              name,
              slug,
              description,
              price: parseFloat(price),
              stock: parseInt(stock), // Tetap simpan stok total jika diperlukan, atau hitung dari sizeStocks
              imageUrls: serializedImageUrls, // Simpan sebagai JSON string
              sizes: serializedSizes, // Simpan sebagai JSON string
              sizeStocks: serializedSizeStocks, // Simpan sebagai JSON string
              categoryId,
              supplierId: supplierId === '' ? null : supplierId,
            },
          });
          return res.status(201).json({ message: 'Produk berhasil dibuat!', product: newProduct });
        } catch (error) {
          console.error('Error creating product:', error);
          return res.status(500).json({ message: 'Gagal membuat produk.' });
        }
      } else if (method === 'PUT') {
        try {
          const { id: productId } = query;
          const { name, slug, description, price, stock, imageUrls, sizes, sizeStocks, categoryId, supplierId } = body;

          if (!productId) {
            return res.status(400).json({ message: 'ID produk wajib diisi untuk pembaruan.' });
          }
          if (!name || !slug || !price || !stock || !categoryId) {
            return res.status(400).json({ message: 'Nama, slug, harga, stok, dan kategori wajib diisi.' });
          }
          if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return res.status(400).json({ message: 'Harga harus angka positif.' });
          }
          // if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
          //   return res.status(400).json({ message: 'Stok harus angka non-negatif.' });
          // }
          if (typeof categoryId !== 'string' || categoryId.trim() === '') {
            return res.status(400).json({ message: 'Kategori wajib diisi dan harus valid.' });
          }
          if (!Array.isArray(sizes) || sizes.some(s => typeof s !== 'string' || s.trim() === '')) {
            return res.status(400).json({ message: 'Ukuran harus berupa array string non-kosong.' });
          }
          if (!Array.isArray(sizeStocks) || sizeStocks.some(s => isNaN(parseInt(s)) || parseInt(s) < 0)) {
            return res.status(400).json({ message: 'Stok ukuran harus berupa array angka non-negatif.' });
          }
          if (sizes.length !== sizeStocks.length) {
            return res.status(400).json({ message: 'Jumlah ukuran dan stok ukuran harus sama.' });
          }

          // Cek apakah slug sudah ada untuk produk lain
          const existingProductWithSlug = await prisma.product.findFirst({
            where: {
              slug: slug,
              NOT: { id: String(productId) },
            },
          });
          if (existingProductWithSlug) {
            return res.status(409).json({ message: 'Slug produk sudah ada untuk produk lain. Mohon pilih slug lain.' });
          }

          // Stringify imageUrls, sizes, dan sizeStocks array menjadi JSON string
          const serializedImageUrls = JSON.stringify(imageUrls || []);
          const serializedSizes = JSON.stringify(sizes || []);
          const serializedSizeStocks = JSON.stringify(sizeStocks || []);

          const updatedProduct = await prisma.product.update({
            where: { id: String(productId) },
            data: {
              name,
              slug,
              description,
              price: parseFloat(price),
              stock: parseInt(stock), // Tetap simpan stok total jika diperlukan
              imageUrls: serializedImageUrls, // Simpan sebagai JSON string
              sizes: serializedSizes, // Simpan sebagai JSON string
              sizeStocks: serializedSizeStocks, // Simpan sebagai JSON string
              categoryId,
              supplierId: supplierId === '' ? null : supplierId,
            },
          });
          return res.status(200).json({ message: 'Produk berhasil diperbarui!', product: updatedProduct });
        } catch (error) {
          console.error('Error updating product:', error);
          return res.status(500).json({ message: 'Gagal memperbarui produk.' });
        }
      } else if (method === 'DELETE') {
        try {
          const { id: productId } = query;

          if (!productId) {
            return res.status(400).json({ message: 'ID produk wajib diisi untuk penghapusan.' });
          }

          await prisma.product.delete({
            where: { id: String(productId) },
          });
          return res.status(200).json({ message: 'Produk berhasil dihapus!' });
        } catch (error) {
          console.error('Error deleting product:', error);
          return res.status(500).json({ message: 'Gagal menghapus produk.' });
        }
      }
      break; // Penting: break setelah semua case POST/PUT/DELETE

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
