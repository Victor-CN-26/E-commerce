// pages/cart/index.tsx
import React, { useState, useEffect } from 'react'; // Import useState dan useEffect
import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '@/context/CartContext'; // Import useCart hook

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

  // State untuk melacak apakah komponen sudah di-mount di sisi klien
  const [hasMounted, setHasMounted] = useState(false);

  // Set hasMounted menjadi true setelah komponen di-mount di klien
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fungsi untuk menangani perubahan kuantitas item
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(itemId, newQuantity);
    } else {
      // Jika kuantitas menjadi 0 atau kurang, hapus item dari keranjang
      removeFromCart(itemId);
    }
  };

  // Tampilkan loading atau fallback jika belum di-mount di klien
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-xl">Memuat keranjang Anda...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>MyEcom - Keranjang Belanja</title>
        <meta name="description" content="Lihat dan kelola item di keranjang belanja Anda." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
        <div className="container mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300">Keranjang Belanja Anda</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg mb-4">Keranjang Anda kosong.</p>
              <p className="text-gray-500 mt-2 mb-6">Tambahkan beberapa produk dari halaman produk kami!</p>
              <Link href="/products" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105">
                Jelajahi Produk
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daftar Item Keranjang */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-50 mb-6">Item di Keranjang</h2>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center border-b border-gray-700 py-4 last:border-b-0">
                    {/* Gambar Produk */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden mr-4 bg-gray-700 flex items-center justify-center">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/96x96/E0E0E0/333333?text=No+Img';
                          e.currentTarget.alt = "Gambar Tidak Tersedia";
                        }}
                      />
                    </div>

                    {/* Detail Produk */}
                    <div className="flex-grow">
                      <Link href={`/products/${item.productId}`} className="text-xl font-semibold text-amber-300 hover:text-amber-400 transition duration-200">
                        {item.name}
                      </Link>
                      {item.selectedSize && (
                        <p className="text-gray-400 text-sm mt-1">Ukuran: <span className="font-medium">{item.selectedSize}</span></p>
                      )}
                      <p className="text-gray-300 text-lg mt-2">Rp{item.price.toLocaleString('id-ID')}</p>
                    </div>

                    {/* Kontrol Kuantitas */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="bg-gray-700 text-gray-200 px-3 py-1 rounded-md hover:bg-gray-600 transition duration-200"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                        min="1"
                        className="w-16 text-center bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="bg-gray-700 text-gray-200 px-3 py-1 rounded-md hover:bg-gray-600 transition duration-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Tombol Hapus */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-4 text-red-500 hover:text-red-700 transition duration-200"
                      aria-label="Hapus item dari keranjang"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Ringkasan Keranjang */}
              <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6 shadow-lg h-fit">
                <h2 className="text-2xl font-semibold text-gray-50 mb-6">Ringkasan Belanja</h2>
                <div className="flex justify-between items-center text-xl font-bold text-gray-200 mb-6 border-t border-gray-700 pt-4">
                  <span>Total:</span>
                  <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
                </div>
                <button
                  onClick={() => {
                    alert('Melanjutkan ke proses checkout! (Implementasi checkout sebenarnya akan dilakukan di sini)');
                    clearCart(); // Kosongkan keranjang setelah "checkout" dummy
                    // router.push('/checkout-page-sebenarnya'); // Arahkan ke halaman checkout sebenarnya
                  }}
                  className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-amber-400 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Lanjutkan ke Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="w-full mt-4 bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-800 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Kosongkan Keranjang
                </button>
                <Link href="/products" className="block text-center mt-6 text-indigo-400 hover:text-indigo-300 transition duration-200">
                  Lanjutkan Belanja
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
