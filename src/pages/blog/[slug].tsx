// pages/blog/[slug].tsx

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router'; // Menggunakan useRouter untuk Pages Router
import { useState, useEffect } from 'react';
import { Loader2, Calendar, User } from 'lucide-react'; // Ikon

// Definisi tipe untuk Blog Post (sesuai dengan yang dikembalikan oleh API untuk detail)
interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  content: string; // Konten penuh
  image: string | null; // URL gambar
  published: boolean;
  authorName: string;
  publishedDate: string; // Tanggal yang sudah diformat
  createdAt: string;
  updatedAt: string;
}

export default function BlogPostDetailPage() {
  const router = useRouter();
  const { slug } = router.query; // Ambil slug dari URL
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hanya fetch jika slug sudah tersedia
    if (slug) {
      const fetchPostDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          // Panggil API blog-posts dengan parameter slug
          const res = await fetch(`/api/blog-posts?slug=${slug}`);
          if (!res.ok) {
            // Jika respons 404, set error atau redirect ke halaman 404
            if (res.status === 404) {
              setError('Postingan blog tidak ditemukan atau belum dipublikasikan.');
            } else {
              throw new Error(`Failed to fetch blog post: ${res.statusText}`);
            }
          } else {
            const data: BlogPostDetail = await res.json();
            setPost(data);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load blog post.');
          console.error('Fetch error:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchPostDetail();
    }
  }, [slug]); // Dependensi pada slug

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-50">
        <Loader2 className="animate-spin w-10 h-10 mr-3 text-amber-500" />
        <p className="text-xl">Memuat postingan blog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-4">Error</h1>
        <p className="text-lg text-center mb-6">{error}</p>
        <Link href="/blog" className="mt-6 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200">
          Kembali ke Daftar Blog
        </Link>
      </div>
    );
  }

  if (!post) {
    // Ini seharusnya tidak tercapai jika error ditangani di atas, tapi sebagai fallback
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-50 p-4">
        <h1 className="text-4xl font-bold mb-4">Postingan Tidak Ditemukan</h1>
        <p className="text-lg text-center mb-6">Postingan blog yang Anda cari tidak ada.</p>
        <Link href="/blog" className="mt-6 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200">
          Kembali ke Daftar Blog
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} - MyEcom Blog</title>
        <meta name="description" content={post.content.substring(0, 160) + '...'} />
        {/* Open Graph / Twitter Card Meta Tags (opsional untuk SEO) */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.content.substring(0, 160) + '...'} />
        <meta property="og:image" content={post.image || 'https://placehold.co/1200x630/333333/cccccc?text=Blog+Post'} />
        <meta property="og:url" content={`https://yourdomain.com/blog/${post.slug}`} /> {/* Ganti yourdomain.com */}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-gray-950 py-16 px-4 text-gray-50">
        <div className="container mx-auto bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          {/* Breadcrumbs atau navigasi kembali */}
          <div className="mb-8 text-gray-400">
            <Link href="/blog" className="hover:underline text-amber-400">Blog</Link>
            <span className="mx-2">/</span>
            <span>{post.title}</span>
          </div>

          {post.image && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-lg border border-gray-700">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-96 object-cover object-center"
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/1200x400/333333/cccccc?text=Blog+Image')}
              />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-extrabold text-amber-300 mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center text-gray-400 text-sm mb-8 space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>By {post.authorName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Published on {post.publishedDate}</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg">
            {/* Render konten blog. Jika konten adalah HTML, gunakan dangerouslySetInnerHTML */}
            {/* Untuk saat ini, kita asumsikan konten adalah plain text atau markdown sederhana */}
            <p>{post.content}</p>
            {/* Jika Anda menggunakan markdown dan ingin merendernya sebagai HTML: */}
            {/* <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(post.content) }} /> */}
            {/* Anda perlu menginstal library seperti 'marked' atau 'remark' untuk itu */}
          </div>

          <div className="mt-12 text-center">
            <Link href="/blog" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
              &larr; Kembali ke Semua Postingan
            </Link>
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
