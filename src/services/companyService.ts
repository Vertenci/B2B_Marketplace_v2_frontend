import { apiClient } from '../api/client';
import type { Company, CompanyType, CompanyTypeItem, MainDashboard } from '../types';

export const companyService = {
  async getMainDashboard(): Promise<MainDashboard> {
    const res = await apiClient.get('/main_dashboard');
    return res.data;
  },

  async getCompanyTypes(): Promise<CompanyTypeItem[]> {
    const res = await apiClient.get('/companies_types');
    return res.data;
  },

  async createCompany(type: CompanyType, data: { name: string; inn: string }): Promise<Company> {
    const res = await apiClient.post(`/create_company/${type}`, data);
    return res.data;
  },

  async getMyLessorCompanies(): Promise<Company[]> {
    const res = await apiClient.get('/lessor/my_companies');
    return res.data;
  },

  async getMyRenterCompanies(): Promise<Company[]> {
    const res = await apiClient.get('/renter/my_companies');
    return res.data;
  },
};
