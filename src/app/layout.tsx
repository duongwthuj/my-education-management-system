import type { Metadata } from 'next';
import { Suspense } from 'react';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/roboto-mono/300.css';

import { ThemeRegistry } from '../components/theme-registry';

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
    <html lang="vi">
      <body>
        <ThemeRegistry>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </ThemeRegistry>
      </body>
    </html>
  );
}