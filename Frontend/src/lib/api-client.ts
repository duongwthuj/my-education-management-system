/**
 * API Client for communicating with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Transform MongoDB responses: convert _id to id
 */
function transformResponse<T>(data: any): T {
  if (Array.isArray(data)) {
    return data.map((item) => transformObject(item)) as T;
  }
  return transformObject(data) as T;
}

function transformObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformObject);
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id') {
      // Convert _id to id (as string)
      transformed.id = typeof value === 'object' ? (value as any).toString() : value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively transform nested objects
      transformed[key] = transformObject(value);
    } else {
      transformed[key] = value;
    }
  }
  return transformed;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      console.log(`📡 API Request: ${url}`);
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, data);
        return {
          success: false,
          error: data.error || `HTTP Error: ${response.status}`,
        };
      }

      // Transform the response data to convert _id to id
      const transformedResponse: ApiResponse<T> = {
        ...data,
        data: data.data ? transformResponse<T>(data.data) : undefined,
      };

      console.log(`✅ API Success: ${url}`, transformedResponse);
      return transformedResponse;
    } catch (error) {
      console.error('❌ API Request Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
