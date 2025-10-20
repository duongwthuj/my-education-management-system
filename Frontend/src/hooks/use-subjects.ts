'use client';

import { useState, useEffect, useCallback } from 'react';
import { subjectsService } from '@/services';
import type { Subject } from '@/types/subject';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await subjectsService.getAll();
    
    if (response.success && response.data) {
      setSubjects(response.data);
    } else {
      setError(response.error || 'Failed to fetch subjects');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return {
    subjects,
    loading,
    error,
    refetch: fetchSubjects,
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
