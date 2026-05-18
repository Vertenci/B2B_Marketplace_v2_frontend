import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Car, Filter, Loader2, Plus, Calendar } from 'lucide-react';
import { renterService } from '../../services/renterService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const RenterCarSearch = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [brand, setBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [requestModal, setRequestModal] = useState<{ carId: string; pricePerDay: number } | null>(null);
  const [reqForm, setReqForm] = useState({ driver_id: '', start_date: '', end_date: '', message: '' });

  const { data: cars, isLoading, refetch } = useQuery({
    queryKey: ['renter-cars', companyId, brand, maxPrice],
    queryFn: () => renterService.searchCars(companyId!, {
      brand: brand || undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      limit: 30,
    }),
    enabled: !!companyId,
    staleTime: 0,           // всегда считать данные устаревшими
    refetchOnMount: true,   // рефетч при монтировании компонента
  });

  const { data: drivers } = useQuery({
    queryKey: ['renter-drivers', companyId],
    queryFn: () => renterService.getDrivers(companyId!),
    enabled: !!companyId,
  });

  const requestMutation = useMutation({
    mutationFn: () => renterService.createRequest(companyId!, {
      car_id: requestModal!.carId,
      driver_id: reqForm.driver_id,
      start_date: new Date(reqForm.start_date).toISOString(),
      end_date: new Date(reqForm.end_date).toISOString(),
      message: reqForm.message || undefined,
    }),
    onSuccess: () => {
      setRequestModal(null);
      setReqForm({ driver_id: '', start_date: '', end_date: '', message: '' });
      queryClient.invalidateQueries({ queryKey: ['renter-requests'] });
    },
  });

  const days = reqForm.start_date && reqForm.end_date
    ? Math.ceil((new Date(reqForm.end_date).getTime() - new Date(reqForm.start_date).getTime()) / 86400000)
    : 0;

  const totalCost = days > 0 && requestModal ? days * requestModal.pricePerDay : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-4">Поиск автомобилей</h1>
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Марка авто" value={brand} onChange={e => setBrand(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none w-32 placeholder-gray-500" />
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <span className="text-gray-400 text-sm">до</span>
            <input type="number" placeholder="Макс. цена/день" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none w-32 placeholder-gray-500" />
            <span className="text-gray-500 text-sm">₽</span>
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2.5 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl text-white text-sm transition-colors">
            <Filter size={14} />Найти
          </button>
        </div>
      </div>

      {isLoading && <div className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cars?.map(car => (
          <Card key={car.id} hover>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#6C63FF]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Car size={20} className="text-[#6C63FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{car.brand} {car.model}</h3>
                  <Badge variant="green">Доступна</Badge>
                </div>
                <p className="text-gray-500 text-sm">{car.year} · {car.plate_number}</p>
                <p className="text-green-400 font-semibold mt-1">{Number(car.price_per_day).toLocaleString('ru-RU')} ₽/день</p>
                {car.company && <p className="text-gray-600 text-xs mt-1">{car.company.name}</p>}
                <button
                  onClick={() => setRequestModal({ carId: car.id, pricePerDay: Number(car.price_per_day) })}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-[#6C63FF]/10 border border-[#6C63FF]/20 hover:bg-[#6C63FF]/20 text-[#6C63FF] rounded-xl text-sm transition-colors"
                >
                  <Plus size={14} />Оформить заявку
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!cars?.length && !isLoading && (
          <div className="col-span-3 text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <Car size={40} className="mx-auto mb-3 opacity-30" />
            <p>Доступных автомобилей не найдено</p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal isOpen={!!requestModal} onClose={() => setRequestModal(null)} title="Заявка на аренду" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Водитель</label>
            <select value={reqForm.driver_id} onChange={e => setReqForm(f => ({ ...f, driver_id: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60">
              <option value="">-- Выберите водителя --</option>
              {drivers?.filter(d => d.is_active).map(d => (
                <option key={d.id} value={d.user_id}>
                  {d.user?.full_name || d.user_id} ({d.user?.email})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Дата начала</label>
              <input type="date" value={reqForm.start_date} onChange={e => setReqForm(f => ({ ...f, start_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Дата окончания</label>
              <input type="date" value={reqForm.end_date} onChange={e => setReqForm(f => ({ ...f, end_date: e.target.value }))}
                min={reqForm.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Сообщение (необязательно)</label>
            <textarea value={reqForm.message} onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Дополнительная информация..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 resize-none h-20" />
          </div>
          {days > 0 && (
            <div className="flex items-center justify-between p-4 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Calendar size={14} className="text-[#6C63FF]" />
                {days} дней × {Number(requestModal?.pricePerDay || 0).toLocaleString('ru-RU')} ₽
              </div>
              <p className="text-white font-bold">{totalCost.toLocaleString('ru-RU')} ₽</p>
            </div>
          )}
          {requestMutation.isError && <p className="text-red-400 text-sm">Ошибка создания заявки</p>}
          <div className="flex gap-3">
            <button onClick={() => setRequestModal(null)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button
              onClick={() => requestMutation.mutate()}
              disabled={!reqForm.driver_id || !reqForm.start_date || !reqForm.end_date || requestMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              {requestMutation.isPending && <Loader2 size={14} className="animate-spin" />}Отправить заявку
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RenterCarSearch;
