import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  status: number;
  serverMessage: string;

  constructor(message: string, status: number, serverMessage: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractMessage(data: unknown): string | undefined {
  if (isRecord(data) && typeof data.message === 'string') {
    return data.message;
  }
  if (data !== undefined && data !== null) {
    return String(data);
  }
  return undefined;
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const serverMessage = extractMessage(error.response?.data) ?? error.message;

    if (!error.response) {
      return new ApiError(
        'Unable to reach the server. Please check your connection and ensure the backend is running.',
        status,
        serverMessage,
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        'The request timed out. The server may be under heavy load or unreachable.',
        status,
        serverMessage,
      );
    }

    const friendlyMessages: Record<number, string> = {
      400: 'The request was invalid. Please check your input and try again.',
      404: 'The requested resource was not found. It may have been removed.',
      409: 'A conflict occurred. This transaction may already exist.',
      429: 'Too many requests. Please wait a moment before trying again.',
      500: 'The server encountered an internal error. Please try again later.',
      502: 'The gateway is temporarily unavailable. Please try again.',
      503: 'The service is currently unavailable. Please try again later.',
    };

    return new ApiError(
      friendlyMessages[status] || `Request failed with status ${status}. Please try again.`,
      status,
      serverMessage,
    );
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 0, error.message);
  }
  return new ApiError('An unexpected error occurred. Please try again.', 0, String(error));
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 1000;

function shouldRetry(error: unknown, retryCount: number): boolean {
  if (retryCount >= MAX_RETRIES) return false;
  if (!axios.isAxiosError(error)) return false;

  if (!error.response) return true;
  if (error.code === 'ECONNABORTED') return true;
  if (error.response.status >= 500 && error.config?.method?.toLowerCase() === 'get') return true;

  return false;
}

// Single interceptor: retry first (with original axios error), then normalize
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const config = error.config as InternalAxiosRequestConfig & { __retryCount?: number };

    // Retry logic must happen before normalization
    if (config) {
      const retryCount = config.__retryCount || 0;
      if (shouldRetry(error, retryCount)) {
        config.__retryCount = retryCount + 1;
        const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(config);
      }
    }

    // Normalize only after retries exhausted
    return Promise.reject(normalizeError(error));
  },
);

export default apiClient;
