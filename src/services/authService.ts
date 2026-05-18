import { apiClient } from '../api/client';
import type { AuthTokens } from '../types';

export const authService = {
  async register(data: { email: string; password: string; phone: string; full_name: string }): Promise<{ id: string; email: string }> {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthTokens> {
    const res = await apiClient.post('/auth/login', data);
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    return res.data;
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    localStorage.setItem('access_token', res.data.access_token);
    localStorage.setItem('refresh_token', res.data.refresh_token);
    return res.data;
  },
};
