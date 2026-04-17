import React, { createContext, useContext, ReactNode } from 'react';
import { AxiosInstance } from 'axios';
import axiosInstance from '../lib/axios';

interface AxiosContextType {
  axios: AxiosInstance;
}

const AxiosContext = createContext<AxiosContextType | undefined>(undefined);

interface AxiosProviderProps {
  children: ReactNode;
}

export const AxiosProvider: React.FC<AxiosProviderProps> = ({ children }) => {
  const value: AxiosContextType = {
    axios: axiosInstance,
  };

  return (
    <AxiosContext.Provider value={value}>
      {children}
    </AxiosContext.Provider>
  );
};

export const useAxios = (): AxiosContextType => {
  const context = useContext(AxiosContext);
  if (!context) {
    throw new Error('useAxios must be used within an AxiosProvider');
  }
  return context;
};
