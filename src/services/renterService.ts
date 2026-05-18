import { apiClient } from '../api/client';
import type {
  Car, DriverCompanyUser, RentalRequest, Rental,
  Finance, Company, RenterDashboard, Telemetry,
  Violation, RentalDocument, GeofenceEvent, RentalStatus, CarStatus, BalanceOperationResponse
} from '../types';

const base = (companyId: string) => `/renter/${companyId}`;

export const renterService = {
  async getProfile(companyId: string): Promise<Company> {
    const res = await apiClient.get(`${base(companyId)}/profile`);
    return res.data;
  },

  async getDashboard(companyId: string): Promise<RenterDashboard> {
    const res = await apiClient.get(`${base(companyId)}/dashboard`);
    return res.data;
  },

  async deleteCompany(companyId: string): Promise<void> {
    await apiClient.delete(`${base(companyId)}/delete`);
  },

  async getDrivers(companyId: string): Promise<DriverCompanyUser[]> {
    const res = await apiClient.get(`${base(companyId)}/drivers`);
    return res.data;
  },

  async addDriver(companyId: string, driverEmail: string): Promise<DriverCompanyUser> {
    const res = await apiClient.post(`${base(companyId)}/drivers`, { driver_email: driverEmail });
    return res.data;
  },

  async removeDriver(companyId: string, driverId: string): Promise<void> {
    await apiClient.delete(`${base(companyId)}/drivers/${driverId}`);
  },

  async toggleDriver(companyId: string, driverId: string): Promise<DriverCompanyUser> {
    const res = await apiClient.patch(`${base(companyId)}/drivers/${driverId}/toggle`);
    return res.data;
  },

  async searchCars(companyId: string, filters?: {
    brand?: string; model?: string; year?: string;
    min_price?: number; max_price?: number; status?: CarStatus;
    skip?: number; limit?: number;
  }): Promise<Car[]> {
    const res = await apiClient.get(`${base(companyId)}/cars`, { params: filters });
    return res.data;
  },

  async getCar(companyId: string, carId: string): Promise<Car> {
    const res = await apiClient.get(`${base(companyId)}/cars/${carId}`);
    return res.data;
  },

  async getRequests(companyId: string, skip = 0, limit = 20): Promise<RentalRequest[]> {
    const res = await apiClient.get(`${base(companyId)}/requests`, { params: { skip, limit } });
    return res.data;
  },

  async createRequest(companyId: string, data: {
    car_id: string; driver_id: string;
    start_date: string; end_date: string; message?: string;
  }): Promise<RentalRequest> {
    const res = await apiClient.post(`${base(companyId)}/requests`, data);
    return res.data;
  },

  async getRequest(companyId: string, requestId: string): Promise<RentalRequest> {
    const res = await apiClient.get(`${base(companyId)}/requests/${requestId}`);
    return res.data;
  },

  async cancelRequest(companyId: string, requestId: string): Promise<RentalRequest> {
    const res = await apiClient.post(`${base(companyId)}/requests/${requestId}/cancel`);
    return res.data;
  },

  async getRentals(companyId: string, status?: RentalStatus, skip = 0, limit = 20): Promise<Rental[]> {
    const res = await apiClient.get(`${base(companyId)}/rentals`, {
      params: { status, skip, limit },
    });
    return res.data;
  },

  async getRental(companyId: string, rentalId: string): Promise<Rental> {
    const res = await apiClient.get(`${base(companyId)}/rentals/${rentalId}`);
    return res.data;
  },

  async getRentalTelemetry(companyId: string, rentalId: string): Promise<Telemetry> {
    const res = await apiClient.get(`${base(companyId)}/rentals/${rentalId}/telemetry`);
    return res.data;
  },

  async getRentalViolations(companyId: string, rentalId: string): Promise<Violation[]> {
    const res = await apiClient.get(`${base(companyId)}/rentals/${rentalId}/violations`);
    return res.data;
  },

  async getRentalGeofenceEvents(companyId: string, rentalId: string): Promise<GeofenceEvent[]> {
    const res = await apiClient.get(`${base(companyId)}/rentals/${rentalId}/geofence_events`);
    return res.data;
  },

  async getRentalDocuments(companyId: string, rentalId: string): Promise<RentalDocument[]> {
    const res = await apiClient.get(`${base(companyId)}/rentals/${rentalId}/documents`);
    return res.data;
  },

  async payRental(companyId: string, rentalId: string): Promise<void> {
    await apiClient.post(`${base(companyId)}/rentals/${rentalId}/pay`);
  },

  async downloadDocument(companyId: string, rentalId: string, documentType: string): Promise<Blob> {
    const res = await apiClient.post(
      `${base(companyId)}/rentals/${rentalId}/documents/${documentType}`,
      {},
      { responseType: 'blob' }
    );
    return res.data;
  },

  async getFinances(companyId: string, skip = 0, limit = 10, eventsSkip = 0): Promise<Finance> {
    const res = await apiClient.get(`${base(companyId)}/finances`, { params: { skip, limit, eventsSkip } });
    return res.data;
  },

  async topUpBalance(companyId: string, amount: number): Promise<BalanceOperationResponse> {
    const res = await apiClient.post(`${base(companyId)}/finances/top-up`, { amount });
    return res.data;
  },

  async withdrawBalance(companyId: string, amount: number): Promise<BalanceOperationResponse> {
    const res = await apiClient.post(`${base(companyId)}/finances/withdraw`, { amount });
    return res.data;
  },
};
