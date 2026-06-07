import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Login',
  description: 'Login ke akun OSCARPART Anda untuk mengakses harga part, RFQ, dan history transaksi.',
  openGraph: {
    title:       'Login | OSCARPART',
    description: 'Login ke akun OSCARPART Anda untuk mengakses harga part, RFQ, dan history transaksi.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{}</>;
}
