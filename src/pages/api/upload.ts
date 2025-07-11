// pages/api/upload.ts

import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable'; // Import formidable and File type
import path from 'path'; // For working with file paths
import fs from 'fs/promises'; // For asynchronous file system operations

// Disable Next.js's default body parser for this API route
// Because we will manually handle parsing multipart/form-data with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let uploadedFile: File | undefined; // Deklarasikan di sini untuk cleanup di blok catch

  try {
    // Inisialisasi formidable. Gunakan direktori sementara untuk unggahan awal.
    // Formidable akan menyimpan file di sini sebelum kita memindahkannya ke lokasi final.
    const tempUploadDir = path.join(process.cwd(), '.tmp');
    await fs.mkdir(tempUploadDir, { recursive: true }); // Pastikan direktori sementara ada

    const form = formidable({
      uploadDir: tempUploadDir, // Direktori sementara untuk unggahan formidable
      keepExtensions: true, // Pertahankan ekstensi file asli
      maxFileSize: 2 * 1024 * 1024, // Batasi ukuran file hingga 2MB
      filename: (name, ext, part) => {
        // Buat nama file unik menggunakan timestamp dan nama asli
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalFileName = part.originalFilename ? part.originalFilename.replace(/\s+/g, '-').toLowerCase() : 'file';
        return `${originalFileName.split('.')[0]}-${uniqueSuffix}${ext}`;
      },
    });

    // Parse data form
    const [fields, files] = await form.parse(req);

    // Pastikan file gambar diunggah
    uploadedFile = files.image?.[0] as File; // 'image' adalah nama field input file di frontend
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    // Ekstrak folder target dari field form (misalnya 'products', 'hero-slides')
    const targetFolderArray = fields.targetFolder;
    const targetFolder = Array.isArray(targetFolderArray) ? targetFolderArray[0] : (targetFolderArray || 'misc'); // Default ke 'misc'

    // Validasi targetFolder untuk mencegah serangan directory traversal
    if (targetFolder.includes('..') || targetFolder.startsWith('/') || targetFolder.startsWith('\\')) {
      await fs.unlink(uploadedFile.filepath); // Bersihkan file sementara yang diunggah
      return res.status(400).json({ message: 'Invalid target folder name.' });
    }

    // Tentukan direktori unggahan final
    const finalUploadDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
    await fs.mkdir(finalUploadDir, { recursive: true }); // Buat direktori final jika tidak ada

    // Tentukan path file baru di direktori final
    const newFilePath = path.join(finalUploadDir, path.basename(uploadedFile.filepath));

    // Pindahkan file dari lokasi sementara ke tujuan final
    await fs.rename(uploadedFile.filepath, newFilePath);

    // Dapatkan path relatif dari folder public
    // Contoh: /uploads/products/unique-filename.jpg
    // PENTING: Gunakan path.posix.join untuk memastikan forward slashes (/)
    const relativePath = path.posix.join('/uploads', targetFolder, path.basename(newFilePath));

    // --- DEBUGGING: Log path final relatif dan detail file ---
    console.log('Image initially uploaded to temporary path:', uploadedFile.filepath);
    console.log('Moved to final path:', newFilePath);
    console.log('Final relative URL:', relativePath);
    // --- AKHIR DEBUGGING ---

    // Kirim respons sukses dengan URL gambar
    return res.status(200).json({
      message: 'Image uploaded successfully!',
      url: relativePath,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    // Coba bersihkan file sementara jika ada dan error terjadi setelah parsing
    if (uploadedFile && uploadedFile.filepath) {
      try {
        await fs.unlink(uploadedFile.filepath);
        console.log('Cleaned up temporary file:', uploadedFile.filepath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }

    if (error.code === 1009) { // Kode error Formidable untuk ukuran file terlalu besar
      return res.status(413).json({ message: 'File size too large. Max 2MB allowed.' });
    }
    return res.status(500).json({ message: 'Failed to upload image.', error: error.message });
  }
}
