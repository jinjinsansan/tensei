import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { getPublicEnv } from '@/lib/env';
import { BackgroundParticles } from '@/components/layout/background-particles';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSans = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const publicEnv = getPublicEnv();
const siteName = publicEnv.NEXT_PUBLIC_SITE_NAME ?? '来世ガチャ ～もしも生まれ変わったら～';
const siteDescription = '来世の物語に出会える、チケット制の没入型ガチャ体験';
const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL ?? publicEnv.NEXT_PUBLIC_APP_URL;
const siteLogo = '/raise-gacha-logo.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl ?? 'http://localhost:3000'),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'mask-icon',
      url: siteLogo,
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: 'website',
    images: [{ url: siteLogo, width: 2048, height: 2048 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [siteLogo],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.variable} ${notoSans.variable} font-sans antialiased`}>
        <BackgroundParticles />
        {children}
      </body>
    </html>
  );
}
