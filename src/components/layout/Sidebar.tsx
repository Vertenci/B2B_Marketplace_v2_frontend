import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Car, MapPin, FileText,
  Package, DollarSign, Users, User, LogOut,
  Truck, Search, Bell, BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import type { Company } from '../../types';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}

interface SidebarProps {
  companyType: 'lessor' | 'renter' | 'driver' | null;
  companies?: Company[];
  activeCompany?: Company | null;
  onSelectCompany?: (company: Company) => void;
}

const LessorNav = (companyId: string): NavItem[] => [
  { to: `/lessor/${companyId}/dashboard`, icon: LayoutDashboard, label: 'Дашборд' },
  { to: `/lessor/${companyId}/cars`, icon: Car, label: 'Автопарк' },
  { to: `/lessor/${companyId}/geofences`, icon: MapPin, label: 'Геозоны' },
  { to: `/lessor/${companyId}/requests`, icon: Bell, label: 'Заявки' },
  { to: `/lessor/${companyId}/rentals`, icon: Package, label: 'Аренды' },
  { to: `/lessor/${companyId}/finances`, icon: DollarSign, label: 'Финансы' },
  { to: `/lessor/${companyId}/reports`, icon: BarChart3, label: 'Отчётность' },
  { to: `/lessor/${companyId}/employers`, icon: Users, label: 'Сотрудники' },
  { to: `/lessor/${companyId}/profile`, icon: Building2, label: 'Профиль компании' },
];

const RenterNav = (companyId: string): NavItem[] => [
  { to: `/renter/${companyId}/dashboard`, icon: LayoutDashboard, label: 'Дашборд' },
  { to: `/renter/${companyId}/drivers`, icon: Users, label: 'Водители' },
  { to: `/renter/${companyId}/cars`, icon: Search, label: 'Поиск авто' },
  { to: `/renter/${companyId}/requests`, icon: FileText, label: 'Заявки' },
  { to: `/renter/${companyId}/rentals`, icon: Truck, label: 'Аренды' },
  { to: `/renter/${companyId}/finances`, icon: DollarSign, label: 'Финансы' },
  { to: `/renter/${companyId}/reports`, icon: BarChart3, label: 'Отчётность' },
  { to: `/renter/${companyId}/profile`, icon: Building2, label: 'Профиль компании' },
];

const DriverNav: NavItem[] = [
  { to: '/driver/company', icon: Building2, label: 'Моя компания' },
  { to: '/driver/rentals', icon: Truck, label: 'Мои аренды' },
];

export const Sidebar = ({ companyType, companies, activeCompany, onSelectCompany }: SidebarProps) => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const getNavItems = (): NavItem[] => {
    if (!activeCompany) return [];
    if (companyType === 'lessor') return LessorNav(activeCompany.id);
    if (companyType === 'renter') return RenterNav(activeCompany.id);
    return [];
  };

  const navItems = companyType === 'driver' ? DriverNav : getNavItems();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f1923] border-r border-white/10 flex flex-col z-40">
      {/* Logo — всегда ведёт на главную / */}
      <div className="p-6 border-b border-white/10">
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center">
            <Truck size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">FleetMarket</span>
        </button>
      </div>

      {/* Company Switcher — только для lessor/renter */}
      {companyType !== 'driver' && companies && companies.length > 0 && onSelectCompany && (
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            {companyType === 'lessor' ? 'Арендодатель' : 'Арендатор'}
          </p>
          <div className="space-y-1">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCompany?.id === company.id
                    ? 'bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{company.name}</span>
                  {activeCompany?.id === company.id && (
                    <span className="w-2 h-2 bg-[#6C63FF] rounded-full flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard/Profile — только для не-водителей */}
        {companyType !== 'driver' && (
          <>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                  isActive ? 'bg-[#6C63FF]/20 text-[#6C63FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <LayoutDashboard size={18} />
              Главная
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                  isActive ? 'bg-[#6C63FF]/20 text-[#6C63FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <User size={18} />
              Мой профиль
            </NavLink>
          </>
        )}

        {/* Driver: только профиль */}
        {companyType === 'driver' && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                isActive ? 'bg-[#6C63FF]/20 text-[#6C63FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <User size={18} />
            Мой профиль
          </NavLink>
        )}

        {/* Company section */}
        {navItems.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3">
              <p className="text-xs text-gray-600 uppercase tracking-wider">
                {companyType === 'driver' ? 'Рабочая компания' : 'Компания'}
              </p>
            </div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors ${
                    isActive ? 'bg-[#6C63FF]/20 text-[#6C63FF]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom: user + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-[#6C63FF]/20 rounded-full flex items-center justify-center">
            <User size={14} className="text-[#6C63FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  );
};
