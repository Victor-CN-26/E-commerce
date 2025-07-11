// pages/api/admin/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Sesuaikan path ke authOptions Anda
import prisma from '@/lib/db'; // Sesuaikan path ke Prisma Client Anda
import { Role } from '@prisma/client'; // Import Role dari Prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Periksa otorisasi dasar: hanya ADMIN atau SUPER_ADMIN yang bisa mengakses endpoint ini
  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
    // Pastikan respons selalu JSON
    return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
  }

  const { id } = req.query; // Ambil ID pengguna dari URL parameter
  const currentUserId = session.user.id as string;
  const currentUserRole = session.user.role as Role;

  if (!id || typeof id !== 'string') {
    // Pastikan respons selalu JSON
    return res.status(400).json({ message: 'Invalid user ID provided.' });
  }

  // Ambil informasi pengguna target yang akan diedit/dihapus
  const targetUser = await prisma.user.findUnique({
    where: { id: id },
    select: { id: true, role: true }, // Hanya ambil ID dan peran untuk otorisasi
  });

  if (!targetUser) {
    // Pastikan respons selalu JSON
    return res.status(404).json({ message: 'User not found.' });
  }

  // Aturan otorisasi umum untuk operasi pada pengguna lain:
  // 1. Pengguna tidak bisa mengelola akunnya sendiri melalui API ini (kecuali jika ada endpoint profil terpisah)
  if (currentUserId === targetUser.id) {
    // Admin/Superadmin bisa mengedit profilnya sendiri melalui halaman profil, bukan melalui API admin ini
    // Pastikan respons selalu JSON
    return res.status(403).json({ message: 'Forbidden: You cannot manage your own user account via this admin API. Use your profile page instead.' });
  }

  // 2. Admin tidak bisa mengelola Super Admin
  if (currentUserRole === Role.ADMIN && targetUser.role === Role.SUPER_ADMIN) {
    // Pastikan respons selalu JSON
    return res.status(403).json({ message: 'Forbidden: Admins cannot manage Super Admin accounts.' });
  }

  // 3. Admin tidak bisa mengelola Admin lain (hanya Super Admin yang bisa mengelola Admin)
  if (currentUserRole === Role.ADMIN && targetUser.role === Role.ADMIN) {
    // Pastikan respons selalu JSON
    return res.status(403).json({ message: 'Forbidden: Admins cannot manage other Admin accounts.' });
  }


  switch (req.method) {
    case 'PUT':
      // Memperbarui data pengguna
      const { name, email, role } = req.body; // Ambil data dari body request

      // Validasi input dasar
      if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required.' });
      }

      // Validasi peran yang dikirim: Pastikan peran yang dikirim adalah salah satu dari enum Role
      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided.' });
      }

      // Aturan otorisasi spesifik untuk perubahan peran:
      // Hanya Super Admin yang bisa mengubah peran menjadi ADMIN atau SUPER_ADMIN
      if (currentUserRole === Role.ADMIN && (role === Role.ADMIN || role === Role.SUPER_ADMIN)) {
        // Admin mencoba mengubah peran menjadi Admin atau Super Admin
        return res.status(403).json({ message: 'Forbidden: Admins cannot assign Admin or Super Admin roles.' });
      }
      // Hanya Super Admin yang bisa mengubah peran Super Admin
      if (targetUser.role === Role.SUPER_ADMIN && currentUserRole !== Role.SUPER_ADMIN) {
          return res.status(403).json({ message: 'Forbidden: Only Super Admins can modify Super Admin accounts.' });
      }


      try {
        const updatedUser = await prisma.user.update({
          where: { id: id },
          data: {
            name: name,
            email: email,
            role: role,
            // Tambahkan field lain yang bisa diedit di sini
          },
        });
        return res.status(200).json(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        // Tangani error email duplikat
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
          return res.status(409).json({ message: 'Email already exists.' });
        }
        return res.status(500).json({ message: 'Failed to update user.' });
      }

    case 'DELETE':
      // Menghapus pengguna
      try {
        // Logika otorisasi untuk DELETE sudah ada di atas (sebelum switch)
        await prisma.user.delete({
          where: { id: id },
        });
        return res.status(200).json({ message: 'User deleted successfully.' });
      } catch (error) {
        console.error('Error deleting user:', error);
        if (error instanceof Error && 'code' in error && error.code === 'P2025') {
          return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(500).json({ message: 'Failed to delete user.' });
      }

    default:
      // Pastikan respons untuk metode yang tidak diizinkan juga JSON
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` }); // Mengubah ini
  }
}
