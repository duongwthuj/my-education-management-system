import { useState, useCallback } from 'react';
import { FreeSchedule } from '@/types/schedule';
import { apiClient } from '@/lib/api-client';

export function useFreeSchedules() {
  const [freeSchedules, setFreeSchedules] = useState<FreeSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<FreeSchedule[]>('/free-schedules');
      setFreeSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch rảnh';
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
      const response = await apiClient.get<FreeSchedule[]>(
        `/free-schedules/work-shift/${workScheduleId}`
      );
      setFreeSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch rảnh';
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
      const response = await apiClient.get<FreeSchedule[]>(
        `/free-schedules/teacher/${teacherId}`
      );
      setFreeSchedules(response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch rảnh';
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
      const response = await apiClient.get<FreeSchedule>(`/free-schedules/${id}`);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch rảnh';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: Omit<FreeSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<FreeSchedule>('/free-schedules', data);
      if (response.data) {
        setFreeSchedules((prev) => [...prev, response.data!]);
        return response.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo lịch rảnh';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, data: Partial<FreeSchedule>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put<FreeSchedule>(`/free-schedules/${id}`, data);
      if (response.data) {
        setFreeSchedules((prev) =>
          prev.map((fs) => (fs.id === id ? response.data! : fs))
        );
        return response.data;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật lịch rảnh';
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
      await apiClient.delete(`/free-schedules/${id}`);
      setFreeSchedules((prev) => prev.filter((fs) => fs.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi xóa lịch rảnh';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    freeSchedules,
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
