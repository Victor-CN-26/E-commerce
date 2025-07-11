// pages/api/auth/register.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Mengimpor instance Prisma Client yang sudah kita buat
import bcrypt from 'bcryptjs'; // Library untuk hashing password

// Handler untuk permintaan API POST
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Pastikan metode permintaan adalah POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' }); // Hanya izinkan metode POST
  }

  try {
    // 1. Mengambil data dari body permintaan
    const { email, password, name } = req.body;

    // 2. Validasi Input
    // Memastikan semua field yang diperlukan ada
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required.' }); // Bad Request
    }

    // Memastikan format email valid (validasi sederhana)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Memastikan password memiliki panjang minimal (contoh: 6 karakter)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 3. Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' }); // Conflict
    }

    // 4. Hashing Password
    // Menggunakan bcrypt untuk mengenkripsi password sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Membuat Pengguna Baru di Database
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        // Role default sudah CUSTOMER di schema.prisma, jadi tidak perlu diset di sini
      },
      select: { // Hanya mengembalikan field yang aman (tanpa password)
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // 6. Mengirimkan respons sukses
    return res.status(201).json({ message: 'User registered successfully!', user: newUser }); // Created

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'An error occurred during registration.' }); // Internal Server Error
  }
}
