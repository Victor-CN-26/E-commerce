// components/ProductCard.tsx
import React from 'react';
import Link from 'next/link'; // Import Link dari Next.js

// Definisikan tipe props untuk komponen ProductCard
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string; // Tambahkan slug untuk navigasi
    description: string;
    price: string; // Price sudah string dari getServerSideProps
    imageUrl: string;
    // selectedSize tidak ada di ProductCard karena ini adalah tampilan ringkas
    // Ukuran dipilih di halaman detail produk
  };
  onAddToCart: (productData: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    selectedSize?: string; // Opsional, karena ProductCard tidak selalu memiliki ukuran spesifik
    slug?: string;
  }, quantity: number) => void; // Perbarui tipe onAddToCart
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    // Bungkus seluruh card dengan Link untuk navigasi ke halaman detail produk
    // Menggunakan `passHref` agar Link meneruskan href ke elemen anak
    <Link href={`/products/${product.slug}`} passHref className="block">
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 flex flex-col h-full cursor-pointer border border-gray-700">
        {/* Bagian gambar produk */}
        <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-700 flex items-center justify-center">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center"
            // Fallback image jika URL gambar tidak valid atau gagal dimuat
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/600x400/E0E0E0/333333?text=Gambar+Tidak+Tersedia`;
              e.currentTarget.alt = "Gambar Tidak Tersedia";
            }}
          />
        </div>

        {/* Bagian detail produk */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold text-gray-50 mb-2 truncate">
            {product.name}
          </h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-3 flex-grow">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-700">
            <span className="text-2xl font-bold text-amber-400">
              Rp{parseFloat(product.price).toLocaleString('id-ID')}
            </span>
            {/* Tombol "Tambah ke Keranjang" */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Mencegah event klik Link terpicu saat tombol diklik
                onAddToCart({ // Panggil onAddToCart dengan objek produk lengkap
                  id: product.id,
                  name: product.name,
                  price: parseFloat(product.price),
                  imageUrl: product.imageUrl,
                  slug: product.slug,
                  // selectedSize tidak disertakan di sini karena ProductCard tidak memilih ukuran
                }, 1); // Tambahkan 1 kuantitas
              }}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
            >
              Tambah ke Keranjang
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
