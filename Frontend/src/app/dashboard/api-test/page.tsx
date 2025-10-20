import type { Metadata } from 'next';
import { ApiConnectionTest } from '@/components/common/api-connection-test';

export const metadata: Metadata = {
  title: 'API Connection Test',
  description: 'Test kết nối giữa Frontend và Backend',
};

export default function ApiTestPage() {
  return <ApiConnectionTest />;
}
