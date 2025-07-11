// pages/products/[slug].tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import prisma from '@/lib/db'; // Import Prisma Client
import { useRouter } from 'next/router'; // Untuk mendapatkan slug dari URL
import { useCart } from '@/context/CartContext'; // Import useCart hook

// Definisikan tipe untuk data produk yang akan ditampilkan di halaman detail
interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string; // Price sudah string
  imageUrls: string[]; // Ini akan menjadi array string setelah parsing
  sizes: string[]; // Array ukuran yang tersedia
  sizeStocks: { size: string; stock: number }[]; // Array objek stok per ukuran
  stock: number; // Total stok produk
  categoryName: string; // Nama kategori
  supplierName?: string; // Nama supplier (opsional)
  // Tambahkan properti lain yang relevan seperti reviews, dll.
}

interface ProductDetailPageProps {
  product: ProductDetail | null; // Bisa null jika produk tidak ditemukan
}

// getServerSideProps untuk mengambil data produk berdasarkan slug
export const getServerSideProps: GetServerSideProps<ProductDetailPageProps> = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    const product = await prisma.product.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        stock: true,
        imageUrls: true,
        sizes: true,
        sizeStocks: true,
        category: {
          select: { name: true },
        },
        supplier: {
          select: { name: true },
        },
      },
    });

    if (!product) {
      return {
        notFound: true, // Mengembalikan 404 jika produk tidak ditemukan
      };
    }

    // Parse JSON string fields
    let parsedImageUrls: string[] = [];
    try {
      parsedImageUrls = JSON.parse(product.imageUrls) as string[];
    } catch (e) {
      console.error(`Error parsing imageUrls for product ${product.id}:`, e);
    }

    let parsedSizes: string[] = [];
    try {
      parsedSizes = JSON.parse(product.sizes) as string[];
    } catch (e) {
      console.error(`Error parsing sizes for product ${product.id}:`, e);
    }

    let parsedSizeStocks: { size: string; stock: number }[] = [];
    try {
      // Asumsi sizeStocks adalah array angka yang sesuai dengan urutan sizes
      const rawSizeStocks = JSON.parse(product.sizeStocks) as number[];
      parsedSizeStocks = parsedSizes.map((size, index) => ({
        size: size,
        stock: rawSizeStocks[index] !== undefined ? rawSizeStocks[index] : 0,
      }));
    } catch (e) {
      console.error(`Error parsing sizeStocks for product ${product.id}:`, e);
    }

    const formattedProduct: ProductDetail = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || 'Tidak ada deskripsi untuk produk ini.',
      price: product.price.toString(), // Konversi Decimal ke string
      stock: product.stock,
      imageUrls: parsedImageUrls.length > 0 ? parsedImageUrls : ['https://placehold.co/800x600/E0E0E0/333333?text=Gambar+Tidak+Tersedia'],
      sizes: parsedSizes,
      sizeStocks: parsedSizeStocks,
      categoryName: product.category.name,
      supplierName: product.supplier?.name || 'N/A',
    };

    return {
      props: {
        product: formattedProduct,
      },
    };
  } catch (error) {
    console.error('Error fetching product detail in getServerSideProps:', error);
    return {
      props: {
        product: null, // Kembalikan null jika ada error
      },
    };
  }
};

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product }) => {
  const router = useRouter();
  const { addToCart } = useCart(); // Gunakan hook useCart untuk mengakses fungsi addToCart

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [availableStock, setAvailableStock] = useState<number>(0);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrls[0]); // Set gambar utama pertama kali
      if (product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]); // Pilih ukuran pertama secara default
      }
    }
  }, [product]);

  useEffect(() => {
    if (product && selectedSize) {
      const sizeInfo = product.sizeStocks.find(s => s.size === selectedSize);
      setAvailableStock(sizeInfo ? sizeInfo.stock : 0);
      setQuantity(1); // Reset quantity saat ukuran berubah
    }
  }, [selectedSize, product]);

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-xl">Memuat detail produk...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Produk Tidak Ditemukan</h1>
        <p className="text-lg text-gray-400 mb-8">Maaf, produk yang Anda cari tidak tersedia atau tidak ditemukan.</p>
        <Link href="/products" className="bg-amber-500 text-gray-900 hover:bg-amber-400 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
          Kembali ke Daftar Produk
        </Link>
      </div>
    );
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= availableStock) {
      setQuantity(value);
    } else if (value < 1) {
      setQuantity(1);
    } else if (value > availableStock) {
      setQuantity(availableStock);
    }
  };

  const incrementQuantity = () => {
    if (quantity < availableStock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (product && quantity > 0 && selectedSize) {
      addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        imageUrl: product.imageUrls[0], // Ambil gambar utama
        selectedSize: selectedSize,
      }, quantity);

      console.log(`Menambahkan ${quantity}x ${product.name} (ukuran: ${selectedSize}) ke keranjang.`);
      alert(`Berhasil menambahkan ${quantity}x ${product.name} (ukuran: ${selectedSize}) ke keranjang! Mengarahkan ke halaman keranjang...`);
      router.push('/cart'); // Arahkan ke halaman keranjang
    } else {
      alert('Mohon pilih ukuran dan kuantitas yang valid.');
    }
  };

  return (
    <>
      <Head>
        <title>MyEcom - {product.name}</title>
        <meta name="description" content={product.description.substring(0, 160)} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
        <div className="container mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Bagian Gambar Produk */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-lg h-96 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center shadow-lg mb-6">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/800x600/E0E0E0/333333?text=Gambar+Tidak+Tersedia';
                    e.currentTarget.alt = "Gambar Tidak Tersedia";
                  }}
                />
              </div>
              {product.imageUrls.length > 1 && (
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {product.imageUrls.map((imgUrl, index) => (
                    <img
                      key={index}
                      src={imgUrl}
                      alt={`${product.name} - ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition-all duration-200
                        ${selectedImage === imgUrl ? 'border-amber-500 shadow-md' : 'border-gray-700 hover:border-gray-500'}`}
                      onClick={() => setSelectedImage(imgUrl)}
                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/80x80/E0E0E0/333333?text=X')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bagian Detail Produk */}
            <div className="flex flex-col">
              <h1 className="text-4xl font-extrabold text-amber-300 mb-3">{product.name}</h1>
              <p className="text-gray-400 text-sm mb-2">Kategori: <span className="font-semibold text-gray-300">{product.categoryName}</span></p>
              <p className="text-gray-400 text-sm mb-4">Supplier: <span className="font-semibold text-gray-300">{product.supplierName}</span></p>

              <p className="text-5xl font-bold text-indigo-500 mb-6">
                Rp{parseFloat(product.price).toLocaleString('id-ID')}
              </p>

              <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">{product.description}</p>

              {/* Pilihan Ukuran */}
              {product.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-200 mb-3">Pilih Ukuran:</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => {
                      const currentSizeStock = product.sizeStocks.find(s => s.size === size)?.stock || 0;
                      const isOutOfStock = currentSizeStock === 0;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-5 py-2 rounded-lg border-2 font-medium transition duration-200 ease-in-out
                            ${selectedSize === size
                              ? 'bg-amber-500 border-amber-500 text-gray-900 shadow-md'
                              : 'bg-gray-700 border-gray-700 text-gray-200 hover:bg-gray-600 hover:border-gray-600'}
                            ${isOutOfStock ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                        >
                          {size} {isOutOfStock && '(Stok Habis)'}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && (
                    <p className="text-gray-400 text-sm mt-3">Stok tersedia untuk ukuran {selectedSize}: <span className="font-semibold text-amber-300">{availableStock}</span></p>
                  )}
                </div>
              )}

              {/* Pemilihan Kuantitas */}
              <div className="mb-8 flex items-center">
                <h3 className="text-lg font-semibold text-gray-200 mr-4">Kuantitas:</h3>
                <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="bg-gray-700 text-gray-200 px-4 py-2 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min="1"
                    max={availableStock}
                    className="w-20 text-center bg-gray-800 text-gray-100 border-x border-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= availableStock}
                    className="bg-gray-700 text-gray-200 px-4 py-2 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <p className="text-gray-400 text-sm ml-4">Stok Total: <span className="font-semibold text-amber-300">{product.stock}</span></p>
              </div>

              {/* Tombol Tambah ke Keranjang */}
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0 || quantity === 0 || !selectedSize} // Disable jika ukuran belum dipilih
                className="w-full bg-indigo-600 text-white text-xl font-bold py-4 rounded-lg shadow-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition duration-300 ease-in-out transform hover:scale-[1.01] disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {availableStock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
