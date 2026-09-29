import axios from 'axios';

// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'https://www.namami-infotech.com/invoice/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const itemService = {
  getAll: (search = '') => api.get(`/items?search=${encodeURIComponent(search)}`),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
};

export const userService = {
  getAll: (role = '', search = '') => api.get(`/users?role=${role}&search=${encodeURIComponent(search)}`),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const settingService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const invoiceService = {
  getAll: (status = '', search = '') => api.get(`/invoices?status=${status}&search=${encodeURIComponent(search)}`),
  getById: (id) => api.get(`/invoices/${id}`),
  getNextNumber: () => api.get('/invoices/next-number'),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  delete: (id) => api.delete(`/invoices/${id}`)
};

export default api;
