// pages/_app.tsx
import '@/styles/globals.css'; // Impor file CSS global Anda (misalnya Tailwind CSS)
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react'; // Impor SessionProvider dari NextAuth.js
import Header from '@/components/layout/Header'; // Impor komponen Header Anda
import { CartProvider } from '@/context/CartContext'; // Impor CartProvider yang baru dibuat

// Custom App Component
// Ini membungkus semua halaman di aplikasi Anda
export default function App({ Component, pageProps }: AppProps) {
  return (
    // Bungkus seluruh aplikasi dengan SessionProvider
    // Ini memungkinkan semua komponen di bawahnya mengakses sesi pengguna
    <SessionProvider session={pageProps.session}>
      {/* Bungkus juga dengan CartProvider agar fungsionalitas keranjang tersedia */}
      <CartProvider>
        {/* Header akan muncul di semua halaman */}
        <Header />
        {/* Komponen halaman yang sedang aktif akan dirender di sini */}
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
      </CartProvider>
    </SessionProvider>
  );
}
