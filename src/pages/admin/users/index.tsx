// pages/admin/users/index.tsx
import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getSession } from 'next-auth/react'; // Untuk mendapatkan sesi pengguna
import prisma from '@/lib/db'; // Import Prisma Client
import { User as PrismaUser, Role } from '@prisma/client'; // Import tipe User dan Role dari Prisma
import { useRouter } from 'next/router'; // Import useRouter
import { ShoppingCart } from 'lucide-react'; // Import ikon keranjang

// Definisikan tipe untuk data pengguna yang akan ditampilkan
interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string; // Akan diformat sebagai string
  updatedAt: string; // Akan diformat sebagai string
}

// Definisikan tipe untuk props halaman
interface UserManagementPageProps {
  users: User[];
  error?: string; // Untuk menangani error atau pesan akses ditolak
  currentUserRole: Role; // Peran pengguna yang sedang login
  currentUserId: string; // ID pengguna yang sedang login
}

// getServerSideProps untuk mengambil data pengguna dan memeriksa otorisasi
export const getServerSideProps: GetServerSideProps<UserManagementPageProps> = async (context) => {
  const session = await getSession(context);

  // Periksa apakah pengguna terautentikasi dan memiliki peran ADMIN atau SUPER_ADMIN
  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
    return {
      redirect: {
        destination: '/auth/login?error=unauthorized', // Arahkan ke halaman login dengan pesan error
        permanent: false,
      },
    };
  }

  const currentUserRole = session.user.role as Role;
  const currentUserId = session.user.id as string;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // Urutkan berdasarkan tanggal pembuatan
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format data pengguna untuk frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      updatedAt: new Date(user.updatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
    }));

    return {
      props: {
        users: formattedUsers,
        currentUserRole, // Teruskan peran pengguna yang login
        currentUserId,   // Teruskan ID pengguna yang login
      },
    };
  } catch (error) {
    console.error('Error fetching users in getServerSideProps:', error);
    return {
      props: {
        users: [],
        error: 'Gagal memuat data pengguna. Silakan coba lagi nanti.',
        currentUserRole: currentUserRole, // Pastikan ini juga diteruskan saat ada error
        currentUserId: currentUserId,
      },
    };
  }
};

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, error, currentUserRole, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter(); // Inisialisasi useRouter

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (userId: string) => {
    router.push(`/admin/users/edit/${userId}`);
  };

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna ${userName || userId}?`)) {
      try {
        // Panggil API untuk menghapus pengguna
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          alert(`Pengguna ${userName || userId} berhasil dihapus.`);
          // Refresh halaman atau perbarui state untuk menghilangkan pengguna yang dihapus
          window.location.reload(); // Cara sederhana untuk refresh, bisa diganti dengan state management
        } else {
          const errorData = await res.json();
          alert(`Gagal menghapus pengguna: ${errorData.message || res.statusText}`);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Terjadi kesalahan saat menghapus pengguna.');
      }
    }
  };

  // Fungsi untuk menentukan apakah tombol aksi harus dinonaktifkan
  const isActionDisabled = (targetUserRole: Role, targetUserId: string) => {
    // Admin tidak bisa mengelola akun Super Admin
    if (currentUserRole === Role.ADMIN && targetUserRole === Role.SUPER_ADMIN) {
      return true;
    }
    // Pengguna tidak bisa menghapus akunnya sendiri (sudah ditangani di API, tapi bagus juga di UI)
    if (currentUserId === targetUserId) {
      return true;
    }
    // Super Admin bisa mengelola semua (tidak perlu batasan tambahan di sini)
    return false;
  };

  return (
    <>
      <Head>
        <title>MyEcom Admin - Kelola Pengguna</title>
        <meta name="description" content="Halaman admin untuk mengelola pengguna." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
        <div className="container mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300">Kelola Pengguna</h1>

          {error && (
            <div className="bg-red-800 text-white p-4 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Cari pengguna berdasarkan nama, email, atau peran..."
              className="w-full sm:w-2/3 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Hanya Super Admin yang bisa menambah pengguna baru */}
            {currentUserRole === Role.SUPER_ADMIN && (
              <Link href="/admin/users/add" className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out text-center">
                Tambah Pengguna Baru
              </Link>
            )}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">Tidak ada pengguna yang ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Nama
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Peran
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Dibuat Pada
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Diperbarui Pada
                    </th>
                    {/* Kolom baru untuk Keranjang */}
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Keranjang
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-50">
                        {user.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${user.role === Role.SUPER_ADMIN ? 'bg-purple-600 text-white' :
                            user.role === Role.ADMIN ? 'bg-blue-600 text-white' :
                            'bg-green-600 text-white'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.updatedAt}
                      </td>
                      {/* Sel baru untuk tombol Lihat Keranjang */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {/* Tombol Lihat Keranjang - Hanya muncul untuk CUSTOMER */}
                        {user.role === Role.CUSTOMER && (
                          <Link href={`/admin/users/${user.id}/cart`} className="text-blue-400 hover:text-blue-300 transition duration-150 inline-flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4" />
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Tombol Edit */}
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className={`mr-4 transition duration-150
                            ${isActionDisabled(user.role, user.id) ? 'text-gray-500 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
                          disabled={isActionDisabled(user.role, user.id)}
                        >
                          Edit
                        </button>
                        {/* Tombol Hapus */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className={`transition duration-150
                            ${isActionDisabled(user.role, user.id) ? 'text-gray-500 cursor-not-allowed' : 'text-red-500 hover:text-red-400'}`}
                          disabled={isActionDisabled(user.role, user.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
