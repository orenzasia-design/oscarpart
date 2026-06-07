import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { ThemeProvider } from '../lib/ThemeProvider';
import { Toaster } from 'react-hot-toast';

// const inter = Inter({ subsets: ['latin'], display: 'swap' });

const SITE_URL = 'https://oscarpart.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  'OSCARPART – Mining Parts & Equipment',
    template: '%s | OSCARPART',
  },
  description: 'Platform pengadaan spare part dan equipment pertambangan terpercaya. Spare part SANY, excavator, bulldozer, grader – harga kompetitif, stok ready.',
  keywords: ['spare part tambang', 'SANY', 'excavator', 'mining parts', 'oscarpart', 'bulldozer', 'RFQ', 'alat berat'],
  authors: [{ name: 'OSCARPART', url: SITE_URL }],
  openGraph: {
    type:        'website',
    locale:      'id_ID',
    url:         SITE_URL,
    siteName:    'OSCARPART',
    title:       'OSCARPART – Mining Parts & Equipment',
    description: 'Spare part alat berat tambang: SANY, excavator, bulldozer, grader. RFQ online, harga kompetitif.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'OSCARPART' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'OSCARPART – Mining Parts & Equipment',
    description: 'Platform pengadaan spare part tambang terpercaya.',
    images:      ['/og-image.png'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  keywords: 'spare part tambang, mining equipment, alat berat, katalog part',
  robots: 'index, follow',
  openGraph: {
    title: 'OSCARPART',
    description: 'Mining Parts & Equipment Specialist',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-surface text-gray-900 antialiased">
        <ThemeProvider>
      <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/6288802032033"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: '#25D366', color: '#fff', borderRadius: '50px',
            padding: '12px 20px', fontWeight: 700, fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textDecoration: 'none',
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </body>
    </html>
  );
}