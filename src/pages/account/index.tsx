// pages/account/index.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Untuk mendapatkan informasi sesi pengguna
import { Loader2, User, Mail, Briefcase, Calendar } from 'lucide-react'; // Ikon

export default function AccountPage() {
  const { data: session, status } = useSession(); // Ambil sesi pengguna

  // Tampilkan loading state jika sesi masih dimuat
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-50">
        <Loader2 className="animate-spin w-10 h-10 mr-3 text-amber-500" />
        <p className="text-xl">Memuat profil...</p>
      </div>
    );
  }

  // Jika tidak ada sesi (pengguna belum login), meskipun middleware seharusnya sudah menangani ini
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-4">Akses Ditolak</h1>
        <p className="text-lg text-center">Anda perlu login untuk melihat halaman ini.</p>
        <Link href="/auth/login" className="mt-6 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200">
          Pergi ke Login
        </Link>
      </div>
    );
  }

  // Pengguna sudah login, tampilkan profil
  return (
    <>
      <Head>
        <title>Profil Saya - MyEcom</title>
        <meta name="description" content="Lihat dan kelola informasi profil Anda." />
      </Head>

      <div className="min-h-screen bg-gray-950 py-16 px-4 text-gray-50">
        <div className="container mx-auto bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-amber-300 mb-8 text-center">Profil Saya</h1>

          <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-amber-300 text-5xl font-bold border-2 border-amber-500">
                {session.user?.name ? session.user.name[0].toUpperCase() : session.user?.email ? session.user.email[0].toUpperCase() : '?'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-6 h-6 mr-3 text-amber-400" />
                <div>
                  <p className="text-sm text-gray-400">Nama:</p>
                  <p className="text-lg font-semibold text-gray-50">{session.user?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="w-6 h-6 mr-3 text-amber-400" />
                <div>
                  <p className="text-sm text-gray-400">Email:</p>
                  <p className="text-lg font-semibold text-gray-50">{session.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Briefcase className="w-6 h-6 mr-3 text-amber-400" />
                <div>
                  <p className="text-sm text-gray-400">Peran:</p>
                  <p className="text-lg font-semibold text-gray-50">{session.user?.role}</p>
                </div>
              </div>
              {/* Anda bisa menambahkan informasi lain dari sesi atau dari database di sini */}
              {/* Contoh: Tanggal bergabung (jika ada di sesi atau bisa diambil dari database) */}
              {session.user?.createdAt && (
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-amber-400" />
                  <div>
                    <p className="text-sm text-gray-400">Bergabung Sejak:</p>
                    <p className="text-lg font-semibold text-gray-50">
                      {new Date(session.user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              {/* Tombol untuk mengedit profil (jika ada API-nya nanti) */}
              {/* <Link href="/account/edit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mr-4">
                Edit Profil
              </Link> */}
              <Link href="/" className="bg-gray-700 hover:bg-gray-600 text-gray-50 font-bold py-2 px-4 rounded-lg transition duration-200">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (opsional, bisa diimpor dari komponen terpisah) */}
      <footer className="bg-gray-950 text-white py-8 px-4 text-center border-t border-gray-800">
        <div className="container mx-auto">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} MyEcom. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
