import { apiClient } from '../api/client';
import type { Company, Rental, Car, Telemetry, Violation, GeofenceEvent, RentalStatus } from '../types';

export const driverService = {
  async getMyCompany(): Promise<Company> {
    const res = await apiClient.get('/driver/my_company');
    return res.data;
  },

  async getMyRentals(status?: RentalStatus, skip = 0, limit = 20): Promise<Rental[]> {
    const res = await apiClient.get('/driver/my_company/rentals', {
      params: { status, skip, limit },
    });
    return res.data;
  },

  async getRental(rentalId: string): Promise<Rental> {
    const res = await apiClient.get(`/driver/rentals/${rentalId}`);
    return res.data;
  },

  async getRentalCar(rentalId: string): Promise<Car> {
    const res = await apiClient.get(`/driver/rentals/${rentalId}/car`);
    return res.data;
  },

  async getRentalTelemetry(rentalId: string): Promise<Telemetry> {
    const res = await apiClient.get(`/driver/rentals/${rentalId}/telemetry`);
    return res.data;
  },

  async getRentalViolations(rentalId: string): Promise<Violation[]> {
    const res = await apiClient.get(`/driver/rentals/${rentalId}/violations`);
    return res.data;
  },

  async getRentalGeofenceEvents(rentalId: string): Promise<GeofenceEvent[]> {
    const res = await apiClient.get(`/driver/rentals/${rentalId}/geofence_events`);
    return res.data;
  },
};
