'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    // Clear semua auth cookies
    const cookies = ['_at_role', '_role', '_status', 'refreshToken'];
    cookies.forEach(name => {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${name}=; path=/api/v1/auth; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });

    // Panggil backend logout juga
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {}).finally(() => {
      window.location.replace('/login');
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Keluar dari akun...</p>
    </div>
  );
}
