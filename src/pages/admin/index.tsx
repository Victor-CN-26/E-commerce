// pages/admin/index.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Untuk mendapatkan informasi sesi pengguna
import { Loader2, Sliders, LayoutDashboard, Package, Users, ShoppingBag, BookOpen, Image as ImageIcon, List, Settings } from 'lucide-react'; // Import ikon yang relevan

export default function AdminDashboardPage() {
  const { data: session, status } = useSession(); // Ambil sesi pengguna

  // Tampilkan loading state jika sesi masih dimuat
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-50">
        <Loader2 className="animate-spin w-10 h-10 mr-3 text-amber-500" />
        <p className="text-xl">Memuat dashboard admin...</p>
      </div>
    );
  }

  // Jika tidak ada sesi atau peran tidak sesuai (meskipun middleware seharusnya sudah menangani ini)
  // Ini sebagai fallback di sisi client
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-4">Akses Ditolak</h1>
        <p className="text-lg text-center">Anda tidak memiliki izin untuk melihat halaman ini.</p>
        <Link href="/auth/login" className="mt-6 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200">
          Pergi ke Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Admin - MyEcom</title>
        <meta name="description" content="Dashboard Admin untuk Platform E-commerce MyEcom" />
      </Head>

      <div className="min-h-screen bg-gray-950 p-8 text-gray-50"> {/* Background gelap */}
        <div className="container mx-auto bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-amber-300 mb-6">Selamat Datang di Dashboard Admin, {session.user?.name || session.user?.email}!</h1>
          <p className="text-gray-300 mb-8">Kelola konten dan operasi toko e-commerce Anda di sini.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card untuk Hero Slides */}
            <Link href="/admin/hero-slides" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <ImageIcon className="w-8 h-8 text-amber-400 mr-3" />
                <h2 className="text-xl font-semibold">Kelola Hero Slides</h2>
              </div>
              <p className="text-sm text-gray-300">Tambah, edit, atau hapus banner hero di halaman utama.</p>
            </Link>

            {/* Card untuk Kategori Produk */}
            <Link href="/admin/categories" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <List className="w-8 h-8 text-green-400 mr-3" />
                <h2 className="text-xl font-semibold">Kelola Kategori</h2>
              </div>
              <p className="text-sm text-gray-300">Atur dan perbarui kategori produk.</p>
            </Link>

            {/* Card untuk Postingan Blog */}
            <Link href="/admin/blog-posts" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <BookOpen className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-xl font-semibold">Kelola Postingan Blog</h2>
              </div>
              <p className="text-sm text-gray-300">Buat, publikasikan, dan kelola konten blog Anda.</p>
            </Link>

            {/* Card untuk Produk (Placeholder) */}
            <Link href="/admin/products" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <Package className="w-8 h-8 text-yellow-400 mr-3" />
                <h2 className="text-xl font-semibold">Kelola Produk</h2>
              </div>
              <p className="text-sm text-gray-300">Tambah, edit, dan kelola inventaris produk Anda.</p>
            </Link>

            {/* Card untuk Pengguna (Placeholder) */}
            <Link href="/admin/users" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-red-400 mr-3" />
                <h2 className="text-xl font-semibold">Kelola Pengguna</h2>
              </div>
              <p className="text-sm text-gray-300">Lihat dan kelola akun serta peran pengguna.</p>
            </Link>

            {/* Card untuk Pesanan (Placeholder) */}
            <Link href="/admin/orders" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <ShoppingBag className="w-8 h-8 text-indigo-400 mr-3" />
                <h2 className="text-xl font-semibold">Kelola Pesanan</h2>
              </div>
              <p className="text-sm text-gray-300">Lacak dan proses pesanan pelanggan.</p>
            </Link>

            {/* Card untuk Pengaturan (Opsional, jika ada pengaturan umum) */}
            <Link href="/admin/settings" className="block bg-gray-800 text-white p-6 rounded-lg shadow-xl hover:bg-gray-700 transition duration-200 transform hover:scale-105 border border-gray-700">
              <div className="flex items-center mb-4">
                <Settings className="w-8 h-8 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold">Pengaturan Sistem</h2>
              </div>
              <p className="text-sm text-gray-300">Konfigurasi pengaturan umum aplikasi.</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
