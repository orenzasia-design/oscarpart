import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Analitik PM',
  description: 'Analitik konsumsi part dan jadwal Preventive Maintenance unit alat berat Anda.',
  openGraph: {
    title:       'Analitik PM | OSCARPART',
    description: 'Analitik konsumsi part dan jadwal Preventive Maintenance unit alat berat Anda.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{}</>;
}
