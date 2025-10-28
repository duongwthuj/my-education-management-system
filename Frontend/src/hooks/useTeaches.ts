'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Teach } from '@/types';

interface TeachResponse {
  success: boolean;
  data: Teach[];
}

export function useTeaches() {
  const [teaches, setTeaches] = useState<Teach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/teaches');
      if (!response.ok) throw new Error('Failed to fetch teaches');
      const data: TeachResponse = await response.json();
      if (data.success) {
        setTeaches(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching teaches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByTeacher = useCallback(async (teacherId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/teaches/teacher/${teacherId}`);
      if (!response.ok) throw new Error('Failed to fetch teacher teaches');
      const data: TeachResponse = await response.json();
      if (data.success) {
        setTeaches(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching teacher teaches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch all teaches on component mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    teaches,
    loading,
    error,
    fetchAll,
    fetchByTeacher,
  };
}
