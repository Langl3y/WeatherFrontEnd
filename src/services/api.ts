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

// Add request interceptor to include token in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request config:', {
    url: config.url,
    headers: config.headers,
    token: token
  });
  return config;
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
  getWeatherInfo: () => {
    return api.post<{ response: { code: number; message: string }; result: { data: WeatherInfo[] } }>(
      '/weather_info/get_weather_info'
    ).then(res => res.data.result.data);
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

      console.log('Login response:', response.data);

      if (response.data.response.code === 0) {
        // Save token to localStorage
        localStorage.setItem('token', response.data.result.access_token);
        
        return {
          access_token: response.data.result.access_token
        };
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
