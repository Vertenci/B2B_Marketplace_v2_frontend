import { apiClient } from '../api/client';
import type {
  Car, IotDevice, Geofence, RentalRequest, Rental,
  Finance, CompanyUser, Company, LessorDashboard,
  Telemetry, Violation, RentalDocument, RentalStatus, RentalRequestStatus,
  BalanceOperationResponse
} from '../types';

const base = (companyId: string) => `/lessor/${companyId}`;

export const lessorService = {
  async getProfile(companyId: string): Promise<Company> {
    const res = await apiClient.get(`${base(companyId)}/profile`);
    return res.data;
  },

  async getDashboard(companyId: string): Promise<LessorDashboard> {
    const res = await apiClient.get(`${base(companyId)}/dashboard`);
    return res.data;
  },

  async deleteCompany(companyId: string): Promise<void> {
    await apiClient.delete(`${base(companyId)}/delete`);
  },

  async getCars(companyId: string, skip = 0, limit = 20): Promise<Car[]> {
    const res = await apiClient.get(`${base(companyId)}/cars`, { params: { skip, limit } });
    return res.data;
  },

  async getCar(companyId: string, carId: string): Promise<Car> {
    const res = await apiClient.get(`${base(companyId)}/cars/${carId}`);
    return res.data;
  },

  async addCar(companyId: string, data: {
    brand: string; model: string; year: string;
    plate_number: string; vin: string; price_per_day: number; status?: string;
  }): Promise<Car> {
    const res = await apiClient.post(`${base(companyId)}/cars`, data);
    return res.data;
  },

  async updateCar(companyId: string, carId: string, data: Partial<{
    brand: string; model: string; year: string;
    plate_number: string; vin: string; price_per_day: number;
  }>): Promise<Car> {
    const res = await apiClient.put(`${base(companyId)}/cars/${carId}`, data);
    return res.data;
  },

  async deleteCar(companyId: string, carId: string): Promise<void> {
    await apiClient.delete(`${base(companyId)}/cars/${carId}`);
  },

  async updateCarStatus(companyId: string, carId: string, status: string): Promise<void> {
    await apiClient.patch(`${base(companyId)}/cars/${carId}/status`, { status });
  },

  async attachIot(companyId: string, carId: string, iotId: string): Promise<Car> {
    const res = await apiClient.post(`${base(companyId)}/cars/${carId}/iot`, { iot_id: iotId });
    return res.data;
  },

  async getCarIot(companyId: string, carId: string): Promise<IotDevice> {
    const res = await apiClient.get(`${base(companyId)}/cars/${carId}/iot`);
    return res.data;
  },

  async getIots(companyId: string, skip = 0, limit = 20): Promise<IotDevice[]> {
    const res = await apiClient.get(`${base(companyId)}/iots`, { params: { skip, limit } });
    return res.data;
  },

  async addIot(companyId: string, data: {
    device_identifier?: string; sim_number?: string; battery_level?: number; is_online?: boolean; car_id?: string;
  }): Promise<IotDevice> {
    const res = await apiClient.post(`${base(companyId)}/iots`, data);
    return res.data;
  },

  async updateIot(companyId: string, iotId: string, data: Partial<{
    device_identifier: string; sim_number: string; battery_level: number; is_online: boolean;
  }>): Promise<IotDevice> {
    const res = await apiClient.put(`${base(companyId)}/iots/${iotId}`, data);
    return res.data;
  },

  async deleteIot(companyId: string, iotId: string): Promise<void> {
    await apiClient.delete(`${base(companyId)}/iots/${iotId}`);
  },

  async getAllGeofences(companyId: string, skip = 0, limit = 50): Promise<Geofence[]> {
    const res = await apiClient.get(`${base(companyId)}/geofences`, { params: { skip, limit } });
    return res.data;
  },

  async getCarGeofences(companyId: string, carId: string): Promise<Geofence[]> {
    const res = await apiClient.get(`${base(companyId)}/cars/${carId}/geofences`);
    return res.data;
  },

  async createGeofence(companyId: string, carId: string, data: {
    name: string; center_lat: number; center_lng: number; radius_meters: number; is_active?: boolean;
  }): Promise<Geofence> {
    const res = await apiClient.post(`${base(companyId)}/cars/${carId}/geofences`, data);
    return res.data;
  },

  async updateGeofence(companyId: string, geofenceId: string, data: Partial<{
    name: string; center_lat: number; center_lng: number; radius_meters: number; is_active: boolean;
  }>): Promise<Geofence> {
    const res = await apiClient.put(`${base(companyId)}/geofences/${geofenceId}`, data);
    return res.data;
  },

  async toggleGeofence(companyId: string, geofenceId: string): Promise<{ id: string; is_active: boolean }> {
    const res = await apiClient.patch(`${base(companyId)}/geofences/${geofenceId}/toggle`);
    return res.data;
  },

  async deleteGeofence(companyId: string, geofenceId: string): Promise<void> {
    await apiClient.delete(`${base(companyId)}/geofences/${geofenceId}`);
  },

  async getRequests(companyId: string, status?: RentalRequestStatus, skip = 0, limit = 20): Promise<RentalRequest[]> {
    const res = await apiClient.get(`${base(companyId)}/requests`, {
      params: { status, skip, limit },
    });
    return res.data;
  },

  async approveRequest(companyId: string, requestId: string): Promise<Rental> {
    const res = await apiClient.post(`${base(companyId)}/requests/${requestId}/approve`);
    return res.data;
  },

  async rejectRequest(companyId: string, requestId: string): Promise<RentalRequest> {
    const res = await apiClient.post(`${base(companyId)}/requests/${requestId}/reject`);
    return res.data;
  },

  async getRentals(companyId: string, status?: RentalStatus, paymentPending = false, skip = 0, limit = 20): Promise<Rental[]> {
    const res = await apiClient.get(`${base(companyId)}/rentals`, {
      params: { status, payment_pending: paymentPending, skip, limit },
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

  async getRentalDocuments(companyId: string, rentalId: string): Promise<RentalDocument[]> {
    const res = await apiClient.get(`${base(companyId)}/rentals/${rentalId}/documents`);
    return res.data;
  },

  async completeRental(companyId: string, rentalId: string): Promise<Rental> {
    const res = await apiClient.post(`${base(companyId)}/rentals/${rentalId}/complete`);
    return res.data;
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
      const res = await apiClient.get(
        `${base(companyId)}/finances`,
        { params: { skip, limit, eventsSkip } }
      );
      return res.data;
  },

  async getEmployers(companyId: string): Promise<CompanyUser[]> {
    const res = await apiClient.get(`${base(companyId)}/employers`);
    return res.data;
  },

  async addEmployer(companyId: string, userEmail: string): Promise<CompanyUser> {
    const res = await apiClient.post(`${base(companyId)}/employers`, { user_email: userEmail });
    return res.data;
  },
  async topUpBalance(companyId: string, amount: number): Promise<BalanceOperationResponse> {
    const res = await apiClient.post(
      `${base(companyId)}/finances/top-up`,
      { amount }
    );
    return res.data;
  },

  async withdrawBalance(companyId: string, amount: number): Promise<BalanceOperationResponse> {
    const res = await apiClient.post(
      `${base(companyId)}/finances/withdraw`,
      { amount }
    );
    return res.data;
  },
};
