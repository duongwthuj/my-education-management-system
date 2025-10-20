'use client';

import { useState, useEffect, useCallback } from 'react';
import { classesService } from '@/services';
import type { Class } from '@/types/class';

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await classesService.getAll();
    
    if (response.success && response.data) {
      setClasses(response.data);
    } else {
      setError(response.error || 'Failed to fetch classes');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses,
  };
}

export function useClass(id: string) {
  const [classItem, setClassItem] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClass = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    const response = await classesService.getById(id);
    
    if (response.success && response.data) {
      setClassItem(response.data);
    } else {
      setError(response.error || 'Failed to fetch class');
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchClass();
  }, [fetchClass]);

  return {
    class: classItem,
    loading,
    error,
    refetch: fetchClass,
  };
}
