import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { Schedule } from '@/types/schedule';

export interface CreateScheduleDTO {
  teacherId: string;
  subjectId: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface UpdateScheduleDTO {
  teacherId?: string;
  subjectId?: string;
  classId?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  room?: string;
}

export const schedulesService = {
  /**
   * Get all schedules
   */
  async getAll(): Promise<ApiResponse<Schedule[]>> {
    return apiClient.get<Schedule[]>('/schedules');
  },

  /**
   * Get a schedule by ID
   */
  async getById(id: string): Promise<ApiResponse<Schedule>> {
    return apiClient.get<Schedule>(`/schedules/${id}`);
  },

  /**
   * Get schedules by teacher ID
   */
  async getByTeacherId(teacherId: string): Promise<ApiResponse<Schedule[]>> {
    return apiClient.get<Schedule[]>(`/schedules/teacher/${teacherId}`);
  },

  /**
   * Create a new schedule
   */
  async create(data: CreateScheduleDTO): Promise<ApiResponse<Schedule>> {
    return apiClient.post<Schedule>('/schedules', data);
  },

  /**
   * Update a schedule
   */
  async update(id: string, data: UpdateScheduleDTO): Promise<ApiResponse<Schedule>> {
    return apiClient.put<Schedule>(`/schedules/${id}`, data);
  },

  /**
   * Delete a schedule
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/schedules/${id}`);
  },
};
