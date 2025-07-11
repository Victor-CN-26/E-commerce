// pages/api/admin/carts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Sesuaikan path ke authOptions Anda
import prisma from '@/lib/db'; // Sesuaikan path ke Prisma Client Anda
import { Role } from '@prisma/client'; // Import Role dari Prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // --- DEBUGGING LOGS ---
  console.log('--- API /api/admin/carts Request ---');
  console.log('Session:', session);
  if (session?.user) {
    console.log('Session User ID:', session.user.id);
    console.log('Session User Role:', session.user.role);
  }
  console.log('------------------------------------');
  // --- END DEBUGGING LOGS ---

  // Periksa otorisasi: hanya ADMIN atau SUPER_ADMIN yang bisa mengakses endpoint ini
  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
    return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
  }

  // Hanya izinkan metode GET untuk melihat keranjang
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { userId } = req.query; // Ambil userId dari query parameter (opsional)

  try {
    // Ambil item keranjang dari database
    // Jika userId disediakan, filter berdasarkan userId tersebut
    const cartItems = await prisma.cartItem.findMany({
      where: userId ? { userId: String(userId) } : {}, // Filter berdasarkan userId jika ada
      orderBy: { createdAt: 'desc' }, // Urutkan berdasarkan tanggal penambahan terbaru
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrls: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Format data untuk respons
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
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.price.toNumber(), // Konversi Decimal ke number
        productImageUrl: imageUrl,
        productSlug: item.product.slug,
        quantity: item.quantity,
        selectedSize: item.selectedSize, // Sertakan selectedSize
        userId: item.userId,
        userName: item.user?.name || 'N/A',
        userEmail: item.user?.email || 'N/A',
        addedAt: item.createdAt.toISOString(), // Format tanggal ke ISO string
      };
    });

    return res.status(200).json(formattedCartItems);
  } catch (error) {
    console.error('Error fetching cart items for admin:', error);
    return res.status(500).json({ message: 'Failed to fetch cart data.' });
  }
}
