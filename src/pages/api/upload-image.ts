// pages/api/upload-image.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable'; // Untuk mengurai multipart/form-data
import { v2 as cloudinary } from 'cloudinary'; // Cloudinary SDK
import fs from 'fs'; // Node.js File System module

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Pastikan menggunakan HTTPS
});

// Penting: Nonaktifkan body parser bawaan Next.js untuk route ini
// karena kita akan menanganinya secara manual dengan formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode Tidak Diizinkan. Hanya POST yang didukung.' });
  }

  // Buat instance formidable
  const form = new IncomingForm({
    multiples: false, // Kita hanya mengizinkan satu file per permintaan unggah
    keepExtensions: true, // Pertahankan ekstensi file asli
    maxFileSize: 5 * 1024 * 1024, // Maksimal 5MB (sesuaikan jika perlu)
  });

  try {
    // Parse permintaan form data
    const [fields, files] = await form.parse(req);

    // Pastikan ada file yang diunggah
    const file = files.image?.[0]; // Mengakses file dari array 'image'
    if (!file) {
      return res.status(400).json({ message: 'Tidak ada file gambar yang diunggah.' });
    }

    // Unggah file ke Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'ecommerce-products', // Folder di Cloudinary Anda (sesuaikan jika perlu)
      public_id: `${Date.now()}-${file.originalFilename}`, // Nama file unik di Cloudinary
    });

    // Hapus file sementara setelah diunggah
    fs.unlink(file.filepath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    // Kirim kembali URL gambar yang aman
    return res.status(200).json({ imageUrl: result.secure_url });

  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    // Tangani error spesifik dari formidable atau Cloudinary
    if (error.message.includes('maxFileSize exceeded')) {
      return res.status(413).json({ message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
    }
    return res.status(500).json({ message: 'Gagal mengunggah gambar.', error: error.message });
  }
}
