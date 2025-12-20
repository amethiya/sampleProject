import axios from 'axios';
import { Employee } from '../types/Employee';

const API_URL = 'http://localhost:5001/api/employees';

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getById: async (id: number): Promise<Employee> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> => {
    const response = await axios.post(API_URL, employee);
    return response.data;
  },

  update: async (id: number, employee: Partial<Employee>): Promise<Employee> => {
    const response = await axios.put(`${API_URL}/${id}`, employee);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};

