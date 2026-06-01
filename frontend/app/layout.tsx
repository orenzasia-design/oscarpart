import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title:       'OSCARPART – Mining Parts & Equipment',
  description: 'Platform pengadaan spare part dan equipment pertambangan terpercaya.',
  keywords:    'spare part tambang, mining equipment, alat berat, katalog part',
  robots:      'index, follow',
  openGraph: {
    title:       'OSCARPART',
    description: 'Mining Parts & Equipment Specialist',
    type:        'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-surface text-gray-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
        {/* Floating WhatsApp Button */}
                <a
          href="https://wa.me/6288802032033"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#25D366',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            textDecoration: 'none',
          }}
          title="Chat via WhatsApp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="30"
            height="30"
            fill="white"
          >
            <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.49 2.027 7.8L0 32l8.427-2.007A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.773-1.853l-.486-.287-5.007 1.193 1.227-4.867-.32-.507A13.24 13.24 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.307-9.907c-.4-.2-2.367-1.167-2.733-1.3-.367-.133-.633-.2-.9.2-.267.4-1.033 1.3-1.267 1.567-.233.267-.467.3-.867.1-.4-.2-1.687-.62-3.213-1.973-1.187-1.053-1.987-2.353-2.22-2.753-.233-.4-.025-.617.175-.817.18-.18.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.167-1.233-2.967-.325-.78-.655-.674-.9-.686l-.767-.013c-.267 0-.7.1-1.067.5s-1.4 1.367-1.4 3.333 1.433 3.867 1.633 4.133c.2.267 2.82 4.307 6.833 6.033.955.413 1.7.66 2.28.845.958.306 1.83.263 2.52.16.768-.114 2.367-.967 2.7-1.9.333-.933.333-1.733.233-1.9-.1-.167-.367-.267-.767-.467z"/>
          </svg>
        </a>
      </body>
    </html>
  );
}
