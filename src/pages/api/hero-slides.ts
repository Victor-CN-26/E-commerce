// pages/api/hero-slides.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Mengimpor instance Prisma Client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        // Ambil semua hero slides yang aktif, diurutkan berdasarkan 'order'
        const slides = await prisma.heroSlide.findMany({
          orderBy: {
            order: 'asc', // Urutkan berdasarkan kolom 'order' secara ascending
          },
        });
        return res.status(200).json(slides);
      } catch (error) {
        console.error('Error fetching hero slides:', error);
        return res.status(500).json({ message: 'Failed to fetch hero slides.' });
      }

    case 'POST':
      try {
        const { title, description, imageUrl, linkUrl, order, isActive } = req.body;

        // Validasi input
        if (!title || !imageUrl || order === undefined) {
          return res.status(400).json({ message: 'Title, imageUrl, and order are required.' });
        }

        // Cek apakah 'order' sudah ada
        const existingSlideWithOrder = await prisma.heroSlide.findUnique({
          where: { order: Number(order) },
        });

        if (existingSlideWithOrder) {
          return res.status(409).json({ message: 'Order number already exists. Please choose a different one.' });
        }

        const newSlide = await prisma.heroSlide.create({
          data: {
            title,
            description,
            imageUrl,
            linkUrl,
            order: Number(order),
            isActive: Boolean(isActive),
          },
        });
        return res.status(201).json({ message: 'Hero slide created successfully!', slide: newSlide });
      } catch (error) {
        console.error('Error creating hero slide:', error);
        return res.status(500).json({ message: 'Failed to create hero slide.' });
      }

    case 'PUT':
      try {
        const { id } = req.query; // Ambil ID dari query parameter
        const { title, description, imageUrl, linkUrl, order, isActive } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'Slide ID is required for update.' });
        }
        if (!title || !imageUrl || order === undefined) {
          return res.status(400).json({ message: 'Title, imageUrl, and order are required.' });
        }

        // Cek apakah 'order' sudah ada untuk slide lain
        const existingSlideWithOrder = await prisma.heroSlide.findFirst({
          where: {
            order: Number(order),
            NOT: { id: String(id) }, // Kecualikan slide yang sedang diedit
          },
        });

        if (existingSlideWithOrder) {
          return res.status(409).json({ message: 'Order number already exists for another slide. Please choose a different one.' });
        }

        const updatedSlide = await prisma.heroSlide.update({
          where: { id: String(id) },
          data: {
            title,
            description,
            imageUrl,
            linkUrl,
            order: Number(order),
            isActive: Boolean(isActive),
          },
        });
        return res.status(200).json({ message: 'Hero slide updated successfully!', slide: updatedSlide });
      } catch (error) {
        console.error('Error updating hero slide:', error);
        return res.status(500).json({ message: 'Failed to update hero slide.' });
      }

    case 'DELETE':
      try {
        const { id } = req.query; // Ambil ID dari query parameter

        if (!id) {
          return res.status(400).json({ message: 'Slide ID is required for deletion.' });
        }

        await prisma.heroSlide.delete({
          where: { id: String(id) },
        });
        return res.status(200).json({ message: 'Hero slide deleted successfully!' });
      } catch (error) {
        console.error('Error deleting hero slide:', error);
        return res.status(500).json({ message: 'Failed to delete hero slide.' });
      }

    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
