import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { TokenStorageService, defaultStorage } from '../auth/storage.service';

export function createApiClient(
  baseURL: string = process.env.VUE_APP_API_URL || 'http://localhost:5000',
  storage: TokenStorageService = defaultStorage
): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  // Request interceptor: Automatically attach Bearer access token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = storage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  return client;
}

export const defaultApiClient = createApiClient();
