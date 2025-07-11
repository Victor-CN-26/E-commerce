// pages/admin/users/[id]/cart.tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import { Role } from '@prisma/client'; // Import Role dari Prisma

// Definisikan tipe untuk item keranjang yang akan diambil dari API
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  productSlug: string;
  quantity: number;
  selectedSize?: string;
  userId: string; // Ini adalah ID pengguna yang memiliki keranjang ini
  userName: string;
  userEmail: string;
  addedAt: string;
}

// Definisikan tipe untuk props halaman
interface UserCartDetailPageProps {
  userId: string; // Menggunakan 'userId' di sini untuk kejelasan, tapi diambil dari 'id' slug
  userName: string;
  userEmail: string;
  cartItems: CartItem[];
  error?: string;
}

// getServerSideProps untuk mengambil data keranjang pengguna dan memeriksa otorisasi
export const getServerSideProps: GetServerSideProps<UserCartDetailPageProps> = async (context) => {
  const session = await getSession(context);
  const { id } = context.query;

  // Periksa otorisasi: hanya ADMIN atau SUPER_ADMIN yang bisa mengakses halaman ini
  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
    return {
      redirect: {
        destination: '/auth/login?error=unauthorized',
        permanent: false,
      },
    };
  }

  // Pastikan id ada dan bertipe string
  if (!id || typeof id !== 'string') {
    return {
      props: {
        userId: '',
        userName: 'N/A',
        userEmail: 'N/A',
        cartItems: [],
        error: 'Invalid User ID provided in URL.',
      },
    };
  }

  try {
    // Panggil API untuk mendapatkan item keranjang pengguna tertentu
    // Teruskan cookie dari request asli ke request API internal
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/carts?userId=${id}`, {
      headers: {
        Cookie: context.req.headers.cookie || '', // Teruskan cookie dari request asli
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('API Error:', errorData);
      return {
        props: {
          userId: id, // Teruskan id yang valid
          userName: 'N/A',
          userEmail: 'N/A',
          cartItems: [],
          error: errorData.message || 'Failed to fetch user cart data.',
        },
      };
    }

    const cartItems: CartItem[] = await res.json();

    // Ambil nama dan email pengguna dari item keranjang pertama (jika ada)
    // atau jika tidak ada item, bisa ambil dari database jika Anda punya cara lain
    // Untuk saat ini, kita asumsikan jika ada item, informasi user ada di sana.
    const userName = cartItems.length > 0 ? cartItems[0].userName : 'Unknown User';
    const userEmail = cartItems.length > 0 ? cartItems[0].userEmail : 'unknown@example.com';

    return {
      props: {
        userId: id, // Teruskan id yang valid
        userName: userName,
        userEmail: userEmail,
        cartItems: cartItems,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps for user cart:', error);
    return {
      props: {
        userId: id, // Teruskan id yang valid
        userName: 'N/A',
        userEmail: 'N/A',
        cartItems: [],
        error: 'An unexpected error occurred while fetching cart data.',
      },
    };
  }
};

// Komponen utama halaman
const UserCartDetailPage: React.FC<UserCartDetailPageProps> = ({ userId, userName, userEmail, cartItems, error }) => {
  const router = useRouter();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Error Loading Cart</h1>
        <p className="text-lg text-gray-400 mb-8">{error}</p>
        <Link href="/admin/users" className="bg-amber-500 text-gray-900 hover:bg-amber-400 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
          Back to User Management
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>MyEcom Admin - Cart for {userName}</title>
        <meta name="description" content={`View cart details for user ${userName}`} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
        <div className="container mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold mb-4 text-center text-amber-300">
            Shopping Cart for <span className="text-indigo-400">{userName}</span>
          </h1>
          <p className="text-center text-gray-400 mb-8">({userEmail})</p>

          <div className="mb-6">
            <Link href="/admin/users" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition duration-150">
              &larr; Back to User Management
            </Link>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">This user's cart is empty.</p>
              <p className="text-gray-500 mt-2">No items found in the shopping cart.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Added At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {cartItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-700 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-50">
                        <div className="flex items-center">
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-12 h-12 rounded-md object-cover mr-3"
                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/48x48/E0E0E0/333333?text=X')}
                          />
                          <Link href={`/products/${item.productSlug}`} className="text-indigo-400 hover:underline">
                            {item.productName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.selectedSize || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        Rp{item.productPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                        Rp{(item.productPrice * item.quantity).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(item.addedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

export default UserCartDetailPage;
