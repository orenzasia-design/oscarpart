import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Dashboard Saya',
  description: 'Dashboard pelanggan OSCARPART — unit, history RFQ, dan rekomendasi jadwal PM.',
  openGraph: {
    title:       'Dashboard Saya | OSCARPART',
    description: 'Dashboard pelanggan OSCARPART — unit, history RFQ, dan rekomendasi jadwal PM.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{}</>;
}
