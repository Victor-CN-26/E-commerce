// pages/blog/index.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // Ikon loading

// Definisi tipe untuk Blog Post (sesuai dengan yang dikembalikan oleh API)
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string | null;
  authorName: string;
  publishedDate: string; // Tanggal yang sudah diformat
  createdAt: string;
}

export default function BlogListPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil semua postingan blog
  const fetchAllBlogPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Panggil API blog-posts tanpa parameter ID atau slug
      const res = await fetch('/api/blog-posts');
      if (!res.ok) {
        throw new Error(`Failed to fetch blog posts: ${res.statusText}`);
      }
      const data: BlogPost[] = await res.json();
      setBlogPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ambil data saat komponen dimuat
  useEffect(() => {
    fetchAllBlogPosts();
  }, []);

  return (
    <>
      <Head>
        <title>Blog - MyEcom</title>
        <meta name="description" content="Baca artikel dan berita terbaru dari MyEcom." />
      </Head>

      <div className="min-h-screen bg-gray-950 py-16 px-4 text-gray-50">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12 text-amber-300">Semua Postingan Blog</h1>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4 text-center">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin w-10 h-10 text-amber-500" />
              <p className="ml-3 text-gray-300">Memuat postingan blog...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <p className="text-center text-gray-300 py-10 text-lg">Belum ada postingan blog yang dipublikasikan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.id} href={post.link} className="block">
                  <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out border border-gray-700 h-full flex flex-col">
                    <img
                      src={post.image || 'https://placehold.co/400x250/333333/cccccc?text=No+Image'}
                      alt={post.title}
                      className="w-full h-56 object-cover object-center"
                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x250/333333/cccccc?text=No+Image')}
                    />
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="text-gray-400 text-xs mb-2 flex items-center">
                          <span className="mr-2">{post.publishedDate}</span>
                          <span className="bg-red-700 text-white text-xs font-semibold px-2 py-1 rounded-full">TIPS & TRICK</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-50 leading-tight line-clamp-2">{post.title}</h3>
                        <p className="text-gray-300 text-sm line-clamp-3">{post.excerpt}</p>
                      </div>
                      <div className="mt-4">
                        <span className="text-amber-400 hover:underline font-medium">Baca Selengkapnya &rarr;</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
