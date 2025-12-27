import api from './api';
import { Child, ChildCreate, ChildUpdate } from '@/types';

export const childService = {
  async getAll(): Promise<Child[]> {
    const response = await api.get<Child[]>('/children');
    return response.data;
  },

  async getById(id: number): Promise<Child> {
    const response = await api.get<Child>(`/children/${id}`);
    return response.data;
  },

  async create(data: ChildCreate): Promise<Child> {
    const response = await api.post<Child>('/children', data);
    return response.data;
  },

  async update(id: number, data: ChildUpdate): Promise<Child> {
    const response = await api.put<Child>(`/children/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/children/${id}`);
  },
};
