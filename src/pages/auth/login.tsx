// pages/auth/login.tsx

import { useState } from 'react';
import { signIn } from 'next-auth/react'; // Mengimpor fungsi signIn dari NextAuth.js
import { useRouter } from 'next/router'; // Untuk navigasi setelah login (di Pages Router)
import Link from 'next/link'; // Untuk tautan ke halaman registrasi
import { Loader2, Mail, Lock } from 'lucide-react'; // Import ikon Mail dan Lock

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // State untuk indikator loading
  const router = useRouter();

  // Handler untuk submit form login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah refresh halaman
    setError(null); // Reset error sebelumnya
    setLoading(true); // Aktifkan loading

    try {
      // Panggil fungsi signIn dari NextAuth.js
      // Dengan provider 'credentials' dan redirect: false
      const result = await signIn('credentials', {
        redirect: false, // Penting: Jangan redirect dari sini
        email,
        password,
      });

      // Cek jika ada error dari NextAuth.js
      if (result?.error) {
        // Pesan error yang lebih user-friendly
        if (result.error === 'CredentialsSignin') {
          setError('Email atau password salah. Mohon periksa kembali.');
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        // Jika login berhasil, redirect ke halaman dashboard atau home
        router.push('/'); // Ganti dengan halaman default setelah login
      }
    } catch (err: any) {
      // Tangani error lain yang mungkin terjadi
      setError('Terjadi kesalahan tak terduga. Mohon coba lagi.');
      console.error('Login error:', err);
    } finally {
      setLoading(false); // Nonaktifkan loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4"> {/* Background gelap */}
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800"> {/* Card lebih gelap, shadow kuat, border */}
        <h2 className="text-3xl font-bold text-center mb-6 text-amber-300">Login ke Akun Anda</h2> {/* Judul lebih besar, warna aksen */}
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded relative mb-4" role="alert"> {/* Error message tema gelap */}
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2"> {/* Label warna terang */}
              Email:
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" /> {/* Ikon email */}
              <input
                type="email"
                id="email"
                className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 pl-10 bg-gray-800 text-gray-50 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" // Input field tema gelap
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2"> {/* Label warna terang */}
              Password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" /> {/* Ikon password */}
              <input
                type="password"
                id="password"
                className="shadow appearance-none border border-gray-700 rounded-lg w-full py-2 px-3 pl-10 bg-gray-800 text-gray-50 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500" // Input field tema gelap
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-gray-950 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full flex items-center justify-center" // Tombol login tema gelap, dengan ikon loading
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
              ) : null}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4"> {/* Teks warna terang */}
          Belum punya akun?{' '}
          <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 font-bold transition duration-200"> {/* Link warna aksen */}
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
