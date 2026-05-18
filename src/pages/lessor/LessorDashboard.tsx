import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, Package, Bell, DollarSign, Building2 } from 'lucide-react';
import { lessorService } from '../../services/lessorService';
import { StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const LessorDashboard = () => {
  const { companyId } = useParams<{ companyId: string }>();

  const { data: profile } = useQuery({
    queryKey: ['lessor-profile', companyId],
    queryFn: () => lessorService.getProfile(companyId!),
    enabled: !!companyId,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['lessor-dashboard', companyId],
    queryFn: () => lessorService.getDashboard(companyId!),
    enabled: !!companyId,
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#6C63FF]/20 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-[#6C63FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
            <p className="text-gray-500 text-sm">ИНН: {profile?.inn}</p>
          </div>
          {profile?.is_verified && <Badge variant="green">Верифицирована</Badge>}
        </div>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Машин" value={dashboard.total_cars} icon={Car} color="blue" />
          <StatCard label="Всего аренд" value={dashboard.total_rentals} icon={Package} color="purple" />
          <StatCard label="Активных аренд" value={dashboard.active_rentals} icon={Package} color="green" />
          <StatCard label="Заявок" value={dashboard.total_requests} icon={Bell} color="yellow" />
          <StatCard label="Ожидают ответа" value={dashboard.pending_requests} icon={Bell} color="red" />
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

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Добавить машину', icon: Car, path: 'cars', color: 'text-blue-400 bg-blue-500/20' },
            { label: 'Заявки', icon: Bell, path: 'requests', color: 'text-yellow-400 bg-yellow-500/20' },
            { label: 'Активные аренды', icon: Package, path: 'rentals', color: 'text-green-400 bg-green-500/20' },
            { label: 'Финансы', icon: DollarSign, path: 'finances', color: 'text-purple-400 bg-purple-500/20' },
          ].map(({ label, icon: Icon, path, color }) => (
            <a
              key={path}
              href={`/lessor/${companyId}/${path}`}
              className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <span className="text-gray-300 text-sm text-center">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessorDashboard;
