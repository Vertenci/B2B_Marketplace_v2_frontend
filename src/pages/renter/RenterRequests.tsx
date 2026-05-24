import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, XCircle, Car, Calendar, Loader2, Building2 } from 'lucide-react';
import { renterService } from '../../services/renterService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { RentalRequestStatus } from '../../types';

const statusConfig: Record<RentalRequestStatus, { label: string; variant: 'yellow' | 'green' | 'red' | 'gray' }> = {
  PENDING: { label: 'Ожидает', variant: 'yellow' },
  APPROVED: { label: 'Одобрена', variant: 'green' },
  REJECTED: { label: 'Отклонена', variant: 'red' },
  CANCELLED: { label: 'Отменена', variant: 'gray' },
};

const RenterRequests = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RentalRequestStatus | undefined>(undefined);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['renter-requests', companyId, filter],
    queryFn: () => renterService.getRequests(companyId!, filter, 0, 50),
    enabled: !!companyId,
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => renterService.cancelRequest(companyId!, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-requests', companyId] }),
  });

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: undefined, label: 'Все' },
    { key: 'PENDING', label: 'Ожидают' },
    { key: 'APPROVED', label: 'Одобрены' },
    { key: 'REJECTED', label: 'Отклонены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Мои заявки</h1>

      <div className="flex gap-2 mb-6">
        {filterTabs.map(({ key, label }) => (
          <button key={label} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-[#6C63FF]" /></div>}
      <div className="space-y-4">
        {requests?.map(req => (
          <Card key={req.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={statusConfig[req.status].variant}>{statusConfig[req.status].label}</Badge>
                  <span className="text-gray-500 text-xs">{new Date(req.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <Car size={14} className="text-[#6C63FF] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Автомобиль</p>
                      <p className="text-sm text-white font-medium">{req.car.brand} {req.car.model}</p>
                      <p className="text-xs text-gray-500">{req.car.plate_number} · {Number(req.car.price_per_day).toLocaleString('ru-RU')} ₽/день</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <Calendar size={14} className="text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Период</p>
                      <p className="text-sm text-white">{new Date(req.start_date).toLocaleDateString('ru-RU')}</p>
                      <p className="text-sm text-white">— {new Date(req.end_date).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                </div>
                {req.company && (
                  <p className="flex items-center gap-1 text-gray-500 text-xs mt-2">
                    <Building2 size={12} />
                    Компания: {req.company.name}
                  </p>
                )}
                {req.message && <p className="text-xs text-gray-400 mt-2 italic">«{req.message}»</p>}
              </div>
              {req.status === 'PENDING' && (
                <button onClick={() => cancelMutation.mutate(req.id)} disabled={cancelMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors flex-shrink-0">
                  {cancelMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Отменить
                </button>
              )}
            </div>
          </Card>
        ))}
        {!requests?.length && !isLoading && (
          <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Заявок нет</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenterRequests;
