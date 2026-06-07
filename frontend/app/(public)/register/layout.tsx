import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Daftar Akun',
  description: 'Daftar akun OSCARPART untuk akses harga spare part tambang, submit RFQ, dan layanan pengadaan.',
  openGraph: {
    title:       'Daftar Akun | OSCARPART',
    description: 'Daftar akun OSCARPART untuk akses harga spare part tambang, submit RFQ, dan layanan pengadaan.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{}</>;
}
