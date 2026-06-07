import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Panduan PM Bundles',
  description: 'Panduan Preventive Maintenance (PM) untuk unit SANY — daftar part dan jadwal servis berdasarkan HM.',
  openGraph: {
    title:       'PM Bundles | OSCARPART',
    description: 'Jadwal dan part list PM unit alat berat SANY.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
