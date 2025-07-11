// pages/auth/register.tsx

import { useState } from 'react';
import { useRouter } from 'next/router'; // Untuk navigasi setelah registrasi (di Pages Router)
import Link from 'next/link'; // Untuk tautan ke halaman login

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // State untuk indikator loading
  const router = useRouter();

  // Handler untuk submit form registrasi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah refresh halaman
    setError(null); // Reset error sebelumnya
    setSuccess(null); // Reset pesan sukses sebelumnya
    setLoading(true); // Aktifkan loading

    try {
      // Kirim data registrasi ke API Route kita
      const response = await fetch('/api/auth/register', { // Mengirim ke API Route kustom
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Jika respons tidak OK (misal: status 400, 409, 500)
        setError(data.message || 'Registration failed. Please try again.');
      } else {
        // Jika registrasi berhasil
        setSuccess(data.message || 'Registration successful! You can now log in.');
        // Opsional: kosongkan form setelah sukses
        setName('');
        setEmail('');
        setPassword('');
        // Opsional: redirect ke halaman login setelah beberapa detik
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000); // Redirect setelah 3 detik
      }
    } catch (err: any) {
      // Tangani error jaringan atau error tak terduga
      setError('An unexpected error occurred. Please check your network and try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false); // Nonaktifkan loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Daftar Akun Baru</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Sukses!</strong>
            <span className="block sm:inline"> {success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Nama Lengkap:
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
              disabled={loading}
            >
              {loading ? 'Mendaftar...' : 'Daftar'}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-bold">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
