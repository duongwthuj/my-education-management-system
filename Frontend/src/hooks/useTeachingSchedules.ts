import { useState, useCallback } from 'react';
import { TeachingSchedule } from '@/types/schedule';
import { apiClient } from '@/lib/api-client';

export function useTeachingSchedules() {
  const [teachingSchedules, setTeachingSchedules] = useState<TeachingSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<TeachingSchedule[]>('/teaching-schedules');
      setTeachingSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch giảng dạy';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByWorkShift = useCallback(async (workScheduleId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<TeachingSchedule[]>(
        `/teaching-schedules/work-shift/${workScheduleId}`
      );
      setTeachingSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch giảng dạy';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByTeacher = useCallback(async (teacherId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<TeachingSchedule[]>(
        `/teaching-schedules/teacher/${teacherId}`
      );
      setTeachingSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch giảng dạy';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<TeachingSchedule>(`/teaching-schedules/${id}`);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch giảng dạy';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (data: Omit<TeachingSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<TeachingSchedule>('/teaching-schedules', data);
        if (response.data) {
          setTeachingSchedules((prev) => [...prev, response.data!]);
          return response.data;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Lỗi tạo lịch giảng dạy';
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const update = useCallback(async (id: string, data: Partial<TeachingSchedule>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put<TeachingSchedule>(`/teaching-schedules/${id}`, data);
      if (response.data) {
        setTeachingSchedules((prev) =>
          prev.map((ts) => (ts.id === id ? response.data! : ts))
        );
        return response.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật lịch giảng dạy';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/teaching-schedules/${id}`);
      setTeachingSchedules((prev) => prev.filter((ts) => ts.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi xóa lịch giảng dạy';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teachingSchedules,
    loading,
    error,
    fetchAll,
    fetchByWorkShift,
    fetchByTeacher,
    fetchById,
    create,
    update,
    remove,
  };
}
