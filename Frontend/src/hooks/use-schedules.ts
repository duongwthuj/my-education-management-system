'use client';

import { useState, useEffect, useCallback } from 'react';
import { schedulesService } from '@/services';
import type { Schedule } from '@/types/schedule';

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await schedulesService.getAll();
    
    if (response.success && response.data) {
      setSchedules(response.data);
    } else {
      setError(response.error || 'Failed to fetch schedules');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
  };
}

export function useSchedule(id: string) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    const response = await schedulesService.getById(id);
    
    if (response.success && response.data) {
      setSchedule(response.data);
    } else {
      setError(response.error || 'Failed to fetch schedule');
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    schedule,
    loading,
    error,
    refetch: fetchSchedule,
  };
}

export function useTeacherSchedules(teacherId: string) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    setError(null);
    
    const response = await schedulesService.getByTeacherId(teacherId);
    
    if (response.success && response.data) {
      setSchedules(response.data);
    } else {
      setError(response.error || 'Failed to fetch teacher schedules');
    }
    
    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
  };
}
