import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Detail Spare Part',
  description: 'Detail spare part alat berat tambang — spesifikasi, ketersediaan, dan harga di OSCARPART.',
  openGraph: {
    title:       'Detail Spare Part | OSCARPART',
    description: 'Spesifikasi dan harga spare part alat berat tambang.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
