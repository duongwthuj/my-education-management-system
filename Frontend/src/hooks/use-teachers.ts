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
    
    try {
      const response = await teachersService.getAll();
      
      if (response.success && response.data) {
        // Map _id to id for consistency
        const teachers = response.data.map((teacher: any) => ({
          ...teacher,
          id: teacher._id || teacher.id
        }));
        setTeachers(teachers);
      } else {
        setError(response.error || 'Failed to fetch teachers');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch teachers');
      console.error('❌ Error fetching teachers:', err);
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
      // Map _id to id for consistency
      const data = response.data as any;
      const mappedTeacher = {
        ...response.data,
        id: data._id || response.data.id || id
      };
      setTeacher(mappedTeacher);
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
