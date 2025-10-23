import { useState, useCallback } from 'react';
import { WorkSchedule } from '@/types/schedule';
import { apiClient } from '@/lib/api-client';

export function useWorkSchedules() {
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<WorkSchedule[]>('/work-schedules');
      setWorkSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch làm việc';
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
      const response = await apiClient.get<WorkSchedule[]>(`/work-schedules/teacher/${teacherId}`);
      setWorkSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch làm việc';
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
      const response = await apiClient.get<WorkSchedule>(`/work-schedules/${id}`);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch làm việc';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<WorkSchedule>('/work-schedules', data);
      if (response.data) {
        setWorkSchedules((prev) => [...prev, response.data!]);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo lịch làm việc';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<WorkSchedule>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put<WorkSchedule>(`/work-schedules/${id}`, data);
      if (response.data) {
        setWorkSchedules((prev) =>
          prev.map((ws) => (ws.id === id ? response.data! : ws))
        );
        return response.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật lịch làm việc';
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
      await apiClient.delete(`/work-schedules/${id}`);
      setWorkSchedules((prev) => prev.filter((ws) => ws.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi xóa lịch làm việc';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workSchedules,
    loading,
    error,
    fetchAll,
    fetchByTeacher,
    fetchById,
    create,
    update,
    remove,
  };
}
