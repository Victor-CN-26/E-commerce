// pages/index.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next'; // Import GetServerSideProps
import prisma from '@/lib/db'; // Import Prisma Client
import ProductCard from '@/components/ProductCard'; // Import ProductCard untuk menampilkan produk
import { useCart } from '@/context/CartContext'; // Import useCart hook

// Definisikan tipe untuk data produk yang akan diambil (untuk featuredProducts)
interface Product {
  id: string;
  name: string;
  slug: string; // Tambahkan slug
  description: string;
  price: string; // Ubah tipe price menjadi string
  imageUrl: string; // Ini akan menjadi URL gambar utama yang dipilih dari imageUrls
}

// Definisi tipe untuk props halaman
interface HomePageProps {
  heroSlides: {
    id: string;
    title: string;
    description: string;
    image: string;
    link: string;
  }[];
  blogPosts: {
    id: string;
    title: string;
    excerpt: string;
    image: string; // URL gambar postingan blog
    link: string;
    authorName: string;
    publishedDate: string; // Tanggal yang sudah diformat
  }[];
  featuredCategories: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    description?: string | null;
  }[];
  featuredProducts: Product[]; // Gunakan interface Product yang baru
}

// getServerSideProps untuk mengambil data di sisi server
export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  try {
    // Ambil Hero Slides dari database
    const heroSlides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
      }
    });

    // Ambil Blog Posts dari database
    const blogPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3, // Ambil 3 postingan terbaru untuk layout ini
      include: {
        author: {
          select: { name: true },
        },
      },
    });

    // Ambil Featured Categories dari database
    const featuredCategories = await prisma.category.findMany({
      take: 6,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        description: true,
      }
    });

    // Ambil Produk Unggulan dari database (misalnya, 8 produk terbaru)
    const featuredProducts = await prisma.product.findMany({
      take: 8, // Ambil 8 produk untuk ditampilkan
      orderBy: { createdAt: 'desc' }, // Urutkan berdasarkan tanggal pembuatan terbaru
      select: {
        id: true,
        name: true,
        slug: true, // Ambil slug
        description: true,
        price: true,
        imageUrls: true, // Ambil field imageUrls
      },
    });

    // Format data blog posts untuk frontend
    const formattedBlogPosts = blogPosts.map(post => ({
      id: post.id,
      title: post.title,
      // Pastikan excerpt tidak melebihi panjang dan tambahkan '...'
      excerpt: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
      image: post.imageUrl || 'https://placehold.co/400x250/333333/cccccc?text=No+Image',
      link: `/blog/${post.slug}`,
      authorName: post.author?.name || 'Unknown Author',
      // Format tanggal agar sesuai dengan yang ditampilkan di gambar
      publishedDate: new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    }));

    // Format data hero slides untuk frontend
    const formattedHeroSlides = heroSlides.map(slide => ({
      id: slide.id,
      title: slide.title,
      description: slide.description || '',
      image: slide.imageUrl,
      link: slide.linkUrl || '#',
    }));

    // Format data featured categories untuk frontend
    const formattedFeaturedCategories = featuredCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || null,
      imageUrl: cat.imageUrl || `https://placehold.co/400x250/262626/e5e5e5?text=${encodeURIComponent(cat.name)}`,
    }));

    // Format data produk unggulan: Ambil URL gambar pertama dari array imageUrls
    const formattedFeaturedProducts = featuredProducts.map(product => {
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
        heroSlides: formattedHeroSlides,
        blogPosts: formattedBlogPosts,
        featuredCategories: formattedFeaturedCategories,
        featuredProducts: formattedFeaturedProducts, // Sertakan produk unggulan dalam props
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        heroSlides: [],
        blogPosts: [],
        featuredCategories: [],
        featuredProducts: [], // Kembalikan array kosong jika ada error
      },
    };
  }
};

export default function HomePage({ heroSlides, blogPosts, featuredCategories, featuredProducts }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart(); // Gunakan hook useCart

  // Auto-slide functionality
  useEffect(() => {
    if (heroSlides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) =>
        prevSlide === heroSlides.length - 1 ? 0 : prevSlide + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Fungsi untuk menangani penambahan produk ke keranjang dari ProductCard
  const handleAddToCart = async (productData: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    selectedSize?: string;
    slug?: string;
  }, quantity: number) => {
    await addToCart(productData, quantity);
    console.log(`Produk ${productData.name} ditambahkan ke keranjang.`);
    alert(`Produk ${productData.name} telah ditambahkan ke keranjang!`);
    // Anda bisa mengarahkan ke halaman keranjang di sini jika diinginkan
    // router.push('/cart');
  };

  return (
    <>
      <Head>
        <title>MyEcom - Home</title>
        <meta name="description" content="Welcome to MyEcom, your best online store!" />
      </Head>

      {/* Hero Section with Slider */}
      {heroSlides.length > 0 ? (
        <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out
                ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white">
                <div className="container mx-auto text-center px-4">
                  <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fadeInUp text-amber-300 drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 animate-fadeInUp delay-200 text-gray-200">
                    {slide.description}
                  </p>
                  <Link href={slide.link} className="bg-amber-500 text-gray-900 hover:bg-amber-400 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 animate-fadeInUp delay-400">
                    Explore Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {/* Slider Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300
                  ${index === currentSlide ? 'bg-amber-300 scale-125' : 'bg-gray-500 bg-opacity-75'}`}
                aria-label={`Go to slide ${index + 1}`}
              ></button>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-gray-800 to-gray-950 text-white py-20 px-4 text-center h-[600px] md:h-[700px] flex items-center justify-center">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-amber-300">
              Welcome to MyEcom!
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-300">
              No hero slides available. Add some from the admin panel!
            </p>
          </div>
        </section>
      )}


      {/* Featured Categories (Grid Container / Cards) */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-50">Featured Categories</h2>
          {featuredCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {featuredCategories.map(category => (
                <Link key={category.id} href={`/products?category=${category.slug}`} className="block">
                  <div className="relative bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out group border border-gray-700">
                    <img
                      src={category.imageUrl || `https://placehold.co/400x250/262626/e5e5e5?text=${encodeURIComponent(category.name)}`}
                      alt={category.name}
                      className="w-full h-40 object-cover object-center transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => (e.currentTarget.src = `https://placehold.co/400x250/262626/e5e5e5?text=${encodeURIComponent(category.name)}`)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-2xl font-bold text-amber-300 text-center px-4 drop-shadow-md">{category.name}</h3>
                    </div>
                    {/* Teks nama kategori di bawah gambar saat tidak hover */}
                    <div className="p-4 text-center">
                      <h3 className="text-lg font-semibold text-gray-50">{category.name}</h3>
                      <p className="text-gray-300 text-sm mt-1 line-clamp-2">{category.description || 'Tidak ada deskripsi.'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-300">No featured categories available.</p>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-50">Best Products</h2>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart} // Menggunakan handleAddToCart yang baru
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">Tidak ada produk unggulan yang tersedia saat ini.</p>
              <p className="text-gray-500 mt-2">Silakan cek kembali nanti.</p>
            </div>
          )}
          <div className="text-center mt-10">
            <Link href="/products" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
              Lihat Semua Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section - New Layout */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-50 mb-10">New Infromation</h2> {/* Judul "What's On" */}
          {blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Postingan Blog Utama (kiri) */}
              {blogPosts[0] && (
                <Link href={blogPosts[0].link} className="block lg:col-span-1"> {/* Ubah col-span menjadi 1 */}
                  <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-700 h-full flex flex-col">
                    <img
                      src={blogPosts[0].image}
                      alt={blogPosts[0].title}
                      className="w-full h-96 object-cover object-center" // Gambar lebih besar
                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/800x600/333333/cccccc?text=No+Image')}
                    />
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="text-gray-400 text-xs mb-2 flex items-center">
                          <span className="mr-2">{blogPosts[0].publishedDate}</span>
                          <span className="bg-red-700 text-white text-xs font-semibold px-2 py-1 rounded-full">TIPS & TRICK</span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-3 text-gray-50 leading-tight">{blogPosts[0].title}</h3>
                        <p className="text-gray-300 text-base line-clamp-3">{blogPosts[0].excerpt}</p>
                      </div>
                      {/* Link "Read More" bisa ditambahkan di sini jika perlu, atau seluruh card adalah link */}
                    </div>
                  </div>
                </Link>
              )}

              {/* Postingan Blog Kecil (kanan) */}
              <div className="grid grid-cols-1 gap-8 lg:col-span-1"> {/* Mengisi sisa kolom di kanan */}
                {blogPosts[1] && (
                  <Link href={blogPosts[1].link} className="block">
                    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-700 flex">
                      <img
                        src={blogPosts[1].image}
                        alt={blogPosts[1].title}
                        className="w-32 h-32 object-cover flex-shrink-0" // Gambar kecil di kiri
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/128x128/333333/cccccc?text=No+Img')}
                      />
                      <div className="p-4 flex flex-col justify-center">
                        <div className="text-gray-400 text-xs mb-1 flex items-center">
                          <span className="mr-2">{blogPosts[1].publishedDate}</span>
                          <span className="bg-red-700 text-white text-xs font-semibold px-2 py-1 rounded-full">TIPS & TRICK</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-50 leading-tight line-clamp-2">{blogPosts[1].title}</h3>
                        {/* Excerpt dihilangkan untuk postingan kecil agar lebih ringkas */}
                      </div>
                    </div>
                  </Link>
                )}
                {blogPosts[2] && (
                  <Link href={blogPosts[2].link} className="block">
                    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-700 flex">
                      <img
                        src={blogPosts[2].image}
                        alt={blogPosts[2].title}
                        className="w-32 h-32 object-cover flex-shrink-0" // Gambar kecil di kiri
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/128x128/333333/cccccc?text=No+Img')}
                      />
                      <div className="p-4 flex flex-col justify-center">
                        <div className="text-gray-400 text-xs mb-1 flex items-center">
                          <span className="mr-2">{blogPosts[2].publishedDate}</span>
                          <span className="bg-red-700 text-white text-xs font-semibold px-2 py-1 rounded-full">TIPS & TRICK</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-50 leading-tight line-clamp-2">{blogPosts[2].title}</h3>
                        {/* Excerpt dihilangkan untuk postingan kecil agar lebih ringkas */}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-300">No blog posts available.</p>
          )}
          <div className="text-center mt-10">
            <Link href="/blog" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
              View All Posts
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-gray-950 text-white py-8 px-4 text-center border-t border-gray-800">
        <div className="container mx-auto">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} MyEcom. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
