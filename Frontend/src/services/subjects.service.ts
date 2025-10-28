import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { Subject } from '@/types/subject';

export interface CreateSubjectDTO {
  name: string;
  code: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
}

export interface UpdateSubjectDTO {
  name?: string;
  code?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
}

export const subjectsService = {
  /**
   * Get all subjects
   */
  async getAll(params?: { page?: number; limit?: number; category?: string; level?: string; search?: string }): Promise<ApiResponse<Subject[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/subjects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Subject[]>(url);
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
