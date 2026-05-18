import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../store/authStore';

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      navigate('/login');
    },
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  const { setAuthenticated, setUser } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      setAuthenticated(true);
      try {
        const user = await profileService.getProfile();
        setUser(user);
        if (!user.public_offer_accepted) {
          navigate('/public-offer');
        } else {
          navigate('/dashboard');
        }
      } catch {
        navigate('/dashboard');
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    },
    onSuccess: () => {
      logout();
      navigate('/');
    },
    onError: () => {
      logout();
      navigate('/');
    },
  });
};

export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    enabled: isAuthenticated,
  });
};

export const useMyDashboard = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['my-dashboard'],
    queryFn: profileService.getDashboard,
    enabled: isAuthenticated,
  });
};
