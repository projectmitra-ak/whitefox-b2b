import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'WhiteFox B2B Laundry Management',
  description: 'Multi-tenant B2B laundry management platform with RFID tracking and 3D visualization',
  keywords: ['laundry', 'RFID', 'B2B', 'hospital', 'uniform', 'management'],
  authors: [{ name: 'WhiteFox Team' }],
  creator: 'WhiteFox',
  publisher: 'WhiteFox',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whitefox.io',
    title: 'WhiteFox B2B Laundry Management',
    description: 'Multi-tenant B2B laundry management platform with RFID tracking',
    siteName: 'WhiteFox',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhiteFox B2B Laundry Management',
    description: 'Multi-tenant B2B laundry management platform with RFID tracking',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a3264' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: 'hsl(var(--primary))',
                    secondary: 'hsl(var(--primary-foreground))',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'hsl(var(--destructive))',
                    secondary: 'hsl(var(--destructive-foreground))',
                  },
                },
              }}
            />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}