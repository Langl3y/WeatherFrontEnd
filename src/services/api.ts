import axios from 'axios';
import { User, Task, WeatherInfo } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Adding token to request:', config.url); // Debug log
  } else {
    console.log('No token found for request:', config.url); // Debug log
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
api.interceptors.response.use((response) => {
  console.log('Response:', {
    url: response.config.url,
    status: response.status,
    headers: response.config.headers
  });
  return response;
}, (error) => {
  console.error('Response error:', {
    url: error.config?.url,
    status: error.response?.status,
    message: error.message
  });
  return Promise.reject(error);
});

export const tasksApi = {
  getTasks: () => api.post<Task[]>('/tasks/get_tasks').then(res => res.data),
  createTask: (task: Omit<Task, 'id'>) => api.post<Task>('/tasks/create_task', task).then(res => res.data),
  updateTask: (task: { id: number } & Partial<Task>) => api.post<Task>('/tasks/update_task', task).then(res => res.data),
  deleteTask: (id: number) => api.post('/tasks/delete_task', { id }).then(res => res.data),
};

export const usersApi = {
  getUsers: () => api.post<User[]>('/users/get_users').then(res => res.data),
  createUser: (user: { username: string; password: string }) => 
    api.post<User>('/users/create_user', user).then(res => res.data),
  updateUser: (user: { id: number } & Partial<User>) => 
    api.post<User>('/users/update_user', user).then(res => res.data),
  deleteUser: (id: number) => api.post('/users/delete_user', { id }).then(res => res.data),
};

export const weatherApi = {
  getWeatherInfo: async () => {
    const token = localStorage.getItem('token');
    console.log('Token when getting weather:', token); // Debug log
    
    const response = await api.post<{
      response: { code: number; message: string };
      result: { data: WeatherInfo[] }
    }>('/weather_info/get_weather_info');
    
    return response.data.result.data;
  },
  createWeatherInfo: (info: { lat: number; lon: number }) => {
    return api.post<WeatherInfo>('/weather_info/create_weather_info', {
      lat: info.lat,
      lon: info.lon
    }).then(res => res.data);
  },
  updateWeatherInfo: (id: number) => {
    return api.post<WeatherInfo>('/weather_info/update_weather_info', {
      id
    }).then(res => res.data);
  }
};

interface LoginResponse {
  response: {
    code: number;
    message: string;
  };
  result: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export const authApi = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/login', {
        username,
        password
      });

      if (response.data.response.code === 0) {
        const token = response.data.result.access_token;
        localStorage.setItem('token', token);
        return { access_token: token };
      }
      throw new Error(response.data.response.message);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
};

// Add interceptor to handle errors and logging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: `${BASE_URL}${error.config?.url}`,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
