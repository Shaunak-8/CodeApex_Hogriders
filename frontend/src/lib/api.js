import axios from 'axios';
import { getAccessToken } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const runAgent = async (payload) => {
  const response = await api.post('/run', payload);
  return response.data;
};

export const getResults = async (runId) => {
  const response = await api.get(`/results/${encodeURIComponent(runId)}`);
  return response.data;
};

export const getStatus = async (runId) => {
  const response = await api.get(`/status/${encodeURIComponent(runId)}`);
  return response.data;
};
