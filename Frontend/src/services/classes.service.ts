import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { Class } from '@/types/class';

export interface CreateClassDTO {
  name: string;
  studentName: string;
  classCode: string;
  status?: string;
  start?: string;
  date?: string;
}

export interface UpdateClassDTO {
  name?: string;
  studentName?: string;
  classCode?: string;
  status?: string;
  start?: string;
  date?: string;
}

export const classesService = {
  /**
   * Get all classes
   */
  async getAll(): Promise<ApiResponse<Class[]>> {
    return apiClient.get<Class[]>('/classes');
  },

  /**
   * Get a class by ID
   */
  async getById(id: string): Promise<ApiResponse<Class>> {
    return apiClient.get<Class>(`/classes/${id}`);
  },

  /**
   * Create a new class
   */
  async create(data: CreateClassDTO): Promise<ApiResponse<Class>> {
    return apiClient.post<Class>('/classes', data);
  },

  /**
   * Update a class
   */
  async update(id: string, data: UpdateClassDTO): Promise<ApiResponse<Class>> {
    return apiClient.put<Class>(`/classes/${id}`, data);
  },

  /**
   * Delete a class
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/classes/${id}`);
  },
};
