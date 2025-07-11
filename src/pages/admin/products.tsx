// pages/admin/products.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, ImageIcon, XCircle } from 'lucide-react'; // Tambahkan ikon XCircle

// Definisi tipe untuk Product
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrls: string[]; // Sekarang array of strings
  sizes: string[]; // Tambahkan field sizes
  sizeStocks: number[]; // Tambahkan field sizeStocks
  categoryId: string;
  category: { id: string; name: string };
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// Definisi tipe untuk Category
interface Category {
  id: string;
  name: string;
  slug: string;
}

// Definisi tipe untuk Supplier
interface Supplier {
  id: string;
  name: string;
}

export default function ManageProductsPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Fungsi untuk mengambil data produk, kategori, dan supplier
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const productsRes = await fetch('/api/products');
      if (!productsRes.ok) {
        throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
      }
      const productsData: Product[] = await productsRes.json();
      setProducts(productsData);

      const categoriesRes = await fetch('/api/categories');
      if (!categoriesRes.ok) {
        throw new Error(`Failed to fetch categories: ${categoriesRes.statusText}`);
      }
      const categoriesData: Category[] = await categoriesRes.json();
      setCategories(categoriesData);

      const suppliersRes = await fetch('/api/suppliers');
      if (!suppliersRes.ok) {
        throw new Error(`Failed to fetch suppliers: ${suppliersRes.statusText}`);
      }
      const suppliersData: Supplier[] = await suppliersRes.json();
      setSuppliers(suppliersData);

    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ambil data saat komponen dimuat
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

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

  // Handler untuk membuka modal tambah produk
  const handleAddProduct = () => {
    setCurrentProduct(null);
    setShowModal(true);
  };

  // Handler untuk membuka modal edit produk
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setShowModal(true);
  };

  // Handler untuk menghapus produk
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`Gagal menghapus produk: ${res.statusText}`);
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus produk.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Component Modal untuk Tambah/Edit Produk
  const ProductModal = ({ onClose, onSave, product, categories, suppliers }: { onClose: () => void; onSave: () => void; product: Product | null; categories: Category[]; suppliers: Supplier[] }) => {
    const [name, setName] = useState(product?.name || '');
    const [slug, setSlug] = useState(product?.slug || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price.toString() || '');
    const [stock, setStock] = useState(product?.stock.toString() || ''); // Ini mungkin akan dihitung dari sizeStocks nanti
    
    // imageUrls sekarang adalah array of strings
    const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrls || []);
    
    // State untuk mengelola file yang dipilih untuk diunggah
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // State untuk mengelola tipe input gambar (URL atau Upload)
    const [imageInputType, setImageInputType] = useState<'url' | 'upload'>(() => {
      // Determine initial image input type based on existing image URLs
      if (product?.imageUrls && product.imageUrls.some(url => url.startsWith('/uploads'))) {
        return 'upload'; // If any existing URL is an uploaded one, default to upload
      }
      return 'url'; // Otherwise, default to URL
    });

    // States untuk ukuran dan stok
    const [sizes, setSizes] = useState<string[]>(product?.sizes || ['']); // Default satu input kosong
    const [sizeStocks, setSizeStocks] = useState<string[]>(product?.sizeStocks.map(String) || ['0']); // Default satu input '0'

    // Pastikan nilai default untuk select selalu string yang valid
    const [categoryId, setCategoryId] = useState(product?.categoryId || (categories.length > 0 ? categories[0].id : ''));
    const [supplierId, setSupplierId] = useState(product?.supplierId || (suppliers.length > 0 ? suppliers[0].id : ''));
    
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    
    // Efek untuk mengatur state saat produk yang diedit berubah
    useEffect(() => {
      setName(product?.name || '');
      setSlug(product?.slug || '');
      setDescription(product?.description || '');
      setPrice(product?.price.toString() || '');
      setStock(product?.stock.toString() || '');
      
      setImageUrls(product?.imageUrls || []);
      setSelectedFiles([]); // Clear selected files on product change
      
      setImageInputType(() => {
        if (product?.imageUrls && product.imageUrls.some(url => url.startsWith('/uploads'))) {
          return 'upload';
        }
        return 'url';
      });

      // Inisialisasi ukuran dan stok
      if (product && product.sizes.length > 0) {
        setSizes(product.sizes);
        setSizeStocks(product.sizeStocks.map(String));
      } else {
        setSizes(['']); // Default satu input kosong
        setSizeStocks(['0']); // Default satu input '0'
      }
      
      setCategoryId(product?.categoryId || (categories.length > 0 ? categories[0].id : ''));
      setSupplierId(product?.supplierId || (suppliers.length > 0 ? suppliers[0].id : ''));
      
      setModalError(null);
    }, [product, categories, suppliers]);

    // Fungsi untuk menghasilkan slug dari nama produk
    const generateSlug = (productName: string) => {
      return productName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Efek untuk otomatis mengisi slug saat nama berubah (jika ini produk baru)
    useEffect(() => {
      if (!product) { // Hanya untuk mode tambah
        setSlug(generateSlug(name));
      }
    }, [name, product]);

    // Handler untuk perubahan URL gambar individual
    const handleImageUrlChange = (index: number, value: string) => {
      const newImageUrls = [...imageUrls];
      newImageUrls[index] = value;
      setImageUrls(newImageUrls);
    };

    // Handler untuk menambah field URL gambar baru
    const handleAddImageUrlField = () => {
      setImageUrls([...imageUrls, '']);
    };

    // Handler untuk menghapus field URL gambar
    const handleRemoveImageUrlField = (index: number) => {
      const newImageUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newImageUrls);
    };

    // Handler untuk perubahan file yang diunggah
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newSelectedFiles: File[] = [];
      const newImagePreviews: string[] = [];
      let hasError = false;

      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) { // Maksimal 5MB per file
          setModalError(`Ukuran file "${file.name}" melebihi 5MB. Silakan pilih gambar yang lebih kecil.`);
          hasError = true;
          return;
        }
        newSelectedFiles.push(file);
        newImagePreviews.push(URL.createObjectURL(file)); // Buat URL objek untuk pratinjau
      });

      if (hasError) {
        e.target.value = ''; // Reset input file
        setSelectedFiles([]);
        setImageUrls([]);
        return;
      }

      setSelectedFiles(newSelectedFiles);
      setImageUrls(newImagePreviews); // Gunakan URL objek untuk pratinjau di UI
      setModalError(null);
    };

    // Handler untuk menghapus file yang dipilih dari daftar upload
    const handleRemoveSelectedFile = (index: number) => {
      // Revoke object URL to free up memory
      if (imageUrls[index] && imageUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(imageUrls[index]);
      }
      const newSelectedFiles = selectedFiles.filter((_, i) => i !== index);
      const newImageUrls = imageUrls.filter((_, i) => i !== index); // Hapus juga dari pratinjau
      setSelectedFiles(newSelectedFiles);
      setImageUrls(newImageUrls);
    };

    // Handler untuk perubahan ukuran
    const handleSizeChange = (index: number, value: string) => {
      const newSizes = [...sizes];
      newSizes[index] = value;
      setSizes(newSizes);
    };

    // Handler untuk perubahan stok ukuran
    const handleSizeStockChange = (index: number, value: string) => {
      const newSizeStocks = [...sizeStocks];
      newSizeStocks[index] = value;
      setSizeStocks(newSizeStocks);
    };

    // Handler untuk menambah field ukuran dan stok baru
    const handleAddSizeField = () => {
      setSizes([...sizes, '']);
      setSizeStocks([...sizeStocks, '0']);
    };

    // Handler untuk menghapus field ukuran dan stok
    const handleRemoveSizeField = (index: number) => {
      const newSizes = sizes.filter((_, i) => i !== index);
      const newSizeStocks = sizeStocks.filter((_, i) => i !== index);
      setSizes(newSizes);
      setSizeStocks(newSizeStocks);
    };


    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setModalLoading(true);
      setModalError(null);

      // Validasi input dasar
      if (!name || !slug || !price || !stock || !categoryId) {
        setModalError('Nama, slug, harga, stok, dan kategori wajib diisi.');
        setModalLoading(false);
        return;
      }
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        setModalError('Harga harus angka positif.');
        setModalLoading(false);
        return;
      }
      // Validasi stok total (jika masih digunakan)
      if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        setModalError('Stok harus angka non-negatif.');
        setModalLoading(false);
        return;
      }
      if (typeof categoryId !== 'string' || categoryId.trim() === '') {
        setModalError('Kategori wajib diisi dan harus valid.');
        setModalLoading(false);
        return;
      }

      // Validasi ukuran dan stok ukuran
      const filteredSizes = sizes.filter(s => s.trim() !== '');
      const parsedSizeStocks = sizeStocks.map(Number); // Konversi ke number
      
      if (filteredSizes.length === 0) {
        setModalError('Setidaknya satu ukuran wajib diisi.');
        setModalLoading(false);
        return;
      }
      if (filteredSizes.length !== parsedSizeStocks.length) {
        setModalError('Jumlah ukuran dan stok ukuran harus sama.');
        setModalLoading(false);
        return;
      }
      if (parsedSizeStocks.some(s => isNaN(s) || s < 0)) {
        setModalError('Stok ukuran harus angka non-negatif.');
        setModalLoading(false);
        return;
      }

      let finalImageUrls: string[] = [];

      if (imageInputType === 'upload') {
        if (selectedFiles.length === 0 && (!product || product.imageUrls.length === 0)) {
          setModalError('Mohon unggah setidaknya satu gambar.');
          setModalLoading(false);
          return;
        }

        // Unggah setiap file yang dipilih
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('image', file); // 'image' harus sesuai dengan field name di /api/upload.ts
          formData.append('targetFolder', 'products'); // Tentukan subfolder untuk produk

          try {
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData, // Tidak perlu 'Content-Type' header untuk FormData
            });

            if (!uploadRes.ok) {
              const errorData = await uploadRes.json();
              throw new Error(errorData.message || `Gagal mengunggah gambar: ${file.name}`);
            }

            const uploadResult = await uploadRes.json();
            finalImageUrls.push(uploadResult.url); // Tambahkan URL yang dikembalikan
          } catch (uploadError: any) {
            setModalError(uploadError.message || `Terjadi kesalahan saat mengunggah gambar: ${file.name}`);
            setModalLoading(false);
            return; // Hentikan proses penyimpanan jika unggahan gagal
          }
        }
        // Jika tidak ada file baru diunggah tapi ada gambar lama, gunakan gambar lama
        if (selectedFiles.length === 0 && product?.imageUrls) {
          finalImageUrls = product.imageUrls;
        }

      } else { // imageInputType === 'url'
        const filteredUrls = imageUrls.filter(url => url.trim() !== '');
        if (filteredUrls.length === 0) {
          setModalError('Setidaknya satu URL gambar wajib diisi.');
          setModalLoading(false);
          return;
        }
        finalImageUrls = filteredUrls;
      }

      const productData = {
        name,
        slug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock), // Kirim stok total
        imageUrls: finalImageUrls, // Kirim array URL gambar yang sudah difilter/diunggah
        sizes: filteredSizes, // Kirim array ukuran yang sudah difilter
        sizeStocks: parsedSizeStocks, // Kirim array stok ukuran yang sudah diparsing
        categoryId,
        supplierId: supplierId === '' ? null : supplierId,
      };

      const method = product ? 'PUT' : 'POST';
      const url = product ? `/api/products?id=${product.id}` : '/api/products';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Gagal ${product ? 'memperbarui' : 'menambahkan'} produk.`);
        }
        onSave();
        onClose();
      } catch (err: any) {
        setModalError(err.message || 'Terjadi kesalahan.');
        console.error('Save error:', err);
      } finally {
        setModalLoading(false);
      }
    };

    return (
      // Modal Overlay
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        {/* Modal Content */}
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl p-6 text-gray-50 overflow-y-auto max-h-[90vh]"> {/* Responsif dan scrollable */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-amber-300">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          
          {modalError && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4">
              {modalError}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-bold mb-2">Nama Produk:</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="slug" className="block text-sm font-bold mb-2">Slug (URL-friendly):</label>
              <input type="text" id="slug" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} required className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <p className="text-xs text-gray-400 mt-1">Slug akan digunakan di URL (contoh: /products/nama-produk-anda)</p>
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-bold mb-2">Deskripsi:</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"> {/* Responsif grid */}
              <div>
                <label htmlFor="price" className="block text-sm font-bold mb-2">Harga:</label>
                <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0" className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-bold mb-2">Stok (Total):</label>
                <input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <p className="text-xs text-gray-400 mt-1">Ini adalah stok total produk. Stok per ukuran diatur di bawah.</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="categoryId" className="block text-sm font-bold mb-2">Kategori:</label>
              <select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="supplierId" className="block text-sm font-bold mb-2">Supplier (Opsional):</label>
              <select id="supplierId" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Pilih Supplier</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
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
                      setSelectedFiles([]); // Clear selected files when switching to URL
                      // Jika ada URL objek dari pratinjau, revoke
                      imageUrls.forEach(url => {
                        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                      });
                      // Set imageUrls kembali ke URL asli jika ada produk yang diedit
                      setImageUrls(product?.imageUrls || []);
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
                      setImageUrls([]); // Clear URLs when switching to upload
                      setModalError(null);
                    }}
                  />
                  <span className="ml-2 text-gray-50">Unggah Gambar</span>
                </label>
              </div>

              {imageInputType === 'url' ? (
                // Input untuk URL gambar
                <div className="mb-6 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-amber-200 mb-3">URL Gambar Produk:</h3>
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder={`URL Gambar ${index + 1}`}
                        className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrlField(index)}
                        className="p-2 text-red-500 hover:text-red-400 transition-colors duration-200 rounded-full"
                        title="Hapus Gambar"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddImageUrlField}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200 text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah URL Gambar</span>
                  </button>
                </div>
              ) : (
                // Input untuk unggah file
                <div className="mb-6 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-amber-200 mb-3">Unggah Gambar Produk:</h3>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    multiple // Izinkan multiple file
                    onChange={handleFileChange}
                    // Required jika upload dipilih DAN tidak ada file yang dipilih DAN tidak ada gambar lama
                    required={imageInputType === 'upload' && selectedFiles.length === 0 && (!product || product.imageUrls.length === 0)}
                    className="block w-full text-sm text-gray-50
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-amber-700 file:text-white
                      hover:file:bg-amber-600"
                  />
                  {/* Pratinjau gambar yang diunggah */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative w-24 h-24 border border-gray-700 rounded-md overflow-hidden">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/96x96/333333/cccccc?text=Error')} />
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(index)}
                          className="absolute top-1 right-1 bg-red-600 rounded-full text-white p-0.5 hover:bg-red-500"
                          title="Hapus Gambar Ini"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ukuran & Stok Produk */}
            <div className="mb-6 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-amber-200 mb-3">Ukuran & Stok Produk:</h3>
              {sizes.map((size, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => handleSizeChange(index, e.target.value)}
                    placeholder="Ukuran (misal: S, M, L, 38)"
                    className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="number"
                    value={sizeStocks[index]}
                    onChange={(e) => handleSizeStockChange(index, e.target.value)}
                    min="0"
                    className="shadow appearance-none border border-gray-700 rounded-lg w-24 py-2 px-3 bg-gray-700 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSizeField(index)}
                    className="p-2 text-red-500 hover:text-red-400 transition-colors duration-200 rounded-full"
                    title="Hapus Ukuran"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddSizeField}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Ukuran</span>
              </button>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-gray-50 font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                Batal
              </button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                {modalLoading ? <Loader2 className="animate-spin w-5 h-5 inline mr-2" /> : null}
                {product ? 'Simpan Perubahan' : 'Tambah Produk'}
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
        <title>Kelola Produk - Admin</title>
        <meta name="description" content="Kelola produk untuk toko Anda" />
      </Head>

      <div className="min-h-screen bg-gray-950 p-4 md:p-8 text-gray-50">
        <div className="container mx-auto bg-gray-900 rounded-lg shadow-xl p-4 md:p-8 border border-gray-800">
          <h1 className="text-2xl md:text-3xl font-bold text-amber-300 mb-4 md:mb-6">Kelola Produk</h1>
          <p className="text-gray-300 text-sm md:text-base mb-4">Di sini Anda dapat menambah, mengedit, dan menghapus produk.</p>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4">
              Error: {error}
            </div>
          )}

          <div className="flex justify-end mb-4 md:mb-6">
            <button
              onClick={handleAddProduct}
              className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200 text-sm md:text-base"
            >
              <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
              <p className="ml-2 text-gray-300">Memuat produk...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-300 py-10">Tidak ada produk ditemukan. Klik "Tambah Produk Baru" untuk memulai!</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gambar</th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama Produk</th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kategori</th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier</th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Harga</th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stok</th>
                    <th scope="col" className="px-3 py-2 md:px-6 md:py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-700 transition duration-150 ease-in-out">
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap">
                        {/* Tampilkan gambar pertama jika ada */}
                        <img 
                          src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/60x40/333333/cccccc?text=No+Image'} 
                          alt={product.name} 
                          className="h-10 w-15 object-cover rounded-md" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/60x40/333333/cccccc?text=No+Image';
                            e.currentTarget.alt = 'Gambar tidak tersedia';
                          }} 
                        />
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium text-gray-50">{product.name}</td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-300">{product.category.name}</td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-300">{product.supplier?.name || 'N/A'}</td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-300">Rp{product.price.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-300">{product.stock}</td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2 md:space-x-3">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-amber-400 hover:text-amber-300 transition duration-200"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-400 transition duration-200"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
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

      {/* Conditional rendering of the ProductModal */}
      {showModal && (
        <ProductModal
          onClose={() => { setShowModal(false); fetchData(); }}
          onSave={fetchData}
          product={currentProduct}
          categories={categories}
          suppliers={suppliers}
        />
      )}
    </>
  );
}
