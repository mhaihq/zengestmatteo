import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;
const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

if (!baseURL) {
  console.warn('VITE_API_BASE_URL is not set. Please configure it in your .env file.');
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          console.error('Unauthorized: Invalid or expired token');
          break;
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('Not Found: The requested resource was not found');
          break;
        case 500:
          console.error('Internal Server Error: Something went wrong on the server');
          break;
        default:
          console.error(`Request failed with status ${status}`);
      }

      return Promise.reject({
        message: data?.message || error.message || 'An error occurred',
        status,
        data,
      });
    } else if (error.request) {
      console.error('Network Error: No response received from server');
      return Promise.reject({
        message: 'Network error: Unable to reach the server',
        status: 0,
      });
    } else {
      console.error('Request Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

export default axiosInstance;
