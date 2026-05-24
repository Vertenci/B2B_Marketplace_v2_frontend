import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import PublicOffer from '../pages/PublicOffer';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';

import LessorDashboard from '../pages/lessor/LessorDashboard';
import LessorCars from '../pages/lessor/LessorCars';
import LessorGeofences from '../pages/lessor/LessorGeofences';
import LessorRequests from '../pages/lessor/LessorRequests';
import LessorRentals from '../pages/lessor/LessorRentals';
import LessorFinances from '../pages/lessor/LessorFinances';
import LessorEmployers from '../pages/lessor/LessorEmployers';
import LessorReports from '../pages/lessor/LessorReports';

import RenterDashboard from '../pages/renter/RenterDashboard';
import RenterDrivers from '../pages/renter/RenterDrivers';
import RenterCarSearch from '../pages/renter/RenterCarSearch';
import RenterRequests from '../pages/renter/RenterRequests';
import RenterRentals from '../pages/renter/RenterRentals';
import RenterFinances from '../pages/renter/RenterFinances';
import RenterReports from '../pages/renter/RenterReports';

import DriverRentals from '../pages/driver/DriverRentals';

import { AppLayout } from '../components/layout/AppLayout';


const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.public_offer_accepted) return <Navigate to="/public-offer" replace />;
  return <Outlet />;
};

const PublicOnlyRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user && !user.public_offer_accepted) return <Navigate to="/public-offer" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const OfferRoute = () => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};


export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },

  {
    element: <OfferRoute />,
    children: [
      { path: '/public-offer', element: <PublicOffer /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout companyType={null} />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/profile', element: <Profile /> },
        ],
      },

      {
        element: <AppLayout companyType="lessor" />,
        children: [
          { path: '/lessor/:companyId/dashboard', element: <LessorDashboard /> },
          { path: '/lessor/:companyId/cars', element: <LessorCars /> },
          { path: '/lessor/:companyId/geofences', element: <LessorGeofences /> },
          { path: '/lessor/:companyId/requests', element: <LessorRequests /> },
          { path: '/lessor/:companyId/rentals', element: <LessorRentals /> },
          { path: '/lessor/:companyId/finances', element: <LessorFinances /> },
          { path: '/lessor/:companyId/reports', element: <LessorReports /> },
          { path: '/lessor/:companyId/employers', element: <LessorEmployers /> },
          {
            path: '/lessor/:companyId/profile',
            element: <LessorDashboard />,
          },
        ],
      },

      {
        element: <AppLayout companyType="renter" />,
        children: [
          { path: '/renter/:companyId/dashboard', element: <RenterDashboard /> },
          { path: '/renter/:companyId/drivers', element: <RenterDrivers /> },
          { path: '/renter/:companyId/cars', element: <RenterCarSearch /> },
          { path: '/renter/:companyId/requests', element: <RenterRequests /> },
          { path: '/renter/:companyId/rentals', element: <RenterRentals /> },
          { path: '/renter/:companyId/finances', element: <RenterFinances /> },
          { path: '/renter/:companyId/reports', element: <RenterReports /> },
          {
            path: '/renter/:companyId/profile',
            element: <RenterDashboard />,
          },
        ],
      },

      {
        element: <AppLayout companyType="driver" />,
        children: [
          { path: '/driver/company', element: <DriverRentals /> },
          { path: '/driver/rentals', element: <DriverRentals /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
