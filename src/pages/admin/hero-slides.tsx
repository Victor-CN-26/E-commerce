// pages/admin/hero-slides.tsx

import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'; // Tambahkan ikon Image

// Type definition for HeroSlide
interface HeroSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string; // Will be formatted as string
  updatedAt: string; // Will be formatted as string
}

export default function ManageHeroSlidesPage() {
  const { data: session, status } = useSession();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // State for add/edit modal
  const [currentSlide, setCurrentSlide] = useState<HeroSlide | null>(null); // State for the slide being edited

  // Function to fetch hero slides data
  const fetchHeroSlides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hero-slides'); // Fetch from the API route we created
      if (!res.ok) {
        throw new Error(`Failed to fetch slides: ${res.statusText}`);
      }
      const data: HeroSlide[] = await res.json();
      setSlides(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hero slides.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or session status changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchHeroSlides();
    }
  }, [status]);

  // Access handling (same as in admin dashboard)
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
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-center">You do not have permission to view this page.</p>
        <Link href="/auth/login" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
          Go to Login
        </Link>
      </div>
    );
  }

  // Handler to open add slide modal
  const handleAddSlide = () => {
    setCurrentSlide(null); // Reset the slide being edited
    setShowModal(true);
  };

  // Handler to open edit slide modal
  const handleEditSlide = (slide: HeroSlide) => {
    setCurrentSlide(slide);
    setShowModal(true);
  };

  // Handler to delete slide
  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/hero-slides?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`Failed to delete slide: ${res.statusText}`);
      }
      fetchHeroSlides(); // Refresh the slide list
    } catch (err: any) {
      setError(err.message || 'Failed to delete slide.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modal Component for Add/Edit Slide
  const SlideModal = ({ onClose, onSave, slide }: { onClose: () => void; onSave: (slideData: any) => void; slide: HeroSlide | null }) => {
    const [title, setTitle] = useState(slide?.title || '');
    const [description, setDescription] = useState(slide?.description || '');
    const [imageUrl, setImageUrl] = useState(slide?.imageUrl || ''); // This will store URL or Data URL (Base64)
    const [linkUrl, setLinkUrl] = useState(slide?.linkUrl || '');
    const [order, setOrder] = useState(slide?.order || 0);
    const [isActive, setIsActive] = useState(slide?.isActive ?? true); // Default true
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [imageInputType, setImageInputType] = useState<'url' | 'upload'>(
      slide?.imageUrl && !slide.imageUrl.startsWith('data:') ? 'url' : 'url' // Default to 'url' if existing image is a URL, otherwise 'url' for new
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to hold the selected file object

    // Image preview
    const [imagePreview, setImagePreview] = useState<string | null>(slide?.imageUrl || null);

    // Effect to set preview when slide changes
    useEffect(() => {
      setImagePreview(slide?.imageUrl || null);
      setImageInputType(slide?.imageUrl && !slide.imageUrl.startsWith('data:') ? 'url' : 'url');
      setSelectedFile(null); // Clear selected file on slide change
    }, [slide]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) { // Limit file size to 2MB
          setModalError('File size exceeds 2MB. Please choose a smaller image.');
          e.target.value = ''; // Reset file input
          setSelectedFile(null); // Clear selected file
          setImageUrl('');
          setImagePreview(null);
          return;
        }

        setSelectedFile(file); // Store the file object
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImageUrl(reader.result as string); // Store Base64 as imageUrl temporarily for preview
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

      let finalImageUrl = imageUrl; // Default to current imageUrl state (could be URL or Base64)

      // Handle image upload if 'upload' type is selected and a file is chosen
      if (imageInputType === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile); // 'image' must match the field name in /api/upload.ts

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData, // No 'Content-Type' header needed for FormData
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || 'Failed to upload image.');
          }

          const uploadResult = await uploadRes.json();
          finalImageUrl = uploadResult.url; // Use the URL returned by the upload API
        } catch (uploadError: any) {
          setModalError(uploadError.message || 'An error occurred during image upload.');
          setModalLoading(false);
          return; // Stop the save process if upload fails
        }
      } else if (imageInputType === 'upload' && !selectedFile && !slide?.imageUrl) {
        // If upload is selected but no file is chosen and no existing image for edit
        setModalError('Please upload an image or provide an image URL.');
        setModalLoading(false);
        return;
      } else if (imageInputType === 'url' && !imageUrl) {
        // If URL is selected but no URL is provided
        setModalError('Please provide an image URL.');
        setModalLoading(false);
        return;
      }


      const slideData = { title, description, imageUrl: finalImageUrl, linkUrl, order: Number(order), isActive };
      const method = slide ? 'PUT' : 'POST';
      const url = slide ? `/api/hero-slides?id=${slide.id}` : '/api/hero-slides';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slideData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to ${slide ? 'update' : 'add'} slide.`);
        }
        onSave(slideData); // Call onSave function from parent
        onClose(); // Close the modal
      } catch (err: any) {
        setModalError(err.message || 'An error occurred.');
        console.error('Save error:', err);
      } finally {
        setModalLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{slide ? 'Edit Hero Slide' : 'Add New Hero Slide'}</h2>
          
          {modalError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {modalError}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Judul:</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Deskripsi:</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            {/* Pilihan Input Gambar */}
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
                      // If switching from upload, clear selected file and preview if it was a data URL
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
                      setImageUrl(''); // Clear URL when switching to upload
                      setImagePreview(null); // Clear preview
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
                    setImagePreview(e.target.value); // Update preview as URL changes
                  }}
                  required={imageInputType === 'url'} // Required only if URL is selected
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="misal: https://example.com/image.jpg"
                />
              ) : (
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={imageInputType === 'upload' && !slide?.imageUrl} // Required if upload and no existing image
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

            <div className="mb-4">
              <label htmlFor="linkUrl" className="block text-gray-700 text-sm font-bold mb-2">URL Tautan:</label>
              <input type="url" id="linkUrl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="order" className="block text-gray-700 text-sm font-bold mb-2">Urutan:</label>
              <input type="number" id="order" value={order} onChange={(e) => setOrder(Number(e.target.value))} required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-6 flex items-center">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="isActive" className="text-gray-700 text-sm font-bold">Aktif</label>
            </div>
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                Batal
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200" disabled={modalLoading}>
                {modalLoading ? <Loader2 className="animate-spin w-5 h-5 inline mr-2" /> : null}
                {slide ? 'Simpan Perubahan' : 'Tambah Slide'}
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
        <title>Kelola Hero Slides - Admin</title>
        <meta name="description" content="Kelola hero slides untuk halaman beranda" />
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="container mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Kelola Hero Slides</h1>
          <p className="text-gray-600 mb-4">Di sini Anda dapat menambah, mengedit, dan menghapus banner hero yang ditampilkan di halaman beranda Anda.</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              Error: {error}
            </div>
          )}

          <div className="flex justify-end mb-6">
            <button
              onClick={handleAddSlide}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Tambah Slide Baru</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
              <p className="ml-2 text-gray-600">Memuat slide...</p>
            </div>
          ) : slides.length === 0 ? (
            <p className="text-center text-gray-600 py-10">Tidak ada hero slide ditemukan. Klik "Tambah Slide Baru" untuk memulai!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Urutan</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Judul</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Gambar</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Aktif</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map((slide) => (
                    <tr key={slide.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-800">{slide.order}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{slide.title}</td>
                      <td className="py-3 px-4">
                        <img src={slide.imageUrl} alt={slide.title} className="w-20 h-12 object-cover rounded-md shadow-sm" onError={(e) => (e.currentTarget.src = 'https://placehold.co/80x48?text=No+Image')} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">
                        {slide.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ya
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Tidak
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditSlide(slide)}
                            className="text-blue-600 hover:text-blue-800 transition duration-200"
                            title="Edit Slide"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="text-red-600 hover:text-red-800 transition duration-200"
                            title="Hapus Slide"
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
        <SlideModal
          onClose={() => { setShowModal(false); fetchHeroSlides(); }} // Refresh data after modal is closed
          onSave={fetchHeroSlides} // Refresh data after save
          slide={currentSlide}
        />
      )}
    </>
  );
}
