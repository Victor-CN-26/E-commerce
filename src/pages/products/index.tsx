// pages/products/index.tsx
import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import ProductCard from '@/components/ProductCard'; // Import komponen ProductCard
import prisma from '@/lib/db'; // Asumsi Prisma Client Anda ada di sini
import { useRouter } from 'next/router'; // Import useRouter untuk navigasi
import { useCart } from '@/context/CartContext'; // Import useCart hook

// Definisikan tipe untuk data produk yang akan diambil
interface Product {
  id: string;
  name: string;
  slug: string; // Tambahkan slug
  description: string;
  price: string; // Ubah tipe price menjadi string
  imageUrl: string; // Ini akan menjadi URL gambar utama yang dipilih dari imageUrls
}

// Definisi tipe untuk props halaman
interface ProductsPageProps {
  products: Product[];
}

// getServerSideProps untuk mengambil data produk di sisi server
export const getServerSideProps: GetServerSideProps<ProductsPageProps> = async () => {
  try {
    // Ambil semua produk dari database
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }, // Urutkan berdasarkan nama produk
      select: {
        id: true,
        name: true,
        slug: true, // Ambil slug
        description: true,
        price: true, // Ambil field price
        imageUrls: true, // Ambil field imageUrls
      },
    });

    // Format data produk: Ambil URL gambar pertama dari array imageUrls
    const formattedProducts = products.map(product => {
      let imageUrl = 'https://placehold.co/600x400/E0E0E0/333333?text=Gambar+Tidak+Tersedia'; // Default fallback

      try {
        const parsedImageUrls = JSON.parse(product.imageUrls) as string[];
        if (parsedImageUrls && parsedImageUrls.length > 0) {
          imageUrl = parsedImageUrls[0]; // Ambil URL gambar pertama
        }
      } catch (e) {
        console.error(`Error parsing imageUrls for product ${product.id}:`, e);
        // imageUrl akan tetap menggunakan fallback default
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug, // Teruskan slug
        description: product.description || 'Tidak ada deskripsi.',
        price: product.price.toString(), // Konversi Decimal ke string di sini
        imageUrl: imageUrl, // Gunakan URL gambar yang sudah dipilih
      };
    });

    return {
      props: {
        products: formattedProducts,
      },
    };
  } catch (error) {
    console.error('Error fetching products in getServerSideProps:', error);
    return {
      props: {
        products: [], // Kembalikan array kosong jika ada error
      },
    };
  }
};

const ProductsPage: React.FC<ProductsPageProps> = ({ products }) => {
  const router = useRouter(); // Inisialisasi router
  const { addToCart } = useCart(); // Gunakan hook useCart untuk mengakses fungsi addToCart

  // Fungsi untuk menangani penambahan produk ke keranjang
  const handleAddToCart = async (productData: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    selectedSize?: string;
    slug?: string;
  }, quantity: number) => {
    await addToCart(productData, quantity); // Panggil addToCart dari context
    console.log(`Produk ${productData.name} ditambahkan ke keranjang.`);
    alert(`Produk ${productData.name} telah ditambahkan ke keranjang! Mengarahkan ke halaman keranjang...`);
    router.push('/cart'); // Arahkan ke halaman keranjang
  };

  return (
    <>
      <Head>
        <title>MyEcom - Produk Kami</title>
        <meta name="description" content="Jelajahi berbagai produk berkualitas tinggi kami." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center text-amber-300">Produk Kami</h1>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">Tidak ada produk yang tersedia saat ini.</p>
              <p className="text-gray-500 mt-2">Silakan cek kembali nanti atau hubungi dukungan.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
