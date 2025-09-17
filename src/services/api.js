import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      error.message = 'Resource not found';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again later.';
    } else if (error.response?.status === 400) {
      error.message = error.response?.data?.message || 'Invalid request';
    }
    
    return Promise.reject(error);
  }
);

// Student API calls
export const studentAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Attendance API calls
export const attendanceAPI = {
  startSession: (data) => api.post('/attendance/start', data),
  markAttendance: (data) => api.post('/attendance/mark', data),
  markBulkAttendance: (data) => api.post('/attendance/bulk', data),
  getReport: (params) => api.get('/attendance/report', { params }),
  getStudentAttendance: (id, params) => api.get(`/attendance/student/${id}`, { params }),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
