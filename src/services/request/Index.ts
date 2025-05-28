import axios from 'axios';
import type { AxiosResponse } from 'axios';

interface ApiResponse<T = any> {
  statusCode: number;
  responseBody: T;
}

interface ErrorResponse {
  error: string;
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('jwt') || ''}`
});

export async function get<T = any>(url: string): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    const response: AxiosResponse<T> = await axios.get(import.meta.env.VITE_API_URL + url, {
      headers: getAuthHeaders()
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

export async function post<T = any>(url: string, body: any): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    const response: AxiosResponse<T> = await axios.post(import.meta.env.VITE_API_URL + url, body, {
      headers: getAuthHeaders()
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
    const response: AxiosResponse<T> = await axios.put(import.meta.env.VITE_API_URL + url, body, {
      headers: getAuthHeaders()
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
    const response: AxiosResponse<T> = await axios.delete(import.meta.env.VITE_API_URL + url, {
      headers: getAuthHeaders()
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


export async function login<T = any>(body: any): Promise<ApiResponse<T | ErrorResponse>> {
  try {
    console.log("Login Request Body: ", body);
    const response: AxiosResponse<T> = await axios.post(import.meta.env.VITE_API_URL + '/user/login', body, {
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