// pages/admin/blog-posts.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react'; // Ikon untuk CRUD dan status publikasi

// Definisi tipe untuk Blog Post
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string | null; // imageUrl dari API
  published: boolean;
  authorId: string;
  authorName: string;
  publishedDate: string; // String tanggal yang diformat
  createdAt: string;
  updatedAt: string;
}

export default function ManageBlogPostsPage() {
  const { data: session, status } = useSession();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // State untuk modal tambah/edit
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null); // State untuk postingan yang sedang diedit

  // Fungsi untuk mengambil data postingan blog
  const fetchBlogPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/blog-posts'); // Mengambil dari API route yang sudah kita buat
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
    if (status === 'authenticated') {
      fetchBlogPosts();
    }
  }, [status]);

  // Penanganan akses
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-50">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <p className="text-xl">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-4">Akses Ditolak</h1>
        <p className="text-lg text-center">Anda tidak memiliki izin untuk melihat halaman ini.</p>
        <Link href="/auth/login" className="mt-6 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200">
          Pergi ke Login
        </Link>
      </div>
    );
  }

  // Handler untuk membuka modal tambah postingan
  const handleAddPost = () => {
    setCurrentPost(null); // Reset postingan yang sedang diedit
    setShowModal(true);
  };

  // Handler untuk membuka modal edit postingan
  const handleEditPost = (post: BlogPost) => {
    setCurrentPost(post);
    setShowModal(true);
  };

  // Handler untuk menghapus postingan
  const handleDeletePost = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus postingan blog ini?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/blog-posts?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`Gagal menghapus postingan blog: ${res.statusText}`);
      }
      fetchBlogPosts(); // Refresh daftar postingan
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus postingan blog.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Component Modal untuk Tambah/Edit Postingan Blog
  const BlogPostModal = ({ onClose, onSave, post, authorId }: { onClose: () => void; onSave: (postData: any) => void; post: BlogPost | null; authorId: string }) => {
    // Pastikan nilai awal adalah string kosong jika null/undefined
    const [title, setTitle] = useState(post?.title || '');
    const [slug, setSlug] = useState(post?.slug || '');
    const [content, setContent] = useState(post?.content || '');
    const [imageUrl, setImageUrl] = useState(post?.image || ''); // Menggunakan 'image' dari BlogPost interface
    const [published, setPublished] = useState(post?.published || false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    
    // *** PERBAIKAN LOGIKA INI ***
    // Inisialisasi imageInputType berdasarkan apakah ada gambar dan apakah itu data URL
    const [imageInputType, setImageInputType] = useState<'url' | 'upload'>(
      (post?.image && post.image.startsWith('data:')) ? 'upload' : 'url'
    );
    // *** AKHIR PERBAIKAN ***

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(post?.image || null);

    // Efek untuk mengatur pratinjau dan tipe input saat postingan berubah
    useEffect(() => {
      // Pastikan semua state di-reset atau diatur ulang saat `post` berubah
      setTitle(post?.title || '');
      setSlug(post?.slug || '');
      setContent(post?.content || '');
      setImageUrl(post?.image || '');
      setPublished(post?.published || false);
      setImagePreview(post?.image || null);
      
      // *** PERBAIKAN LOGIKA INI DI useEffect JUGA ***
      // Pastikan imageInputType juga diatur ulang saat post berubah
      setImageInputType((post?.image && post.image.startsWith('data:')) ? 'upload' : 'url');
      // *** AKHIR PERBAIKAN ***

      setSelectedFile(null);
      setModalError(null);
    }, [post]);

    // Fungsi untuk menghasilkan slug dari judul
    const generateSlug = (postTitle: string) => {
      return postTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Efek untuk otomatis mengisi slug saat judul berubah (jika ini postingan baru)
    useEffect(() => {
      if (!post) { // Hanya untuk mode tambah
        setSlug(generateSlug(title));
      }
    }, [title, post]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) { // Batasi ukuran file 2MB
          setModalError('Ukuran file melebihi 2MB. Silakan pilih gambar yang lebih kecil.');
          e.target.value = '';
          setSelectedFile(null);
          setImageUrl('');
          setImagePreview(null);
          return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImageUrl(reader.result as string); // Simpan Base64 sebagai imageUrl sementara untuk pratinjau
          setModalError(null);
        };
        reader.readAsDataURL(file);
      } else {
        setSelectedFile(null);
        setImageUrl('');
        setImagePreview(null);
      }
    };

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setModalLoading(true);
      setModalError(null);

      let finalImageUrl = imageUrl;

      if (imageInputType === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
          const uploadRes = await fetch('/api/upload', { // Mengunggah ke folder hero-slides
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || 'Gagal mengunggah gambar.');
          }

          const uploadResult = await uploadRes.json();
          finalImageUrl = uploadResult.url;
        } catch (uploadError: any) {
          setModalError(uploadError.message || 'Terjadi kesalahan saat mengunggah gambar.');
          setModalLoading(false);
          return;
        }
      } else if (imageInputType === 'upload' && !selectedFile && !post?.image) {
        setModalError('Mohon unggah gambar atau berikan URL gambar.');
        setModalLoading(false);
        return;
      } else if (imageInputType === 'url' && !imageUrl) {
        setModalError('Mohon berikan URL gambar.');
        setModalLoading(false);
        return;
      }

      const postData = {
        title,
        slug,
        content,
        imageUrl: finalImageUrl,
        published,
        authorId, // Gunakan authorId dari sesi
      };

      const method = post ? 'PUT' : 'POST';
      const url = post ? `/api/blog-posts?id=${post.id}` : '/api/blog-posts';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Gagal ${post ? 'memperbarui' : 'menambahkan'} postingan blog.`);
        }
        onSave(postData);
        onClose();
      } catch (err: any) {
        setModalError(err.message || 'Terjadi kesalahan.');
        console.error('Save error:', err);
      } finally {
        setModalLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 text-gray-50"> {/* Tema gelap */}
          <h2 className="text-2xl font-bold mb-4 text-amber-300">{post ? 'Edit Postingan Blog' : 'Tambah Postingan Blog Baru'}</h2>
          
          {modalError && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4">
              {modalError}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-bold mb-2">Judul Postingan:</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="slug" className="block text-sm font-bold mb-2">Slug (URL-friendly):</label>
              <input type="text" id="slug" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} required className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <p className="text-xs text-gray-400 mt-1">Slug akan digunakan di URL (contoh: /blog/judul-postingan-anda)</p>
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-bold mb-2">Konten Postingan:</label>
              <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
            </div>

            {/* Pilihan Input Gambar (URL atau Upload) */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Sumber Gambar:</label>
              <div className="flex items-center space-x-4 mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-amber-500"
                    name="imageSource"
                    value="url"
                    checked={imageInputType === 'url'}
                    onChange={() => {
                      setImageInputType('url');
                      if (selectedFile || (imageUrl && imageUrl.startsWith('data:'))) {
                        setSelectedFile(null);
                        setImageUrl('');
                        setImagePreview(null);
                      }
                      setModalError(null);
                    }}
                  />
                  <span className="ml-2 text-gray-50">URL Gambar</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-amber-500"
                    name="imageSource"
                    value="upload"
                    checked={imageInputType === 'upload'}
                    onChange={() => {
                      setImageInputType('upload');
                      setImageUrl('');
                      setImagePreview(null);
                      setModalError(null);
                    }}
                  />
                  <span className="ml-2 text-gray-50">Unggah Gambar</span>
                </label>
              </div>

              {imageInputType === 'url' ? (
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  required={imageInputType === 'url'}
                  className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="misal: https://example.com/blog-image.jpg"
                />
              ) : (
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={imageInputType === 'upload' && !post?.image}
                  className="block w-full text-sm text-gray-50
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-amber-700 file:text-white
                    hover:file:bg-amber-600"
                />
              )}
            </div>

            {/* Pratinjau Gambar */}
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Pratinjau Gambar:</label>
                <div className="border border-gray-700 rounded-lg p-2 flex items-center justify-center bg-gray-700">
                  <img src={imagePreview} alt="Pratinjau Gambar" className="max-w-full h-32 object-contain rounded-md" onError={(e) => (e.currentTarget.src = 'https://placehold.co/128x96/333333/cccccc?text=Error')} />
                </div>
              </div>
            )}

            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="form-checkbox h-5 w-5 text-amber-500 rounded border-gray-700 bg-gray-700 focus:ring-amber-500"
              />
              <label htmlFor="published" className="ml-2 text-gray-50">Publikasikan Postingan</label>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-gray-50 font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                Batal
              </button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                {modalLoading ? <Loader2 className="animate-spin w-5 h-5 inline mr-2" /> : null}
                {post ? 'Simpan Perubahan' : 'Tambah Postingan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Kelola Postingan Blog - Admin</title>
        <meta name="description" content="Kelola postingan blog untuk toko Anda" />
      </Head>

      <div className="min-h-screen bg-gray-950 p-8 text-gray-50"> {/* Tema gelap */}
        <div className="container mx-auto bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-amber-300 mb-6">Kelola Postingan Blog</h1>
          <p className="text-gray-300 mb-4">Di sini Anda dapat menambah, mengedit, dan menghapus postingan blog.</p>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4">
              Error: {error}
            </div>
          )}

          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddPost}
              className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Tambah Postingan Baru</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
              <p className="ml-2 text-gray-300">Memuat postingan blog...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <p className="text-center text-gray-300 py-10">Tidak ada postingan blog ditemukan. Klik "Tambah Postingan Baru" untuk memulai!</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gambar</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Judul</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Slug</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Penulis</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Publikasi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Dibuat</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {blogPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-700 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img src={post.image || 'https://placehold.co/60x40/333333/cccccc?text=No+Img'} alt={post.title} className="h-10 w-15 object-cover rounded-md" onError={(e) => (e.currentTarget.src = 'https://placehold.co/60x40/333333/cccccc?text=No+Img')} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-50">{post.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{post.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{post.authorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {post.published ? <Eye className="w-5 h-5 text-green-500" title="Dipublikasikan" /> : <EyeOff className="w-5 h-5 text-red-500" title="Tidak Dipublikasikan" />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-amber-400 hover:text-amber-300 transition duration-200"
                            title="Edit Postingan"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-500 hover:text-red-400 transition duration-200"
                            title="Hapus Postingan"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <BlogPostModal
          onClose={() => { setShowModal(false); fetchBlogPosts(); }} // Refresh data setelah modal ditutup
          onSave={fetchBlogPosts} // Refresh data setelah save
          post={currentPost}
          authorId={session.user?.id as string} // Mengirim ID pengguna yang sedang login sebagai authorId
        />
      )}
    </>
  );
}
