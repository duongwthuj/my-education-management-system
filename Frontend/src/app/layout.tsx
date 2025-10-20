import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Plus_Jakarta_Sans, Roboto_Mono } from 'next/font/google';

import { ThemeRegistry } from '../components/theme-registry';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: 'Hệ thống quản lý giáo viên',
  description: 'Hệ thống quản lý giáo viên, môn học, lịch giảng dạy và lớp học mới',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${plusJakartaSans.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>
        <ThemeRegistry>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </ThemeRegistry>
      </body>
    </html>
  );
}