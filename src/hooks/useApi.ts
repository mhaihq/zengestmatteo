import { useState, useCallback, useRef, useEffect } from 'react';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { useAxios } from '../contexts/AxiosContext';
import { ApiError, ApiRequestConfig } from '../types/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (config?: ApiRequestConfig) => Promise<T>;
  reset: () => void;
}

export const useApi = <T = any,>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  initialData: T | null = null
): UseApiReturn<T> => {
  const { axios } = useAxios();
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (config?: ApiRequestConfig): Promise<T> => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const axiosConfig: AxiosRequestConfig = {
          url,
          method,
          signal: config?.signal || abortControllerRef.current.signal,
          params: config?.params,
          headers: config?.headers,
          ...(method !== 'GET' && config?.params ? { data: config.params } : {}),
        };

        const response = await axios.request<T>(axiosConfig);

        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        const error: ApiError = {
          message: axiosError.message || 'An error occurred',
          status: axiosError.response?.status || 0,
          data: axiosError.response?.data,
        };

        setState({
          data: null,
          loading: false,
          error,
        });

        throw error;
      }
    },
    [axios, url, method]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

export const useGet = <T = any,>(url: string, initialData: T | null = null) => {
  return useApi<T>(url, 'GET', initialData);
};

export const usePost = <T = any,>(url: string, initialData: T | null = null) => {
  return useApi<T>(url, 'POST', initialData);
};

export const usePut = <T = any,>(url: string, initialData: T | null = null) => {
  return useApi<T>(url, 'PUT', initialData);
};

export const usePatch = <T = any,>(url: string, initialData: T | null = null) => {
  return useApi<T>(url, 'PATCH', initialData);
};

export const useDelete = <T = any,>(url: string, initialData: T | null = null) => {
  return useApi<T>(url, 'DELETE', initialData);
};
