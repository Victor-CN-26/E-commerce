// pages/api/cart.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Sesuaikan path ke authOptions Anda
import prisma from '@/lib/db'; // Sesuaikan path ke Prisma Client Anda

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Jika tidak ada sesi, pengguna tidak terautentikasi
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: Not logged in.' });
  }

  const userId = session.user.id;

  switch (req.method) {
    case 'GET':
      try {
        // Ambil semua item keranjang untuk pengguna yang login
        const cartItems = await prisma.cartItem.findMany({
          where: { userId: userId },
          include: {
            product: { // Sertakan data produk terkait
              select: {
                name: true,
                price: true, // Ambil harga produk dari model Product
                imageUrls: true, // Ambil imageUrls dari model Product
                slug: true, // Ambil slug untuk link detail
              },
            },
          },
        });

        // Format data untuk respons, termasuk harga dan gambar
        const formattedCartItems = cartItems.map(item => {
          let imageUrl = 'https://placehold.co/96x96/E0E0E0/333333?text=No+Img';
          try {
            const parsedImageUrls = JSON.parse(item.product.imageUrls) as string[];
            if (parsedImageUrls && parsedImageUrls.length > 0) {
              imageUrl = parsedImageUrls[0];
            }
          } catch (e) {
            console.error(`Error parsing imageUrls for product ${item.productId}:`, e);
          }

          return {
            id: item.id, // ID item keranjang (dari database)
            productId: item.productId,
            name: item.product.name,
            price: item.product.price.toNumber(), // Konversi Decimal ke number
            imageUrl: imageUrl,
            quantity: item.quantity,
            // selectedSize: item.selectedSize, // Hanya jika Anda menambahkan field ini ke CartItem
            slug: item.product.slug,
          };
        });

        return res.status(200).json(formattedCartItems);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        return res.status(500).json({ message: 'Failed to fetch cart items.' });
      }

    case 'POST':
      // Menambahkan atau memperbarui item di keranjang
      const { productId, quantity, selectedSize } = req.body;

      if (!productId || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid request: productId and quantity are required.' });
      }

      try {
        // Cek apakah produk sudah ada di keranjang pengguna
        // Jika Anda memiliki `selectedSize` di CartItem, tambahkan ke `where`
        const existingCartItem = await prisma.cartItem.findUnique({
          where: {
            userId_productId: { // Menggunakan unique constraint yang sudah ada
              userId: userId,
              productId: productId,
            },
            // Jika ada selectedSize di CartItem, tambahkan di sini:
            // selectedSize: selectedSize || null,
          },
        });

        if (existingCartItem) {
          // Perbarui kuantitas jika item sudah ada
          const updatedCartItem = await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: existingCartItem.quantity + quantity },
          });
          return res.status(200).json(updatedCartItem);
        } else {
          // Tambahkan item baru ke keranjang
          // Ambil harga produk dari database saat ditambahkan
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { price: true },
          });

          if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
          }

          const newCartItem = await prisma.cartItem.create({
            data: {
              userId: userId,
              productId: productId,
              quantity: quantity,
              // priceAtAddToCart: product.price, // Hanya jika Anda menambahkan field ini
              // selectedSize: selectedSize || null, // Hanya jika Anda menambahkan field ini
            },
          });
          return res.status(201).json(newCartItem);
        }
      } catch (error) {
        console.error('Error adding/updating cart item:', error);
        return res.status(500).json({ message: 'Failed to add/update cart item.' });
      }

    case 'PUT':
      // Memperbarui kuantitas item tertentu
      const { itemId, newQuantity } = req.body;

      if (!itemId || typeof newQuantity !== 'number' || newQuantity <= 0) {
        return res.status(400).json({ message: 'Invalid request: itemId and newQuantity are required.' });
      }

      try {
        const updatedItem = await prisma.cartItem.update({
          where: {
            id: itemId,
            userId: userId, // Pastikan pengguna hanya bisa memperbarui item mereka sendiri
          },
          data: { quantity: newQuantity },
        });
        return res.status(200).json(updatedItem);
      } catch (error) {
        console.error('Error updating cart item quantity:', error);
        return res.status(500).json({ message: 'Failed to update cart item quantity.' });
      }

    case 'DELETE':
      // Menghapus item dari keranjang atau mengosongkan seluruh keranjang
      const { itemId: deleteItemId } = req.query; // Untuk menghapus item tunggal
      const { clearAll } = req.query; // Untuk mengosongkan seluruh keranjang

      try {
        if (deleteItemId) {
          // Hapus item tunggal
          await prisma.cartItem.delete({
            where: {
              id: deleteItemId as string,
              userId: userId, // Pastikan pengguna hanya bisa menghapus item mereka sendiri
            },
          });
          return res.status(200).json({ message: 'Cart item deleted successfully.' });
        } else if (clearAll === 'true') {
          // Kosongkan seluruh keranjang
          await prisma.cartItem.deleteMany({
            where: { userId: userId },
          });
          return res.status(200).json({ message: 'Cart cleared successfully.' });
        } else {
          return res.status(400).json({ message: 'Invalid request: itemId or clearAll=true is required for DELETE.' });
        }
      } catch (error) {
        console.error('Error deleting cart item(s):', error);
        return res.status(500).json({ message: 'Failed to delete cart item(s).' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
