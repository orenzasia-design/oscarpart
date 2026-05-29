import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OSCARPART — Parts & Quotation Widget',
  description: 'Cari spare part dan buat quotation request langsung dari halaman ini.',
  robots: 'noindex',
};

export default function WidgetPage() {
  return (
    <iframe
      src="/embed/oscarpart-widget.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
        margin: 0,
        padding: 0,
      }}
      title="OSCARPART Parts & Quotation"
    />
  );
}