import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Truck, Bell, DollarSign, Package } from 'lucide-react';
import { renterService } from '../../services/renterService';
import { StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const RenterDashboard = () => {
  const { companyId } = useParams<{ companyId: string }>();

  const { data: profile } = useQuery({
    queryKey: ['renter-profile', companyId],
    queryFn: () => renterService.getProfile(companyId!),
    enabled: !!companyId,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['renter-dashboard', companyId],
    queryFn: () => renterService.getDashboard(companyId!),
    enabled: !!companyId,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Truck size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
            <p className="text-gray-500 text-sm">ИНН: {profile?.inn}</p>
          </div>
          {profile?.is_verified && <Badge variant="green">Верифицирована</Badge>}
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Водителей" value={dashboard.total_drivers} icon={Users} color="blue" />
          <StatCard label="Всего аренд" value={dashboard.total_rentals} icon={Package} color="purple" />
          <StatCard label="Активных аренд" value={dashboard.active_rentals} icon={Package} color="green" />
          <StatCard label="Заявок" value={dashboard.total_requests} icon={Bell} color="yellow" />
          <StatCard label="Ожидают" value={dashboard.pending_requests} icon={Bell} color="red" />
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Баланс</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {Number(dashboard.balance).toLocaleString('ru-RU')} ₽
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <DollarSign size={22} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Водители', icon: Users, path: 'drivers', color: 'text-blue-400 bg-blue-500/20' },
            { label: 'Поиск авто', icon: Truck, path: 'cars', color: 'text-green-400 bg-green-500/20' },
            { label: 'Заявки', icon: Bell, path: 'requests', color: 'text-yellow-400 bg-yellow-500/20' },
            { label: 'Аренды', icon: Package, path: 'rentals', color: 'text-purple-400 bg-purple-500/20' },
          ].map(({ label, icon: Icon, path, color }) => (
            <a key={path} href={`/renter/${companyId}/${path}`}
              className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl transition-colors">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}><Icon size={18} /></div>
              <span className="text-gray-300 text-sm text-center">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
