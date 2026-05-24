import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Car, Filter, Loader2, Plus, Calendar, MapPin, Building2, TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renterService } from '../../services/renterService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RenterCarSearch = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [brand, setBYNand] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requestModal, setRequestModal] = useState<{ carId: string; pricePerDay: number } | null>(null);
  const [mapModalCar, setMapModalCar] = useState<string | null>(null);
  const [priceChartCar, setPriceChartCar] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [reqForm, setReqForm] = useState({ driver_id: '', start_date: '', end_date: '', message: '' });

  const { data: cars, isLoading, refetch } = useQuery({
    queryKey: ['renter-cars', companyId, brand, maxPrice, companyName],
    queryFn: () => renterService.searchCars(companyId!, {
      brand: brand || undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      company_name: companyName || undefined,
      limit: 30,
    }),
    enabled: !!companyId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: drivers } = useQuery({
    queryKey: ['renter-drivers', companyId],
    queryFn: () => renterService.getDrivers(companyId!),
    enabled: !!companyId,
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['car-price-history', priceChartCar, chartPeriod],
    queryFn: () => renterService.getCarPriceHistory(companyId!, priceChartCar!, chartPeriod),
    enabled: !!priceChartCar && !!companyId,
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

  const formatChartDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-4">Поиск автомобилей</h1>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Марка авто" value={brand} onChange={e => setBYNand(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none w-32 placeholder-gray-500" />
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <span className="text-gray-400 text-sm">до</span>
            <input type="number" placeholder="Макс. цена/день" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none w-32 placeholder-gray-500" />
            <span className="text-gray-500 text-sm">BYN</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
            <Building2 size={16} className="text-gray-400" />
            <input type="text" placeholder="Компания" value={companyName} onChange={e => setCompanyName(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none w-40 placeholder-gray-500" />
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
                <p className="text-green-400 font-semibold mt-1">{Number(car.price_per_day).toLocaleString('ru-RU')} BYN/день</p>
                {car.company && (
                  <p className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <Building2 size={12} />
                    {car.company.name}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setPriceChartCar(car.id); setChartPeriod('ALL'); }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs transition-colors"
                  >
                    <TrendingUp size={12} />График цен
                  </button>
                  {car.iot_device && (
                    <button
                      onClick={() => setMapModalCar(car.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs transition-colors"
                    >
                      <MapPin size={12} />Геопозиция
                    </button>
                  )}
                  <button
                    onClick={() => setRequestModal({ carId: car.id, pricePerDay: Number(car.price_per_day) })}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#6C63FF]/10 border border-[#6C63FF]/20 hover:bg-[#6C63FF]/20 text-[#6C63FF] rounded-xl text-sm transition-colors"
                  >
                    <Plus size={14} />Оформить заявку
                  </button>
                </div>
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
                {days} дней × {Number(requestModal?.pricePerDay || 0).toLocaleString('ru-RU')} BYN
              </div>
              <p className="text-white font-bold">{totalCost.toLocaleString('ru-RU')} BYN</p>
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

      <Modal isOpen={!!mapModalCar} onClose={() => setMapModalCar(null)} title="Геопозиция" size="xl">
        {mapModalCar && (() => {
          const car = cars?.find(c => c.id === mapModalCar);
          const telemetry = car?.telemetries?.[car.telemetries.length - 1];
          const lat = telemetry ? Number(telemetry.lat) : (car?.iot_device?.last_lat ? Number(car.iot_device.last_lat) : null);
          const lng = telemetry ? Number(telemetry.lng) : (car?.iot_device?.last_lng ? Number(car.iot_device.last_lng) : null);
          const updatedAt = telemetry?.recorded_at || car?.iot_device?.last_seen_at;
          if (lat === null || lng === null) return <div className="text-center py-8 text-gray-500"><MapPin size={32} className="mx-auto mb-2 opacity-40" /><p>Нет данных телеметрии</p></div>;
          return (
            <>
              <div className="rounded-xl overflow-hidden" style={{ height: 380 }}>
                <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      {car?.brand} {car?.model} ({car?.plate_number})<br />
                      {updatedAt ? new Date(updatedAt).toLocaleString('ru-RU') : ''}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-gray-400">
                <span>Координаты: <span className="text-white">{lat.toFixed(5)}, {lng.toFixed(5)}</span></span>
                <span>Обновлено: <span className="text-white">{updatedAt ? new Date(updatedAt).toLocaleString('ru-RU') : '—'}</span></span>
              </div>
            </>
          );
        })()}
      </Modal>

      <Modal isOpen={!!priceChartCar} onClose={() => setPriceChartCar(null)} title="График цены" size="lg">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['WEEK', 'MONTH', 'ALL'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${chartPeriod === p ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                {p === 'WEEK' ? 'Неделя' : p === 'MONTH' ? 'Месяц' : 'Всё время'}
              </button>
            ))}
          </div>
          <div className="bg-[#0f1923] rounded-xl p-4" style={{ height: 320 }}>
            {priceHistory && priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3b" />
                  <XAxis dataKey="created_at" tickFormatter={formatChartDate} stroke="#4a5568" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4a5568" fontSize={11} tickFormatter={(v: number) => `${v.toLocaleString('ru-RU')}BYN`} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2a3b', border: '1px solid #2d3748', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} BYN`, 'Цена']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#6C63FF" strokeWidth={2} fill="url(#priceGradient)" dot={false} activeDot={{ r: 4, fill: '#6C63FF' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <TrendingUp size={32} className="mr-3 opacity-40" />
                <p>Нет данных об изменении цены</p>
              </div>
            )}
          </div>
          {priceHistory && priceHistory.length > 1 && (
            <div className="flex gap-4 text-sm text-gray-400">
              <span>Мин: <span className="text-white">{Math.min(...priceHistory.map(p => p.price)).toLocaleString('ru-RU')} BYN</span></span>
              <span>Макс: <span className="text-white">{Math.max(...priceHistory.map(p => p.price)).toLocaleString('ru-RU')} BYN</span></span>
              <span>Сейчас: <span className="text-white">{priceHistory[priceHistory.length - 1].price.toLocaleString('ru-RU')} BYN</span></span>
              <span>Изменений: <span className="text-white">{priceHistory.length}</span></span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RenterCarSearch;
