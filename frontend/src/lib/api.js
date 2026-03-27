import axios from 'axios';
import { getAccessToken } from './supabase';

const baseUrl = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseUrl ? `${baseUrl}/api` : '/api',
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

export const getRepos = async () => {
    const response = await api.get('/repos');
    return response.data;
};

export const createProject = async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await api.post('/me', userData);
    return response.data;
};

export const getProjects = async () => {
    const response = await api.get('/projects');
    return response.data;
};

export const getProjectTasks = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
};

export const workspaceChat = async (projectId, prompt) => {
    const response = await api.post('/workspace/chat', { project_id: projectId, prompt });
    return response.data;
};

export const updateTask = async (taskId, status) => {
    const response = await api.put(`/tasks/${taskId}`, { status });
    return response.data;
};

export const getRootCauseAnalysis = async (errorLog) => {
    const response = await api.post('/workspace/rca', { error_log: errorLog });
    return response.data;
};

export const getRepoGraph = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/graph`);
    return response.data;
};

export const generateInfra = async (projectId) => {
    const response = await api.post('/workspace/infra', { project_id: projectId });
    return response.data;
};

export default api;
