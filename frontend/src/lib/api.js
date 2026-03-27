import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

export const runAgent = async (payload) => {
  const response = await api.post('/run', payload);
  return response.data;
};

export const getResults = async (runId) => {
  const response = await api.get(`/results/${runId}`);
  return response.data;
};

export const getStatus = async (runId) => {
  const response = await api.get(`/status/${runId}`);
  return response.data;
};
