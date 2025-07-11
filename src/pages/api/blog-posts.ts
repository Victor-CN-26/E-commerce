// pages/api/blog-posts.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Mengimpor instance Prisma Client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id, slug } = query; // Ambil id dan slug dari query parameter

  switch (method) {
    case 'GET':
      try {
        if (id) {
          // Ambil satu postingan berdasarkan ID (jika diperlukan di masa mendatang)
          const post = await prisma.post.findUnique({
            where: { id: String(id) },
            include: {
              author: {
                select: { name: true, email: true },
              },
            },
          });
          if (!post) {
            return res.status(404).json({ message: 'Postingan blog tidak ditemukan.' });
          }
          return res.status(200).json({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            image: post.imageUrl,
            published: post.published,
            authorId: post.authorId,
            authorName: post.author?.name || 'Unknown Author',
            publishedDate: new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
          });
        } else if (slug) {
          // Ambil satu postingan berdasarkan SLUG
          const post = await prisma.post.findUnique({
            where: { slug: String(slug) },
            include: {
              author: {
                select: { name: true, email: true },
              },
            },
          });
          if (!post || !post.published) { // Pastikan hanya postingan yang dipublikasikan yang bisa diakses
            return res.status(404).json({ message: 'Postingan blog tidak ditemukan atau belum dipublikasikan.' });
          }
          return res.status(200).json({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            image: post.imageUrl,
            published: post.published,
            authorId: post.authorId,
            authorName: post.author?.name || 'Unknown Author',
            publishedDate: new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
          });
        } else {
          // Ambil SEMUA postingan blog yang sudah dipublikasikan (untuk halaman daftar)
          const posts = await prisma.post.findMany({
            where: {
              published: true, // Hanya ambil postingan yang sudah dipublikasikan
            },
            orderBy: {
              createdAt: 'desc', // Urutkan berdasarkan tanggal pembuatan terbaru
            },
            // Hapus 'take: 3' agar semua postingan diambil
            include: {
              author: { // Sertakan informasi penulis
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

          // Format data agar sesuai dengan yang diharapkan frontend
          const formattedPosts = posts.map(post => ({
            id: post.id,
            title: post.title,
            excerpt: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''), // Ambil 150 karakter pertama sebagai excerpt
            image: post.imageUrl || 'https://placehold.co/400x250/333333/cccccc?text=No+Image', // Gambar placeholder jika tidak ada
            link: `/blog/${post.slug}`, // Link ke detail blog post
            authorName: post.author?.name || 'Unknown Author',
            publishedDate: new Date(post.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
          }));

          return res.status(200).json(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        return res.status(500).json({ message: 'Failed to fetch blog posts.' });
      }

    case 'POST':
      try {
        const { title, slug, content, imageUrl, published, authorId } = req.body;

        if (!title || !slug || !content || !authorId) {
          return res.status(400).json({ message: 'Judul, slug, konten, dan ID penulis wajib diisi.' });
        }

        const existingPost = await prisma.post.findUnique({
          where: { slug: slug },
        });

        if (existingPost) {
          return res.status(409).json({ message: 'Slug postingan sudah ada. Mohon pilih slug lain.' });
        }

        const newPost = await prisma.post.create({
          data: {
            title,
            slug,
            content,
            imageUrl,
            published,
            authorId,
          },
        });
        return res.status(201).json({ message: 'Postingan blog berhasil dibuat!', post: newPost });
      } catch (error) {
        console.error('Error creating blog post:', error);
        return res.status(500).json({ message: 'Gagal membuat postingan blog.' });
      }

    case 'PUT':
      try {
        const { id } = req.query;
        const { title, slug, content, imageUrl, published, authorId } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'ID postingan wajib diisi untuk pembaruan.' });
        }
        if (!title || !slug || !content || !authorId) {
          return res.status(400).json({ message: 'Judul, slug, konten, dan ID penulis wajib diisi.' });
        }

        const existingPostWithSlug = await prisma.post.findFirst({
          where: {
            slug: slug,
            NOT: { id: String(id) },
          },
        });

        if (existingPostWithSlug) {
          return res.status(409).json({ message: 'Slug postingan sudah ada untuk postingan lain. Mohon pilih slug lain.' });
        }

        const updatedPost = await prisma.post.update({
          where: { id: String(id) },
          data: {
            title,
            slug,
            content,
            imageUrl,
            published,
            authorId,
          },
        });
        return res.status(200).json({ message: 'Postingan blog berhasil diperbarui!', post: updatedPost });
      } catch (error) {
        console.error('Error updating blog post:', error);
        return res.status(500).json({ message: 'Gagal memperbarui postingan blog.' });
      }

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ message: 'ID postingan wajib diisi untuk penghapusan.' });
        }

        await prisma.post.delete({
          where: { id: String(id) },
        });
        return res.status(200).json({ message: 'Postingan blog berhasil dihapus!' });
      } catch (error) {
        console.error('Error deleting blog post:', error);
        return res.status(500).json({ message: 'Gagal menghapus postingan blog.' });
      }

    default:
      return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
  }
}
