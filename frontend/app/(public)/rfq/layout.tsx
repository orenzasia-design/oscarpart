import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:       'Request for Quotation (RFQ)',
  description: 'Submit RFQ spare part tambang secara online. Upload daftar part, dapatkan penawaran harga cepat.',
  openGraph: {
    title:       'Request for Quotation (RFQ) | OSCARPART',
    description: 'Submit RFQ spare part tambang secara online. Upload daftar part, dapatkan penawaran harga cepat.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{}</>;
}
