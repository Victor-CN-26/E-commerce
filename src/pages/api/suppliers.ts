    // pages/api/suppliers.ts

    import { NextApiRequest, NextApiResponse } from 'next';
    import prisma from '@/lib/db';
    import { getServerSession } from 'next-auth';
    import { authOptions } from '@/lib/auth';

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      const session = await getServerSession(req, res, authOptions);

      if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ message: 'Akses Ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.' });
      }

      const { method, query, body } = req;
      const { id } = query;

      switch (method) {
        case 'GET':
          try {
            if (id) {
              // Ambil satu supplier berdasarkan ID
              const supplier = await prisma.supplier.findUnique({
                where: { id: String(id) },
              });
              if (!supplier) {
                return res.status(404).json({ message: 'Supplier tidak ditemukan.' });
              }
              return res.status(200).json(supplier);
            } else {
              // Ambil semua supplier
              const suppliers = await prisma.supplier.findMany({
                orderBy: {
                  name: 'asc',
                },
              });
              return res.status(200).json(suppliers);
            }
          } catch (error) {
            console.error('Error fetching suppliers:', error);
            return res.status(500).json({ message: 'Gagal mengambil supplier.' });
          }

        case 'POST':
          try {
            const { name, contactEmail, contactPhone, address } = body;

            if (!name) {
              return res.status(400).json({ message: 'Nama supplier wajib diisi.' });
            }

            const existingSupplier = await prisma.supplier.findUnique({
              where: { name: name },
            });
            if (existingSupplier) {
              return res.status(409).json({ message: 'Nama supplier sudah ada. Mohon pilih nama lain.' });
            }

            const newSupplier = await prisma.supplier.create({
              data: {
                name,
                contactEmail,
                contactPhone,
                address,
              },
            });
            return res.status(201).json({ message: 'Supplier berhasil dibuat!', supplier: newSupplier });
          } catch (error) {
            console.error('Error creating supplier:', error);
            return res.status(500).json({ message: 'Gagal membuat supplier.' });
          }

        case 'PUT':
          try {
            const { id: supplierId } = query;
            const { name, contactEmail, contactPhone, address } = body;

            if (!supplierId) {
              return res.status(400).json({ message: 'ID supplier wajib diisi untuk pembaruan.' });
            }
            if (!name) {
              return res.status(400).json({ message: 'Nama supplier wajib diisi.' });
            }

            const existingSupplierWithName = await prisma.supplier.findFirst({
              where: {
                name: name,
                NOT: { id: String(supplierId) },
              },
            });
            if (existingSupplierWithName) {
              return res.status(409).json({ message: 'Nama supplier sudah ada untuk supplier lain. Mohon pilih nama lain.' });
            }

            const updatedSupplier = await prisma.supplier.update({
              where: { id: String(supplierId) },
              data: {
                name,
                contactEmail,
                contactPhone,
                address,
              },
            });
            return res.status(200).json({ message: 'Supplier berhasil diperbarui!', supplier: updatedSupplier });
          } catch (error) {
            console.error('Error updating supplier:', error);
            return res.status(500).json({ message: 'Gagal memperbarui supplier.' });
          }

        case 'DELETE':
          try {
            const { id: supplierId } = query;

            if (!supplierId) {
              return res.status(400).json({ message: 'ID supplier wajib diisi untuk penghapusan.' });
            }

            await prisma.supplier.delete({
              where: { id: String(supplierId) },
            });
            return res.status(200).json({ message: 'Supplier berhasil dihapus!' });
          } catch (error) {
            console.error('Error deleting supplier:', error);
            // Tangani error jika supplier masih memiliki produk terkait
            if (error instanceof Error && error.message.includes('Foreign key constraint failed')) {
              return res.status(409).json({ message: 'Tidak dapat menghapus supplier karena masih ada produk yang terkait dengannya. Mohon hapus atau ubah produk terkait terlebih dahulu.' });
            }
            return res.status(500).json({ message: 'Gagal menghapus supplier.' });
          }

        default:
          return res.status(405).json({ message: 'Metode Tidak Diizinkan' });
      }
    }
    