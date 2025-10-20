import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { Subject } from '@/types/subject';

export interface CreateSubjectDTO {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSubjectDTO {
  name?: string;
  code?: string;
  description?: string;
}

export const subjectsService = {
  /**
   * Get all subjects
   */
  async getAll(): Promise<ApiResponse<Subject[]>> {
    return apiClient.get<Subject[]>('/subjects');
  },

  /**
   * Get a subject by ID
   */
  async getById(id: string): Promise<ApiResponse<Subject>> {
    return apiClient.get<Subject>(`/subjects/${id}`);
  },

  /**
   * Create a new subject
   */
  async create(data: CreateSubjectDTO): Promise<ApiResponse<Subject>> {
    return apiClient.post<Subject>('/subjects', data);
  },

  /**
   * Update a subject
   */
  async update(id: string, data: UpdateSubjectDTO): Promise<ApiResponse<Subject>> {
    return apiClient.put<Subject>(`/subjects/${id}`, data);
  },

  /**
   * Delete a subject
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/subjects/${id}`);
  },
};
