import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { AuthSession } from '@/constants/Interfaces';

interface ApiResponse<T = any> {
  statusCode: number;
  responseBody: T;
}

interface ErrorResponse {
  error: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export async function get<T = any>(url: string): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    const response: AxiosResponse<T> = await axiosClient.get(url);
    return {
      statusCode: response.status,
      responseBody: response.data
    };
  } catch (error: any) {
    const errorDetail = error?.response?.data?.detail || 'Erro na request';
    return {
      statusCode: error?.response?.status || 500,
      responseBody: { error: errorDetail }
    };
  }
}

export async function post<T = any>(url: string, body: any): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    const response: AxiosResponse<T> = await axiosClient.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return {
      statusCode: response.status,
      responseBody: response.data
    };
  } catch (error: any) {
    const errorDetail = error?.response?.data?.detail || 'Erro na request';
    return {
      statusCode: error?.response?.status || 500,
      responseBody: { error: errorDetail }
    };
  }
}

export async function put<T = any>(url: string, body: any): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    const response: AxiosResponse<T> = await axiosClient.put(url, body, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return {
      statusCode: response.status,
      responseBody: response.data
    };
  } catch (error: any) {
    const errorDetail = error?.response?.data?.detail || 'Erro na request';
    return {
      statusCode: error?.response?.status || 500,
      responseBody: { error: errorDetail }
    };
  }
}

export async function del<T = any>(url: string): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    const response: AxiosResponse<T> = await axiosClient.delete(url);
    return {
      statusCode: response.status,
      responseBody: response.data
    };
  } catch (error: any) {
    const errorDetail = error?.response?.data?.detail || 'Erro na request';
    return {
      statusCode: error?.response?.status || 500,
      responseBody: { error: errorDetail }
    };
  }
}


export async function login(body: { username: string; password: string }): Promise<ApiResponse<AuthSession | ErrorResponse>> {
  try {
    const params = new URLSearchParams()
    params.append('username', body.username)
    params.append('password', body.password)

    const response: AxiosResponse<AuthSession> = await axiosClient.post('/user/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return {
      statusCode: response.status,
      responseBody: response.data
    };
  } catch (error: any) {
    const errorDetail = error?.response?.data?.detail || 'Erro na request';
    return {
      statusCode: error?.response?.status || 500,
      responseBody: { error: errorDetail }
    };
  }
}

export async function getSession(): Promise<ApiResponse<AuthSession | ErrorResponse>> {
  return get<AuthSession>('/user/session')
}

export async function logout(): Promise<ApiResponse<{ detail: string } | ErrorResponse>> {
  return post<{ detail: string }>('/user/logout', {})
}

export async function downloadFile(
  url: string,
  fallbackFilename = 'download.bin'
): Promise<ApiResponse<{ filename: string } | ErrorResponse>> {
  try {
    const response = await axiosClient.get(url, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const matchedFilename = contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1];
    const filename = matchedFilename || fallbackFilename;

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    return {
      statusCode: response.status,
      responseBody: { filename },
    };
  } catch (error: any) {
    const errorDetail = error?.response?.data?.detail || 'Erro ao baixar arquivo';
    return {
      statusCode: error?.response?.status || 500,
      responseBody: { error: errorDetail }
    };
  }
}
