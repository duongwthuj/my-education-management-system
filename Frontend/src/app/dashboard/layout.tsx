import type { Metadata } from 'next';
import { DashboardLayout } from '../../components/dashboard/layout';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Trang quản lý giáo viên và lịch dạy',
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}