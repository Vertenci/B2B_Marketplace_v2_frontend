export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  public_offer_accepted: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type CompanyType = 'lessor' | 'renter';

export interface Company {
  id: string;
  name: string;
  inn: string;
  type: CompanyType;
  balance: number;
  is_verified: boolean;
  created_at: string;
}

export interface CompanyTypeItem {
  type: CompanyType;
  label: string;
}

export interface CompanyUser {
  id: string;
  user_id: string;
  company_id: string;
  position: 'owner' | 'driver';
  is_active: boolean;
  created_at: string;
}

export interface MainDashboard {
  total_companies: number;
  total_users: number;
  total_lessor_companies: number;
  total_renter_companies: number;
}

export interface MyDashboard {
  total_companies: number;
  companies_by_type: { type: CompanyType; count: number }[];
}

export interface LessorDashboard {
  total_cars: number;
  total_rentals: number;
  active_rentals: number;
  total_requests: number;
  pending_requests: number;
  balance: number;
}

export interface RenterDashboard {
  total_drivers: number;
  total_rentals: number;
  active_rentals: number;
  total_requests: number;
  pending_requests: number;
  balance: number;
}

export type CarStatus = 'AVAILABLE' | 'RENTED' | 'INACTIVE' | 'HIDDEN';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate_number: string;
  vin: string;
  price_per_day: number;
  status: CarStatus;
  company: CompanyShort;
  iot_device?: IotDeviceShort;
  geofences: GeofenceShort[];
  rental_requests: RentalRequestShort[];
  rentals: RentalShort[];
  telemetries: TelemetryShort[];
}

export interface CompanyShort {
  name: string;
  type: CompanyType;
  is_verified: boolean;
  created_at: string;
}

export interface IotDeviceShort {
  device_identifier: string | null;
  sim_number: string | null;
  battery_level: number | null;
  is_online: boolean;
  last_seen_at?: string | null;
  last_lat?: number | null;
  last_lng?: number | null;
}

export interface GeofenceShort {
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export interface RentalRequestShort {
  id: string;
  user: { id: string; email: string; full_name: string };
  start_date: string;
  end_date: string;
  message: string | null;
  status: RentalRequestStatus;
}

export interface RentalShort {
  id: string;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  base_price_total: number;
  status: RentalStatus;
  is_paid: boolean;
  lessor_company: CompanyShort;
  renter_company: CompanyShort;
}

export interface TelemetryShort {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  recorded_at: string;
}

export interface IotDevice {
  id: string;
  device_identifier: string | null;
  sim_number: string | null;
  battery_level: number | null;
  is_online: boolean;
  last_seen_at?: string | null;
  last_lat?: number | null;
  last_lng?: number | null;
  car: { id: string; brand?: string | null; model?: string | null; plate_number?: string | null } | null;
}

export interface Geofence {
  id: string;
  car_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  car?: {
    id: string;
    brand: string;
    model: string;
    plate_number: string;
    status: CarStatus;
  };
}

export type RentalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface RentalRequest {
  id: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: RentalRequestStatus;
  created_at: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: string;
    plate_number: string;
    price_per_day: number;
  };
  company: {
    id: string;
    name: string;
    inn: string;
    type: string;
  };
  user: {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    role: string;
  };
}

export type RentalStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE';

export interface Payment {
  id: string;
  amount: number;
  commission_amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  payment_method: 'BALANCE' | 'CARD';
  paid_at: string | null;
  payer_company?: CompanyShort | null;
  receiver_company?: CompanyShort | null;
}

export interface RentalDocument {
  id: string;
  type: 'act' | 'invoice' | 'contract';
  file_path: string;
  generated_at: string;
}

export interface Telemetry {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  recorded_at: string;
  rental?: { id: string; start_date: string; end_date: string; status: RentalStatus } | null;
  car?: { id: string; brand: string; model: string; plate_number: string; vin: string; price_per_day: number; status: CarStatus } | null;
  user?: { id: string; email: string; phone: string; full_name: string } | null;
}

export interface GeofenceEvent {
  id: string;
  type: 'EXIT' | 'ENTER';
  lat: number;
  lng: number;
  triggered_at: string;
  geofence?: GeofenceShort | null;
}

export interface Violation {
  id: string;
  type: 'GEOFENCE_EXIT' | 'SPEEDING' | null;
  severity: 'WARNING' | null;
  created_at: string;
  geofence_event?: GeofenceEvent | null;
}

export interface Rental {
  id: string;
  request_id: string;
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  base_price_total: number;
  extra_days_fee: number;
  status: RentalStatus;
  is_paid: boolean;
  created_at: string;
  rental_request?: RentalRequestShort | null;
  lessor_company?: { id: string; name: string; inn: string; type: CompanyType; is_verified: boolean } | null;
  renter_company?: { id: string; name: string; inn: string; type: CompanyType; is_verified: boolean } | null;
  car?: { id: string; brand: string; model: string; year: string; plate_number: string; vin: string; price_per_day: number; status: CarStatus } | null;
  user?: { id: string; email: string; phone: string; full_name: string } | null;
  payment?: Payment | null;
  rental_documents: RentalDocument[];
  telemetries: TelemetryShort[];
  geofence_events: GeofenceEvent[];
  violations: Violation[];
}

export interface FinancePayment {
  id: string;
  amount: number;
  commission_amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  payment_method: 'BALANCE' | 'CARD';
  paid_at: string | null;
  rental?: { id: string; start_date: string; end_date: string; base_price_total: number; status: RentalStatus } | null;
  payer_company?: { id: string; name: string; inn: string } | null;
  receiver_company?: { id: string; name: string; inn: string } | null;
}

export interface BalanceEvent {
  id: string;
  event_type: 'TOP_UP' | 'WITHDRAW';
  balance_before: number;
  balance_after: number;
  operation_amount: number;
  created_at: string;
}

export interface Finance {
  balance: number;
  payments: FinancePayment[];
  balance_events: BalanceEvent[];
}

export interface BalanceOperationResponse {
  company_id: string;
  balance: number;
}

export interface DriverCompanyUser {
  id: string;
  user_id: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
  } | null;
}

export interface Agreement {
  id: string;
  user_id: string;
  type: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}
