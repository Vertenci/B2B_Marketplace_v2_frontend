import { apiClient } from '../api/client';
import type { User, MyDashboard } from '../types';

export const profileService = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get('/my_profile');
    return res.data;
  },

  async updateProfile(data: { phone?: string; full_name?: string }): Promise<User> {
    const res = await apiClient.put('/my_profile', data);
    return res.data;
  },

  async deleteProfile(): Promise<void> {
    await apiClient.delete('/my_profile');
  },

  async getDashboard(): Promise<MyDashboard> {
    const res = await apiClient.get('/my_dashboard');
    return res.data;
  },
};
