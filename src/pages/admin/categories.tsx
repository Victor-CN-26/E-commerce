// pages/admin/categories.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'; // Ikon untuk CRUD

// Definisi tipe untuk Category
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null; // Tambahkan imageUrl
  createdAt: string;
  updatedAt: string;
}

export default function ManageCategoriesPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // State untuk modal tambah/edit
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null); // State untuk kategori yang sedang diedit

  // Fungsi untuk mengambil data kategori
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories'); // Mengambil dari API route yang sudah kita buat
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.statusText}`);
      }
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ambil data saat komponen dimuat
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategories();
    }
  }, [status]);

  // Penanganan akses (sama seperti di admin dashboard)
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-800 p-4">
        <h1 className="text-4xl font-bold mb-4">Akses Ditolak</h1>
        <p className="text-lg text-center">Anda tidak memiliki izin untuk melihat halaman ini.</p>
        <Link href="/auth/login" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
          Pergi ke Login
        </Link>
      </div>
    );
  }

  // Handler untuk membuka modal tambah kategori
  const handleAddCategory = () => {
    setCurrentCategory(null); // Reset kategori yang sedang diedit
    setShowModal(true);
  };

  // Handler untuk membuka modal edit kategori
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setShowModal(true);
  };

  // Handler untuk menghapus kategori
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`Gagal menghapus kategori: ${res.statusText}`);
      }
      fetchCategories(); // Refresh daftar kategori
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kategori.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Component Modal untuk Tambah/Edit Kategori
  const CategoryModal = ({ onClose, onSave, category }: { onClose: () => void; onSave: (categoryData: any) => void; category: Category | null }) => {
    // Pastikan nilai awal adalah string kosong jika null/undefined
    const [name, setName] = useState(category?.name || '');
    const [slug, setSlug] = useState(category?.slug || '');
    const [description, setDescription] = useState(category?.description || '');
    const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [imageInputType, setImageInputType] = useState<'url' | 'upload'>(
      (category?.imageUrl && !category.imageUrl.startsWith('data:')) ? 'url' : 'url'
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(category?.imageUrl || null);

    // Efek untuk mengatur pratinjau dan tipe input saat kategori berubah
    useEffect(() => {
      // Pastikan semua state di-reset atau diatur ulang saat `category` berubah
      // Ini penting untuk mode edit agar form terisi dengan data yang benar
      // dan untuk mode tambah agar form bersih.
      setName(category?.name || '');
      setSlug(category?.slug || '');
      setDescription(category?.description || '');
      setImageUrl(category?.imageUrl || '');
      setImagePreview(category?.imageUrl || null);
      setImageInputType((category?.imageUrl && !category.imageUrl.startsWith('data:')) ? 'url' : 'url');
      setSelectedFile(null); // Selalu bersihkan file yang dipilih saat `category` berubah
      setModalError(null); // Bersihkan error modal
    }, [category]);


    // Fungsi untuk menghasilkan slug dari nama
    const generateSlug = (categoryName: string) => {
      return categoryName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Hapus karakter non-word
        .replace(/[\s_-]+/g, '-') // Ganti spasi/underscore dengan dash
        .replace(/^-+|-+$/g, ''); // Hapus dash di awal/akhir
    };

    // Efek untuk otomatis mengisi slug saat nama berubah (jika ini kategori baru)
    useEffect(() => {
      if (!category) { // Hanya untuk mode tambah
        setSlug(generateSlug(name));
      }
    }, [name, category]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) { // Batasi ukuran file 2MB
          setModalError('Ukuran file melebihi 2MB. Silakan pilih gambar yang lebih kecil.');
          e.target.value = ''; // Reset input file
          setSelectedFile(null); // Bersihkan file yang dipilih
          setImageUrl('');
          setImagePreview(null);
          return;
        }

        setSelectedFile(file); // Simpan objek file
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

      let finalImageUrl = imageUrl; // Default ke imageUrl state saat ini (bisa URL atau Base64)

      // Handle image upload if 'upload' type is selected and a file is chosen
      if (imageInputType === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile); // 'image' must match the field name in /api/upload.ts

        try {
          // Panggil API unggah TANPA parameter subfolder
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData, // No 'Content-Type' header needed for FormData
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || 'Gagal mengunggah gambar.');
          }

          const uploadResult = await uploadRes.json();
          finalImageUrl = uploadResult.url; // Use the URL returned by the upload API
        } catch (uploadError: any) {
          setModalError(uploadError.message || 'Terjadi kesalahan saat mengunggah gambar.');
          setModalLoading(false);
          return; // Stop the save process if upload fails
        }
      } else if (imageInputType === 'upload' && !selectedFile && !category?.imageUrl) {
        // Jika upload dipilih tapi tidak ada file yang dipilih dan tidak ada gambar yang sudah ada (untuk edit)
        setModalError('Mohon unggah gambar atau berikan URL gambar.');
        setModalLoading(false);
        return;
      } else if (imageInputType === 'url' && !imageUrl) {
        // Jika URL dipilih tapi tidak ada URL yang diberikan
        setModalError('Mohon berikan URL gambar.');
        setModalLoading(false);
        return;
      }

      const categoryData = { name, slug, description, imageUrl: finalImageUrl }; // Sertakan imageUrl
      const method = category ? 'PUT' : 'POST';
      const url = category ? `/api/categories?id=${category.id}` : '/api/categories';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Gagal ${category ? 'memperbarui' : 'menambahkan'} kategori.`);
        }
        onSave(categoryData); // Panggil fungsi onSave dari parent
        onClose(); // Tutup modal
      } catch (err: any) {
        setModalError(err.message || 'Terjadi kesalahan.');
        console.error('Save error:', err);
      } finally {
        setModalLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{category ? 'Edit Kategori Produk' : 'Tambah Kategori Produk Baru'}</h2>
          
          {modalError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {modalError}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nama Kategori:</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="slug" className="block text-gray-700 text-sm font-bold mb-2">Slug (URL-friendly):</label>
              <input type="text" id="slug" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Slug akan digunakan di URL (contoh: /products?category=elektronik)</p>
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Deskripsi (Opsional):</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            {/* Pilihan Input Gambar (URL atau Upload) */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Sumber Gambar:</label>
              <div className="flex items-center space-x-4 mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
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
                  <span className="ml-2 text-gray-700">URL Gambar</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="imageSource"
                    value="upload"
                    checked={imageInputType === 'upload'}
                    onChange={() => {
                      setImageInputType('upload');
                      setImageUrl(''); // Kosongkan URL saat beralih ke unggah
                      setImagePreview(null); // Kosongkan pratinjau
                      setModalError(null);
                    }}
                  />
                  <span className="ml-2 text-gray-700">Unggah Gambar</span>
                </label>
              </div>

              {imageInputType === 'url' ? (
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value); // Perbarui pratinjau saat URL berubah
                  }}
                  required={imageInputType === 'url'}
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="misal: https://example.com/image.jpg"
                />
              ) : (
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={imageInputType === 'upload' && !category?.imageUrl}
                  className="block w-full text-sm text-gray-700
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              )}
            </div>

            {/* Pratinjau Gambar */}
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Pratinjau Gambar:</label>
                <div className="border border-gray-300 rounded-lg p-2 flex items-center justify-center bg-gray-50">
                  <img src={imagePreview} alt="Pratinjau Gambar" className="max-w-full h-32 object-contain rounded-md" onError={(e) => (e.currentTarget.src = 'https://placehold.co/128x96?text=Error')} />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                Batal
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                {modalLoading ? <Loader2 className="animate-spin w-5 h-5 inline mr-2" /> : null}
                {category ? 'Simpan Perubahan' : 'Tambah Kategori'}
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
        <title>Kelola Kategori - Admin</title>
        <meta name="description" content="Kelola kategori produk untuk toko Anda" />
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="container mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Kelola Kategori Produk</h1>
          <p className="text-gray-600 mb-4">Di sini Anda dapat menambah, mengedit, dan menghapus kategori produk.</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              Error: {error}
            </div>
          )}

          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
              <p className="ml-2 text-gray-600">Memuat kategori...</p>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-600 py-10">Tidak ada kategori ditemukan. Klik "Tambah Kategori Baru" untuk memulai!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* Ubah ke grid untuk card */}
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out group">
                  <img
                    src={category.imageUrl || `https://placehold.co/400x250/f97316/ffffff?text=${encodeURIComponent(category.name)}`}
                    alt={category.name}
                    className="w-full h-40 object-cover object-center transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => (e.currentTarget.src = `https://placehold.co/400x250/f97316/ffffff?text=${encodeURIComponent(category.name)}`)}
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description || 'Tidak ada deskripsi.'}</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800 transition duration-200"
                        title="Edit Kategori"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800 transition duration-200"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CategoryModal
          onClose={() => { setShowModal(false); fetchCategories(); }} // Refresh data setelah modal ditutup
          onSave={fetchCategories} // Refresh data setelah save
          category={currentCategory}
        />
      )}
    </>
  );
}
