// components/layout/Header.tsx

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
// Import semua ikon yang diperlukan langsung dari 'lucide-react'
import { Menu, X, ChevronDown, LogOut, User, Settings, LayoutDashboard, Home, BookOpen, ShoppingCart, Package, Sliders, FileText, List, Users } from 'lucide-react'; // Menambahkan ikon Users

import { useCart } from '@/context/CartContext'; // Import useCart hook

export default function Header() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter(); // Inisialisasi useRouter

  // Gunakan cartItemCount dari useCart hook
  const { cartItemCount } = useCart();

  // State untuk melacak apakah komponen sudah di-mount di sisi klien
  const [hasMounted, setHasMounted] = useState(false);

  // Set hasMounted menjadi true setelah komponen di-mount di klien
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const handleAdminNavigation = (path: string) => {
    setIsDropdownOpen(false); // Tutup dropdown sebelum navigasi
    router.push(path); // Gunakan router.push standar
  };

  return (
    <header className="bg-gray-950 text-gray-50 shadow-xl sticky top-0 z-40 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-3xl font-extrabold text-amber-400 hover:text-amber-300 transition duration-200">
          MyEcom
        </Link>

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-lg font-medium text-gray-300 hover:text-amber-400 transition duration-200 flex items-center">
            <Home className="w-5 h-5 mr-1" /> Home
          </Link>
          <Link href="/products" className="text-lg font-medium text-gray-300 hover:text-amber-400 transition duration-200 flex items-center">
            <Package className="w-5 h-5 mr-1" /> Products
          </Link>
          <Link href="/blog" className="text-lg font-medium text-gray-300 hover:text-amber-400 transition duration-200 flex items-center">
            <BookOpen className="w-5 h-5 mr-1" /> Blog
          </Link>
          <Link href="/contact" className="text-lg font-medium text-gray-300 hover:text-amber-400 transition duration-200">
            Contact
          </Link>

          {/* Tautan Keranjang Belanja */}
          <Link href="/cart" className="relative flex items-center text-gray-300 hover:text-amber-400 transition duration-200">
            <ShoppingCart className="w-6 h-6" />
            {/* Hanya render badge jika komponen sudah di-mount di klien dan ada item */}
            {hasMounted && cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold shadow-sm">
                {cartItemCount}
              </span>
            )}
          </Link>

          {status === 'authenticated' ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center text-lg font-medium bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-gray-700"
              >
                <User className="w-5 h-5 mr-2 text-amber-400" />
                {session.user?.name || session.user?.email}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-1 z-50 border border-gray-700">
                  <Link href="/account" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={toggleDropdown}>
                    <User className="w-4 h-4 mr-2" /> My Account
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-700 my-1"></div>
                      <span className="block px-4 py-2 text-xs text-gray-500 uppercase">Admin Panel</span>
                      {/* Tautan Kelola Pengguna */}
                      <Link href="/admin/users" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={() => handleAdminNavigation('/admin/users')}>
                        <Users className="w-4 h-4 mr-2" /> Kelola Pengguna
                      </Link>
                      <Link href="/admin" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={() => handleAdminNavigation('/admin')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Dashboard
                      </Link>
                      <Link href="/admin/products" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={() => handleAdminNavigation('/admin/products')}>
                        <Package className="w-4 h-4 mr-2" /> Kelola Produk
                      </Link>
                      <Link href="/admin/categories" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={() => handleAdminNavigation('/admin/categories')}>
                        <List className="w-4 h-4 mr-2" /> Kelola Kategori
                      </Link>
                      <Link href="/admin/hero-slides" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={() => handleAdminNavigation('/admin/hero-slides')}>
                        <Sliders className="w-4 h-4 mr-2" /> Kelola Hero Slides
                      </Link>
                      <Link href="/admin/blog-posts" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-amber-400 transition duration-150" onClick={() => handleAdminNavigation('/admin/blog-posts')}>
                        <FileText className="w-4 h-4 mr-2" /> Kelola Blog
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 hover:text-red-400 transition duration-150"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="bg-amber-600 text-gray-950 font-bold py-2 px-5 rounded-full hover:bg-amber-500 transition duration-200 shadow-md">
              Login
            </Link>
          )}
        </nav>

        {/* Tombol Menu Mobile */}
        <div className="md:hidden flex items-center space-x-4">
          <Link href="/cart" className="relative flex items-center text-gray-300 hover:text-amber-400 transition duration-200">
            <ShoppingCart className="w-7 h-7" />
            {/* Hanya render badge jika komponen sudah di-mount di klien dan ada item */}
            {hasMounted && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-bold shadow-sm">
                {cartItemCount}
              </span>
            )}
          </Link>
          <button onClick={toggleMobileMenu} className="text-gray-50 focus:outline-none">
            {isMobileMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile (Conditional Rendering) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 pb-4 border-t border-gray-800">
          <nav className="flex flex-col items-center space-y-4 pt-4">
            <Link href="/" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
              Home
            </Link>
            <Link href="/products" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
              Products
            </Link>
            <Link href="/blog" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
              Blog
            </Link>
            <Link href="/contact" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
              Contact
            </Link>

            {status === 'authenticated' ? (
              <>
                <Link href="/account" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                  My Account
                </Link>
                {isAdmin && (
                  <>
                    {/* Tautan Kelola Pengguna untuk Mobile */}
                    <Link href="/admin/users" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                      Admin Dashboard
                    </Link>
                    <Link href="/admin/users" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                      Kelola Pengguna
                    </Link>
                    <Link href="/admin/products" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                      Kelola Produk
                    </Link>
                    <Link href="/admin/categories" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                      Kelola Kategori
                    </Link>
                    <Link href="/admin/hero-slides" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                      Kelola Hero Slides
                    </Link>
                    <Link href="/admin/blog-posts" className="text-lg font-medium text-gray-200 hover:text-amber-400 transition duration-200" onClick={toggleMobileMenu}>
                      Kelola Blog
                    </Link>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full text-center text-lg font-medium text-red-500 hover:text-red-400 transition duration-200 py-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="bg-amber-600 text-gray-950 font-bold py-2 px-5 rounded-full hover:bg-amber-500 transition duration-200 shadow-md" onClick={toggleMobileMenu}>
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
