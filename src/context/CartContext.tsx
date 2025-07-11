// context/CartContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react'; // Import useSession untuk memeriksa status login

// Definisikan tipe untuk item di keranjang
interface CartItem {
  id: string; // Ini akan menjadi ID item keranjang dari database (jika login) atau ID lokal (jika tamu)
  productId: string; // ID produk sebenarnya
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  selectedSize?: string; // Ukuran yang dipilih, opsional
  slug?: string; // Slug produk untuk link detail
}

// Definisikan tipe untuk context value
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    selectedSize?: string;
    slug?: string;
  }, quantity: number) => Promise<void>; // Menjadi async karena akan memanggil API
  removeFromCart: (itemId: string) => Promise<void>; // Menjadi async
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>; // Menjadi async
  clearCart: () => Promise<void>; // Menjadi async
  cartTotal: number;
  cartItemCount: number;
  isLoadingCart: boolean; // State untuk menunjukkan apakah keranjang sedang dimuat
}

// Buat Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Buat Provider Component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState<boolean>(true); // Menambahkan state loading

  // Fungsi untuk mengambil keranjang dari API (untuk pengguna login)
  const fetchCartFromApi = useCallback(async () => {
    setIsLoadingCart(true);
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data: CartItem[] = await res.json();
        setCartItems(data);
      } else {
        console.error('Failed to fetch cart from API:', res.statusText);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart from API:', error);
      setCartItems([]);
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  // Fungsi untuk menyimpan keranjang ke API (untuk pengguna login)
  const syncCartToApi = useCallback(async (items: CartItem[]) => {
    // Fungsi ini akan dipanggil saat ada perubahan di keranjang yang perlu disinkronkan ke DB
    // Untuk kesederhanaan, kita hanya akan memanggil API POST/PUT/DELETE secara individual
    // ketika addToCart, removeFromCart, updateQuantity dipanggil.
    // Sinkronisasi massal bisa diimplementasikan jika diperlukan.
  }, []);

  // Fungsi untuk menggabungkan keranjang tamu (localStorage) dengan keranjang login (database)
  const mergeGuestCart = useCallback(async () => {
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('myEcomGuestCart') : null;
    if (savedCart) {
      const guestCart: CartItem[] = JSON.parse(savedCart);
      if (guestCart.length > 0) {
        console.log('Merging guest cart with logged-in user cart...');
        for (const guestItem of guestCart) {
          try {
            // Panggil API POST untuk setiap item tamu
            await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: guestItem.productId,
                quantity: guestItem.quantity,
                selectedSize: guestItem.selectedSize,
              }),
            });
          } catch (error) {
            console.error('Error merging guest cart item:', guestItem, error);
          }
        }
        // Setelah berhasil digabungkan, hapus keranjang tamu dari localStorage
        localStorage.removeItem('myEcomGuestCart');
        // Muat ulang keranjang dari API untuk mendapatkan state terbaru
        await fetchCartFromApi();
      }
    }
  }, [fetchCartFromApi]);

  // Effect untuk memuat keranjang saat status sesi berubah
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCartFromApi().then(() => {
        // Setelah keranjang login dimuat, coba gabungkan dengan keranjang tamu
        mergeGuestCart();
      });
    } else if (status === 'unauthenticated') {
      // Jika tidak login, muat keranjang dari localStorage (keranjang tamu)
      const savedCart = typeof window !== 'undefined' ? localStorage.getItem('myEcomGuestCart') : null;
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
      setIsLoadingCart(false);
    } else {
      // Status 'loading'
      setIsLoadingCart(true);
    }
  }, [status, fetchCartFromApi, mergeGuestCart]);

  // Effect untuk menyimpan keranjang tamu ke localStorage jika tidak login
  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      localStorage.setItem('myEcomGuestCart', JSON.stringify(cartItems));
    }
  }, [cartItems, status]);


  // Fungsi untuk menambahkan produk ke keranjang
  const addToCart = async (product: {
    id: string; // Product ID
    name: string;
    price: number;
    imageUrl: string;
    selectedSize?: string;
    slug?: string;
  }, quantity: number) => {
    if (status === 'authenticated') {
      // Panggil API untuk pengguna login
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            quantity: quantity,
            selectedSize: product.selectedSize,
          }),
        });

        if (res.ok) {
          // Setelah berhasil, muat ulang keranjang dari API
          await fetchCartFromApi();
        } else {
          console.error('Failed to add to cart via API:', res.statusText);
        }
      } catch (error) {
        console.error('Error adding to cart via API:', error);
      }
    } else {
      // Logika keranjang tamu (localStorage)
      setCartItems((prevItems) => {
        const itemId = product.selectedSize ? `${product.id}-${product.selectedSize}` : product.id;
        const existingItem = prevItems.find((item) => item.id === itemId);

        if (existingItem) {
          return prevItems.map((item) =>
            item.id === itemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [
            ...prevItems,
            {
              id: itemId, // ID lokal untuk item tamu
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              quantity: quantity,
              selectedSize: product.selectedSize,
              slug: product.slug,
            },
          ];
        }
      });
    }
  };

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = async (itemId: string) => {
    if (status === 'authenticated') {
      // Panggil API untuk pengguna login
      try {
        const res = await fetch(`/api/cart?itemId=${itemId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          await fetchCartFromApi();
        } else {
          console.error('Failed to remove from cart via API:', res.statusText);
        }
      } catch (error) {
        console.error('Error removing from cart via API:', error);
      }
    } else {
      // Logika keranjang tamu (localStorage)
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }
  };

  // Fungsi untuk memperbarui kuantitas item di keranjang
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (status === 'authenticated') {
      // Panggil API untuk pengguna login
      try {
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, newQuantity }),
        });

        if (res.ok) {
          await fetchCartFromApi();
        } else {
          console.error('Failed to update quantity via API:', res.statusText);
        }
      } catch (error) {
        console.error('Error updating quantity via API:', error);
      }
    } else {
      // Logika keranjang tamu (localStorage)
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: newQuantity > 0 ? newQuantity : 1 }
            : item
        )
      );
    }
  };

  // Fungsi untuk mengosongkan keranjang
  const clearCart = async () => {
    if (status === 'authenticated') {
      // Panggil API untuk pengguna login
      try {
        const res = await fetch('/api/cart?clearAll=true', {
          method: 'DELETE',
        });

        if (res.ok) {
          await fetchCartFromApi();
        } else {
          console.error('Failed to clear cart via API:', res.statusText);
        }
      } catch (error) {
        console.error('Error clearing cart via API:', error);
      }
    } else {
      // Logika keranjang tamu (localStorage)
      setCartItems([]);
    }
  };

  // Hitung total harga keranjang
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Hitung jumlah item unik di keranjang
  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        isLoadingCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook untuk menggunakan Cart Context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
