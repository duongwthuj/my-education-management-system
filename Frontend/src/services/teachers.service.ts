import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { Teacher } from '@/types/teacher';

export interface CreateTeacherDTO {
  name: string;
  phone: string;
  subjects: string[];
}

export interface UpdateTeacherDTO {
  name?: string;
  phone?: string;
  subjects?: string[];
}

export const teachersService = {
  /**
   * Get all teachers
   */
  async getAll(): Promise<ApiResponse<Teacher[]>> {
    return apiClient.get<Teacher[]>('/teachers');
  },

  /**
   * Get a teacher by ID
   */
  async getById(id: string): Promise<ApiResponse<Teacher>> {
    return apiClient.get<Teacher>(`/teachers/${id}`);
  },

  /**
   * Create a new teacher
   */
  async create(data: CreateTeacherDTO): Promise<ApiResponse<Teacher>> {
    return apiClient.post<Teacher>('/teachers', data);
  },

  /**
   * Update a teacher
   */
  async update(id: string, data: UpdateTeacherDTO): Promise<ApiResponse<Teacher>> {
    return apiClient.put<Teacher>(`/teachers/${id}`, data);
  },

  /**
   * Delete a teacher
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/teachers/${id}`);
  },
};
