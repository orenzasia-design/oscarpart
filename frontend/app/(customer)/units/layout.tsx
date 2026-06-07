import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Unit Saya',
  description: 'Kelola unit alat berat dan pantau jadwal Preventive Maintenance (PM) di OSCARPART.',
  openGraph: {
    title:       'Unit Saya | OSCARPART',
    description: 'Kelola unit alat berat dan pantau jadwal Preventive Maintenance (PM) di OSCARPART.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{}</>;
}
