import { apiClient } from '../api/client';
import type { Agreement } from '../types';

export const documentService = {
  async acceptPublicOffer(): Promise<Agreement> {
    const res = await apiClient.post('/documents/public_offer/accept');
    return res.data;
  },

  async getAgreementStatus(): Promise<{ public_offer_accepted: boolean; public_offer_agreement: Agreement | null }> {
    const res = await apiClient.get('/documents/status');
    return res.data;
  },

  getPublicOfferDownloadUrl(): string {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/documents/public_offer/download`;
  },
};
