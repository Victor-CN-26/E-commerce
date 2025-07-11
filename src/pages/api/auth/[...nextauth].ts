// pages/api/auth/[...nextauth].ts

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/db'; // Mengimpor instance Prisma Client
import bcrypt from 'bcryptjs'; // Untuk membandingkan password

// Konfigurasi NextAuth.js v4
export const authOptions = {
  // Menggunakan PrismaAdapter untuk menyimpan sesi di database
  adapter: PrismaAdapter(prisma),
  
  // Konfigurasi penyedia autentikasi
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // Kredensial yang diharapkan dari form login
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        // Logika autentikasi kustom Anda
        if (!credentials?.email || !credentials?.password) {
          return null; // Mengembalikan null jika kredensial tidak lengkap
        }

        // Cari pengguna di database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Jika pengguna tidak ditemukan atau password tidak cocok
        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          return null; // Mengembalikan null untuk menandakan kegagalan autentikasi
        }

        // Jika autentikasi berhasil, kembalikan objek user
        // Objek ini akan disimpan di sesi. Jangan sertakan password.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // Penting untuk otorisasi
        };
      },
    }),
  ],

  // Konfigurasi sesi
  session: {
    strategy: 'jwt', // Menggunakan JSON Web Tokens untuk sesi
    maxAge: 30 * 24 * 60 * 60, // Sesi berlaku 30 hari
  },

  // Konfigurasi JWT (JSON Web Token)
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET, // Secret untuk menandatangani JWT
  },

  // Konfigurasi halaman kustom (opsional, tapi disarankan)
  pages: {
    signIn: '/auth/login', // Halaman login kustom Anda (akan kita buat nanti)
    // error: '/auth/error', // Halaman error kustom
    // signOut: '/auth/signout', // Halaman sign out kustom
  },

  // Konfigurasi callback
  callbacks: {
    // Callback ini dijalankan saat JWT dibuat/diperbarui
    async jwt({ token, user }) {
      if (user) {
        // Tambahkan informasi user ke token JWT
        token.id = user.id;
        token.role = user.role; // Tambahkan role ke token
      }
      return token;
    },
    // Callback ini dijalankan saat sesi diakses oleh client
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // Tambahkan role ke sesi
      }
      return session;
    },
  },

  // Secret untuk menandatangani cookie sesi
  secret: process.env.NEXTAUTH_SECRET,
  
  // Debugging di lingkungan pengembangan
  debug: process.env.NODE_ENV === 'development',
};

// Ekspor handler GET dan POST
export default NextAuth(authOptions);
