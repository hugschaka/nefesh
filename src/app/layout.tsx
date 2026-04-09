import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';
import TopBanner from '@/components/TopBanner';
import SideScroller from '@/components/SideScroller';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import CookieConsent from '@/components/CookieConsent';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'נפש יהודי - מרכז ההרצאות והתכנים',
  description: 'פלטפורמת הרצאות יהודיות חינוכיות של הרב משה זילברברג',
  keywords: ['הרצאות', 'יהדות', 'תורה', 'חינוך', 'זילברברג'],
  openGraph: {
    title: 'נפש יהודי - מרכז ההרצאות והתכנים',
    description: 'פלטפורמת הרצאות יהודיות חינוכיות',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <head>
        {/* Open Sans Hebrew from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-primary antialiased">
        {/* Top announcement banner (above navbar) */}
        <TopBanner />

        {/* Side scrolling text strips */}
        <SideScroller side="right" />
        <SideScroller side="left" />

        {children}

        {/* Popup announcement (shown once per session) */}
        <AnnouncementPopup />

        {/* Cookie / email consent banner */}
        <CookieConsent />
      </body>
    </html>
  );
}
