import type { Metadata } from 'next';
import { Orbitron, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { getPublicEnv } from '@/lib/env';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const notoSans = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-body',
  display: 'swap',
});

const publicEnv = getPublicEnv();
const siteName = publicEnv.NEXT_PUBLIC_SITE_NAME ?? '転生ガチャ 〜来世ルーレット〜';
const siteDescription = '尊師ホール級のネオン演出を転生テーマで楽しむ没入型ガチャ体験';
const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL ?? publicEnv.NEXT_PUBLIC_APP_URL;

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
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${orbitron.variable} ${notoSans.variable} font-body antialiased bg-hall-background text-white`}>
        {children}
      </body>
    </html>
  );
}
