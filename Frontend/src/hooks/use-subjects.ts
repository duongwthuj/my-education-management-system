'use client';

import { useState, useEffect, useCallback } from 'react';
import { subjectsService } from '@/services';
import type { Subject } from '@/types/subject';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchSubjects = useCallback(async (
    page: number = 1, 
    limit: number = 12,
    filters?: { category?: string; level?: string; search?: string }
  ) => {
    setLoading(true);
    setError(null);
    
    const response = await subjectsService.getAll({ 
      page, 
      limit,
      ...filters 
    });
    
    if (response.success && response.data) {
      setSubjects(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } else {
      setError(response.error || 'Failed to fetch subjects');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects(pagination.page, pagination.limit);
  }, []);

  const handlePageChange = useCallback((
    newPage: number,
    filters?: { category?: string; level?: string; search?: string }
  ) => {
    fetchSubjects(newPage, pagination.limit, filters);
  }, [pagination.limit, fetchSubjects]);

  const handleLimitChange = useCallback((
    newLimit: number,
    filters?: { category?: string; level?: string; search?: string }
  ) => {
    fetchSubjects(1, newLimit, filters);
  }, [fetchSubjects]);

  return {
    subjects,
    loading,
    error,
    pagination,
    refetch: fetchSubjects,
    onPageChange: handlePageChange,
    onLimitChange: handleLimitChange,
  };
}

export function useSubject(id: string) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubject = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    const response = await subjectsService.getById(id);
    
    if (response.success && response.data) {
      setSubject(response.data);
    } else {
      setError(response.error || 'Failed to fetch subject');
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSubject();
  }, [fetchSubject]);

  return {
    subject,
    loading,
    error,
    refetch: fetchSubject,
  };
}
