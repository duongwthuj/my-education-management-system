'use client';

import { useState, useEffect, useCallback } from 'react';
import { teachersService } from '@/services';
import type { Teacher } from '@/types/teacher';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await teachersService.getAll();
    
    if (response.success && response.data) {
      setTeachers(response.data);
    } else {
      setError(response.error || 'Failed to fetch teachers');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    teachers,
    loading,
    error,
    refetch: fetchTeachers,
  };
}

export function useTeacher(id: string) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacher = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    const response = await teachersService.getById(id);
    
    if (response.success && response.data) {
      setTeacher(response.data);
    } else {
      setError(response.error || 'Failed to fetch teacher');
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  return {
    teacher,
    loading,
    error,
    refetch: fetchTeacher,
  };
}
