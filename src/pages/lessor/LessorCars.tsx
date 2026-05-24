import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Car, Cpu, Trash2, Loader2, Wifi, WifiOff, MapPin, Edit3 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { lessorService } from '../../services/lessorService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { CarStatus } from '../../types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusBadge: Record<CarStatus, { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray' }> = {
  AVAILABLE: { label: 'Доступна', variant: 'green' },
  RENTED: { label: 'В аренде', variant: 'blue' },
  INACTIVE: { label: 'Неактивна', variant: 'yellow' },
  HIDDEN: { label: 'Скрыта', variant: 'gray' },
};

const LessorCars = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'cars' | 'iots'>('cars');
  const [addCarModal, setAddCarModal] = useState(false);
  const [addIotModal, setAddIotModal] = useState(false);
  const [attachIotModal, setAttachIotModal] = useState<{ carId: string } | null>(null);
  const [carForm, setCarForm] = useState({ brand: '', model: '', year: '', plate_number: '', vin: '', price_per_day: '' });
  const [iotForm, setIotForm] = useState({ device_identifier: '', sim_number: '', battery_level: '' });
  const [attachIotId, setAttachIotId] = useState('');
  const [mapModalIot, setMapModalIot] = useState<string | null>(null);
  const [editCarModal, setEditCarModal] = useState<string | null>(null);
  const [editIotModal, setEditIotModal] = useState<string | null>(null);
  const [editCarForm, setEditCarForm] = useState({ brand: '', model: '', year: '', plate_number: '', vin: '', price_per_day: '' });
  const [editIotForm, setEditIotForm] = useState({ device_identifier: '', sim_number: '', battery_level: '' });
  const [iotErrors, setIotErrors] = useState<Record<string, string>>({});
  const [carErrors, setCarErrors] = useState<Record<string, string>>({});
  const [editCarErrors, setEditCarErrors] = useState<Record<string, string>>({});
  const [editIotErrors, setEditIotErrors] = useState<Record<string, string>>({});

  const { data: cars, isLoading: carsLoading } = useQuery({
    queryKey: ['lessor-cars', companyId],
    queryFn: async () => {
      const data = await lessorService.getCars(companyId!, 0, 50);
      return data.sort((a, b) => {
        const cmp = a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
        return cmp || a.plate_number.localeCompare(b.plate_number);
      });
    },
    enabled: !!companyId,
    refetchInterval: (query) => {
        if (query.state.error) return false;
        return 3000;
    },
    refetchIntervalInBackground: false,
    staleTime: 2000,
  });

  const { data: iots } = useQuery({
    queryKey: ['lessor-iots', companyId],
    queryFn: () => lessorService.getIots(companyId!, 0, 50),
    enabled: !!companyId,
    refetchInterval: (query) => {
        if (query.state.error) return false;
        return 3000;
    },
    refetchIntervalInBackground: false,
    staleTime: 2000,
  });

  const addCarMutation = useMutation({
    mutationFn: () => lessorService.addCar(companyId!, {
      brand: carForm.brand.trim(),
      model: carForm.model.trim(),
      year: carForm.year,
      plate_number: carForm.plate_number.trim().toUpperCase(),
      vin: carForm.vin.trim().toUpperCase(),
      price_per_day: Number(carForm.price_per_day),
      status: 'HIDDEN'
    }),
    onSuccess: () => {
      setAddCarModal(false);
      setCarForm({ brand: '', model: '', year: '', plate_number: '', vin: '', price_per_day: '' });
      setCarErrors({});
      queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] });
    },
  });

  const addIotMutation = useMutation({
    mutationFn: () => lessorService.addIot(companyId!, {
      device_identifier: iotForm.device_identifier || undefined,
      sim_number: iotForm.sim_number || undefined,
      battery_level: iotForm.battery_level ? Number(iotForm.battery_level) : undefined,
      is_online: false,
    }),
    onSuccess: () => {
      setAddIotModal(false);
      setIotForm({ device_identifier: '', sim_number: '', battery_level: '' });
      setIotErrors({});
      queryClient.invalidateQueries({ queryKey: ['lessor-iots', companyId] });
    },
  });

  const attachIotMutation = useMutation({
    mutationFn: ({ carId, iotId }: { carId: string; iotId: string }) =>
      lessorService.attachIot(companyId!, carId, iotId),
    onSuccess: () => {
      setAttachIotModal(null);
      setAttachIotId('');
      queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['lessor-iots', companyId] });
    },
  });

  const detachIotMutation = useMutation({
    mutationFn: (carId: string) => lessorService.detachIot(companyId!, carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['lessor-iots', companyId] });
    },
  });

  const deleteCarMutation = useMutation({
    mutationFn: (carId: string) => lessorService.deleteCar(companyId!, carId),
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] });
    queryClient.invalidateQueries({ queryKey: ['lessor-iots', companyId] });
  }, 
  });

  const deleteIotMutation = useMutation({
    mutationFn: (iotId: string) => lessorService.deleteIot(companyId!, iotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessor-iots', companyId] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ carId, status }: { carId: string; status: string }) =>
      lessorService.updateCarStatus(companyId!, carId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] }),
  });

  const updateCarMutation = useMutation({
    mutationFn: () => lessorService.updateCar(companyId!, editCarModal!, {
      brand: editCarForm.brand.trim(),
      model: editCarForm.model.trim(),
      year: editCarForm.year,
      plate_number: editCarForm.plate_number.trim().toUpperCase(),
      vin: editCarForm.vin.trim().toUpperCase(),
      price_per_day: Number(editCarForm.price_per_day),
    }),
    onSuccess: () => {
      setEditCarModal(null);
      setEditCarForm({ brand: '', model: '', year: '', plate_number: '', vin: '', price_per_day: '' });
      setEditCarErrors({});
      queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] });
    },
  });

  const updateIotMutation = useMutation({
    mutationFn: () => lessorService.updateIot(companyId!, editIotModal!, {
      device_identifier: editIotForm.device_identifier || undefined,
      sim_number: editIotForm.sim_number || undefined,
      battery_level: editIotForm.battery_level ? Number(editIotForm.battery_level) : undefined,
    }),
    onSuccess: () => {
      setEditIotModal(null);
      setEditIotForm({ device_identifier: '', sim_number: '', battery_level: '' });
      setEditIotErrors({});
      queryClient.invalidateQueries({ queryKey: ['lessor-iots', companyId] });
    },
  });

  const freeIots = iots?.filter(i => !i.car);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Автопарк</h1>
        <div className="flex gap-2">
          <button onClick={() => setAddIotModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-300 text-sm transition-colors">
            <Cpu size={16} />
            IoT устройство
          </button>
          <button onClick={() => setAddCarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl text-white text-sm transition-colors">
            <Plus size={16} />
            Добавить машину
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit">
        {(['cars', 'iots'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'cars' ? `Машины (${cars?.length || 0})` : `IoT устройства (${iots?.length || 0})`}
          </button>
        ))}
      </div>

      {tab === 'cars' && (
        <div className="space-y-4">
          {carsLoading && <div className="text-center text-gray-500 py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>}
          {cars?.map(car => (
            <Card key={car.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#6C63FF]/10 rounded-xl flex items-center justify-center">
                    <Car size={20} className="text-[#6C63FF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{car.brand} {car.model} {car.year}</h3>
                      <Badge variant={statusBadge[car.status].variant}>{statusBadge[car.status].label}</Badge>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Гос. номер: <span className="text-gray-300">{car.plate_number}</span>
                      &nbsp;·&nbsp;VIN: <span className="text-gray-300">{car.vin}</span>
                      &nbsp;·&nbsp;<span className="text-green-400">{Number(car.price_per_day).toLocaleString('ru-RU')} BYN/день</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {car.iot_device ? (
                        <>
                          <Wifi size={12} className="text-green-400" />
                          <span className="text-xs text-gray-500">
                            {car.iot_device.device_identifier || 'IoT'}&nbsp;
                            {car.iot_device.battery_level != null && (
                              <span className={car.iot_device.battery_level > 30 ? 'text-green-400' : 'text-red-400'}>
                                {car.iot_device.battery_level}%
                              </span>
                            )}
                          </span>
                          {car.status !== 'RENTED' && (
                            <button
                              onClick={() => {
                                if (confirm('Отвязать IoT устройство от машины?')) {
                                  detachIotMutation.mutate(car.id);
                                }
                              }}
                              disabled={detachIotMutation.isPending}
                              className="px-2 py-0.5 text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded transition-colors"
                              title="Отвязать IoT"
                            >
                              {detachIotMutation.isPending ? '...' : 'Отвязать'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-600">Нет IoT устройства</span>
                      )}
                      {car.geofences.length > 0 ? (
                        <span className="text-xs text-gray-500">
                          {car.geofences[0].name} · {car.geofences[0].radius_meters}м
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">Нет геозоны</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status selector */}
                    {car.iot_device && car.geofences.length > 0 && (
                      <select
                        value={car.status}
                        onChange={e => {
                          const newStatus = e.target.value;
                          
                          if (car.status === 'RENTED') {
                            alert('Нельзя изменить статус машины во время аренды');
                            return;
                          }
                          
                          if (newStatus === 'AVAILABLE' && car.geofences.length === 0) {
                            alert('Нельзя сделать машину доступной без геозоны');
                            return;
                          }
                          
                          updateStatusMutation.mutate({ carId: car.id, status: newStatus });
                        }}
                        disabled={car.status === 'RENTED'}
                        className={`px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none ${
                          car.status === 'RENTED' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="AVAILABLE">Доступна</option>
                        <option value="INACTIVE">Неактивна</option>
                        <option value="HIDDEN">Скрыта</option>
                      </select>
                    )}
                  {/* Attach IoT */}
                  {!car.iot_device && (
                    <button
                      onClick={() => setAttachIotModal({ carId: car.id })}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Привязать IoT"
                    >
                      <Cpu size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (car.status !== 'HIDDEN') return;
                      setEditCarForm({
                        brand: car.brand,
                        model: car.model,
                        year: car.year,
                        plate_number: car.plate_number,
                        vin: car.vin,
                        price_per_day: String(car.price_per_day),
                      });
                      setEditCarModal(car.id);
                    }}
                    disabled={car.status !== 'HIDDEN'}
                    title={car.status !== 'HIDDEN' ? 'Редактирование доступно только для скрытых машин' : undefined}
                    className={`p-2 rounded-lg transition-colors ${
                      car.status === 'HIDDEN'
                        ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (car.status === 'RENTED') {
                        alert('Нельзя удалить машину во время аренды');
                        return;
                      }
                      if (confirm('Удалить машину?')) deleteCarMutation.mutate(car.id);
                    }}
                    disabled={car.status === 'RENTED'}
                    className={`p-2 rounded-lg transition-colors ${
                      car.status === 'RENTED'
                        ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {!cars?.length && !carsLoading && (
            <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl">
              <Car size={40} className="mx-auto mb-3 opacity-30" />
              <p>Машин пока нет. Добавьте первую!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'iots' && (
        <div className="space-y-4">
          {iots?.map(iot => (
            <Card key={iot.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iot.is_online ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Cpu size={18} className={iot.is_online ? 'text-green-400' : 'text-gray-500'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white font-mono text-sm">{iot.device_identifier || '—'}</p>
                      <Badge variant={iot.is_online ? 'green' : 'gray'}>{iot.is_online ? 'Online' : 'Offline'}</Badge>
                      {iot.car ? <Badge variant="blue">Привязан к авто</Badge> : <Badge variant="gray">Свободен</Badge>}
                    </div>
                    <p className="text-gray-500 text-sm">
                      SIM: {iot.sim_number || '—'}
                      &nbsp;·&nbsp;Батарея: <span className={iot.battery_level && iot.battery_level > 30 ? 'text-green-400' : 'text-red-400'}>{iot.battery_level ?? '—'}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {iot.car && iot.last_lat != null && iot.last_lng != null && (
                    <button
                      onClick={() => setMapModalIot(iot.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs transition-colors"
                    >
                      <MapPin size={12} />На карте
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (iot.car) return;
                      setEditIotForm({
                        device_identifier: iot.device_identifier || '',
                        sim_number: iot.sim_number || '',
                        battery_level: iot.battery_level != null ? String(iot.battery_level) : '',
                      });
                      setEditIotModal(iot.id);
                    }}
                    disabled={!!iot.car}
                    title={iot.car ? 'Редактирование недоступно для привязанных устройств' : undefined}
                    className={`p-2 rounded-lg transition-colors ${
                      iot.car
                        ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Удалить IoT устройство?')) deleteIotMutation.mutate(iot.id);
                    }}
                    disabled={!!iot.car}
                    className={`p-2 rounded-lg transition-colors ${
                      iot.car
                        ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {!iots?.length && <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl"><Cpu size={40} className="mx-auto mb-3 opacity-30" /><p>IoT устройств нет</p></div>}
        </div>
      )}

      {/* Add Car Modal */}
      <Modal isOpen={addCarModal} onClose={() => {
        setAddCarModal(false);
        setCarErrors({});
      }} title="Добавить машину" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {/* Марка */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Марка</label>
            <input
              type="text"
              value={carForm.brand}
              onChange={e => {
                setCarForm(f => ({ ...f, brand: e.target.value }));
                setCarErrors(prev => ({ ...prev, brand: '' }));
              }}
              placeholder="Toyota"
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${
                carErrors.brand ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {carErrors.brand && <p className="text-red-400 text-xs mt-1">{carErrors.brand}</p>}
          </div>

          {/* Модель */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Модель</label>
            <input
              type="text"
              value={carForm.model}
              onChange={e => {
                setCarForm(f => ({ ...f, model: e.target.value }));
                setCarErrors(prev => ({ ...prev, model: '' }));
              }}
              placeholder="Camry"
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${
                carErrors.model ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {carErrors.model && <p className="text-red-400 text-xs mt-1">{carErrors.model}</p>}
          </div>

          {/* Год */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Год</label>
            <input
              type="text"
              value={carForm.year}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || /^\d{0,4}$/.test(value)) {
                  setCarForm(f => ({ ...f, year: value }));
                  setCarErrors(prev => ({ ...prev, year: '' }));
                }
              }}
              placeholder="2023"
              maxLength={4}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${
                carErrors.year ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {carErrors.year && <p className="text-red-400 text-xs mt-1">{carErrors.year}</p>}
          </div>

          {/* Гос. номер */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Гос. номер</label>
            <input
              type="text"
              value={carForm.plate_number}
              onChange={e => {
                const upperValue = e.target.value.toUpperCase();
                setCarForm(f => ({ ...f, plate_number: upperValue }));
                setCarErrors(prev => ({ ...prev, plate_number: '' }));
              }}
              placeholder="А123ВС77"
              maxLength={8}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm uppercase ${
                carErrors.plate_number ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {carErrors.plate_number && <p className="text-red-400 text-xs mt-1">{carErrors.plate_number}</p>}
          </div>

          {/* VIN */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">VIN</label>
            <input
              type="text"
              value={carForm.vin}
              onChange={e => {
                const upperValue = e.target.value.toUpperCase();
                setCarForm(f => ({ ...f, vin: upperValue }));
                setCarErrors(prev => ({ ...prev, vin: '' }));
              }}
              placeholder="JT..."
              maxLength={17}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm uppercase ${
                carErrors.vin ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {carErrors.vin && <p className="text-red-400 text-xs mt-1">{carErrors.vin}</p>}
          </div>

          {/* Цена */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Цена/день (BYN)</label>
            <input
              type="number"
              value={carForm.price_per_day}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || (Number(value) >= 1 && Number(value) <= 1000000)) {
                  setCarForm(f => ({ ...f, price_per_day: value }));
                  setCarErrors(prev => ({ ...prev, price_per_day: '' }));
                }
              }}
              placeholder="5000"
              min={1}
              max={1000000}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${
                carErrors.price_per_day ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {carErrors.price_per_day && <p className="text-red-400 text-xs mt-1">{carErrors.price_per_day}</p>}
          </div>
        </div>

        {addCarMutation.isError && <p className="text-red-400 text-sm mt-3">Ошибка добавления машины</p>}
        
        <div className="flex gap-3 mt-4">
          <button 
            onClick={() => {
              setAddCarModal(false);
              setCarErrors({});
            }} 
            className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              const errors: Record<string, string> = {};
              const currentYear = new Date().getFullYear();
              
              // Марка
              if (!carForm.brand.trim()) {
                errors.brand = 'Введите марку';
              }
              
              // Модель
              if (!carForm.model.trim()) {
                errors.model = 'Введите модель';
              }
              
              // Год
              const year = Number(carForm.year);
              if (!carForm.year) {
                errors.year = 'Введите год выпуска';
              } else if (year < 1900 || year > currentYear + 1) {
                errors.year = `Год должен быть от 1900 до ${currentYear + 1}`;
              }
              
              // Гос. номер (белорусский формат)
              const plateRegex = /^[АВЕКМНОРСТХ]\d{3}[АВЕКМНОРСТХ]{2}[1-7]$/;
              if (!carForm.plate_number.trim()) {
                errors.plate_number = 'Введите гос. номер';
              } else if (!plateRegex.test(carForm.plate_number)) {
                errors.plate_number = 'Формат: А123ВС77 (без 0, I, O, Q)';
              }
              
              // VIN (17 символов, без I, O, Q)
              const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
              if (!carForm.vin.trim()) {
                errors.vin = 'Введите VIN-код';
              } else if (carForm.vin.length !== 17) {
                errors.vin = 'VIN должен быть ровно 17 символов';
              } else if (!vinRegex.test(carForm.vin)) {
                errors.vin = 'Недопустимые символы (I, O, Q запрещены)';
              }
              
              // Цена
              const price = Number(carForm.price_per_day);
              if (!carForm.price_per_day) {
                errors.price_per_day = 'Введите цену';
              } else if (price < 1 || price > 1000000) {
                errors.price_per_day = 'Цена должна быть от 1 до 1 000 000';
              }
              
              if (Object.keys(errors).length > 0) {
                setCarErrors(errors);
                return;
              }
              
              addCarMutation.mutate();
            }}
            disabled={addCarMutation.isPending}
            className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            {addCarMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Добавить
          </button>
        </div>
      </Modal>

      {/* Add IoT Modal */}
      <Modal isOpen={addIotModal} onClose={() => {
        setAddIotModal(false);
        setIotErrors({});
      }} title="Добавить IoT устройство">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">ID устройства</label>
            <input
              type="text"
              value={iotForm.device_identifier}
              onChange={e => {
                setIotForm(f => ({ ...f, device_identifier: e.target.value }));
                setIotErrors(prev => ({ ...prev, device_identifier: '' }));
              }}
              placeholder="AB1234CD-E123-12FG-J123"
              maxLength={15}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 ${
                iotErrors.device_identifier ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {iotErrors.device_identifier && <p className="text-red-400 text-xs mt-1">{iotErrors.device_identifier}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Номер SIM</label>
            <input
              type="text"
              value={iotForm.sim_number}
              onChange={e => {
                setIotForm(f => ({ ...f, sim_number: e.target.value }));
                setIotErrors(prev => ({ ...prev, sim_number: '' }));
              }}
              placeholder="+375 29 123 45 67"
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 ${
                iotErrors.sim_number ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {iotErrors.sim_number && <p className="text-red-400 text-xs mt-1">{iotErrors.sim_number}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Уровень заряда (%)</label>
            <input
              type="number"
              value={iotForm.battery_level}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
                  setIotForm(f => ({ ...f, battery_level: value }));
                  setIotErrors(prev => ({ ...prev, battery_level: '' }));
                }
              }}
              placeholder="100"
              max={100}
              min={0}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 ${
                iotErrors.battery_level ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {iotErrors.battery_level && <p className="text-red-400 text-xs mt-1">{iotErrors.battery_level}</p>}
          </div>

          {addIotMutation.isError && <p className="text-red-400 text-sm">Ошибка добавления устройства</p>}
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setAddIotModal(false);
                setIotErrors({});
              }} 
              className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5"
            >
              Отмена
            </button>
            <button 
              onClick={() => {
                const errors: Record<string, string> = {};
                
                if (!iotForm.device_identifier || iotForm.device_identifier.length !== 15) {
                    errors.device_identifier = 'ID устройства должен быть ровно 15 символов';
                }
                
                const phoneRegex = /^\+375\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
                if (!iotForm.sim_number || !phoneRegex.test(iotForm.sim_number)) {
                  errors.sim_number = 'Введите номер в формате +375 29 123 45 67';
                }
                
                if (!iotForm.battery_level) {
                  errors.battery_level = 'Укажите уровень заряда';
                }
                
                if (Object.keys(errors).length > 0) {
                  setIotErrors(errors);
                  return;
                }
                
                addIotMutation.mutate();
              }} 
              disabled={addIotMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              {addIotMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Добавить
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Car Modal */}
      <Modal isOpen={!!editCarModal} onClose={() => {
        setEditCarModal(null);
        setEditCarErrors({});
      }} title="Редактировать машину" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Марка</label>
            <input type="text" value={editCarForm.brand} onChange={e => { setEditCarForm(f => ({ ...f, brand: e.target.value })); setEditCarErrors(prev => ({ ...prev, brand: '' })); }}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${editCarErrors.brand ? 'border-red-500' : 'border-white/20'}`} />
            {editCarErrors.brand && <p className="text-red-400 text-xs mt-1">{editCarErrors.brand}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Модель</label>
            <input type="text" value={editCarForm.model} onChange={e => { setEditCarForm(f => ({ ...f, model: e.target.value })); setEditCarErrors(prev => ({ ...prev, model: '' })); }}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${editCarErrors.model ? 'border-red-500' : 'border-white/20'}`} />
            {editCarErrors.model && <p className="text-red-400 text-xs mt-1">{editCarErrors.model}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Год</label>
            <input type="text" value={editCarForm.year} onChange={e => { const v = e.target.value; if (v === '' || /^\d{0,4}$/.test(v)) { setEditCarForm(f => ({ ...f, year: v })); setEditCarErrors(prev => ({ ...prev, year: '' })); } }}
              maxLength={4}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${editCarErrors.year ? 'border-red-500' : 'border-white/20'}`} />
            {editCarErrors.year && <p className="text-red-400 text-xs mt-1">{editCarErrors.year}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Гос. номер</label>
            <input type="text" value={editCarForm.plate_number} onChange={e => { setEditCarForm(f => ({ ...f, plate_number: e.target.value.toUpperCase() })); setEditCarErrors(prev => ({ ...prev, plate_number: '' })); }}
              maxLength={8}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm uppercase ${editCarErrors.plate_number ? 'border-red-500' : 'border-white/20'}`} />
            {editCarErrors.plate_number && <p className="text-red-400 text-xs mt-1">{editCarErrors.plate_number}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">VIN</label>
            <input type="text" value={editCarForm.vin} onChange={e => { setEditCarForm(f => ({ ...f, vin: e.target.value.toUpperCase() })); setEditCarErrors(prev => ({ ...prev, vin: '' })); }}
              maxLength={17}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm uppercase ${editCarErrors.vin ? 'border-red-500' : 'border-white/20'}`} />
            {editCarErrors.vin && <p className="text-red-400 text-xs mt-1">{editCarErrors.vin}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Цена/день (BYN)</label>
            <input type="number" value={editCarForm.price_per_day} onChange={e => { const v = e.target.value; if (v === '' || (Number(v) >= 1 && Number(v) <= 1000000)) { setEditCarForm(f => ({ ...f, price_per_day: v })); setEditCarErrors(prev => ({ ...prev, price_per_day: '' })); } }}
              min={1} max={1000000}
              className={`w-full px-3 py-2.5 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm ${editCarErrors.price_per_day ? 'border-red-500' : 'border-white/20'}`} />
            {editCarErrors.price_per_day && <p className="text-red-400 text-xs mt-1">{editCarErrors.price_per_day}</p>}
          </div>
        </div>

        {updateCarMutation.isError && <p className="text-red-400 text-sm mt-3">Ошибка обновления машины</p>}
        
        <div className="flex gap-3 mt-4">
          <button onClick={() => { setEditCarModal(null); setEditCarErrors({}); }}
            className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
          <button
            onClick={() => {
              const errors: Record<string, string> = {};
              const currentYear = new Date().getFullYear();
              
              if (!editCarForm.brand.trim()) errors.brand = 'Введите марку';
              if (!editCarForm.model.trim()) errors.model = 'Введите модель';
              
              const year = Number(editCarForm.year);
              if (!editCarForm.year) errors.year = 'Введите год выпуска';
              else if (year < 1900 || year > currentYear + 1) errors.year = `Год должен быть от 1900 до ${currentYear + 1}`;
              
              const plateRegex = /^[АВЕКМНОРСТХ]\d{3}[АВЕКМНОРСТХ]{2}[1-7]$/;
              if (!editCarForm.plate_number.trim()) errors.plate_number = 'Введите гос. номер';
              else if (!plateRegex.test(editCarForm.plate_number)) errors.plate_number = 'Формат: А123ВС77 (без 0, I, O, Q)';
              
              const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
              if (!editCarForm.vin.trim()) errors.vin = 'Введите VIN-код';
              else if (editCarForm.vin.length !== 17) errors.vin = 'VIN должен быть ровно 17 символов';
              else if (!vinRegex.test(editCarForm.vin)) errors.vin = 'Недопустимые символы (I, O, Q запрещены)';
              
              const price = Number(editCarForm.price_per_day);
              if (!editCarForm.price_per_day) errors.price_per_day = 'Введите цену';
              else if (price < 1 || price > 1000000) errors.price_per_day = 'Цена должна быть от 1 до 1 000 000';
              
              if (Object.keys(errors).length > 0) { setEditCarErrors(errors); return; }
              
              updateCarMutation.mutate();
            }}
            disabled={updateCarMutation.isPending}
            className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            {updateCarMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </Modal>

      {/* Edit IoT Modal */}
      <Modal isOpen={!!editIotModal} onClose={() => {
        setEditIotModal(null);
        setEditIotErrors({});
      }} title="Редактировать IoT устройство">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">ID устройства</label>
            <input type="text" value={editIotForm.device_identifier} onChange={e => { setEditIotForm(f => ({ ...f, device_identifier: e.target.value })); setEditIotErrors(prev => ({ ...prev, device_identifier: '' })); }}
              maxLength={15}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 ${editIotErrors.device_identifier ? 'border-red-500' : 'border-white/20'}`} />
            {editIotErrors.device_identifier && <p className="text-red-400 text-xs mt-1">{editIotErrors.device_identifier}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Номер SIM</label>
            <input type="text" value={editIotForm.sim_number} onChange={e => { setEditIotForm(f => ({ ...f, sim_number: e.target.value })); setEditIotErrors(prev => ({ ...prev, sim_number: '' })); }}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 ${editIotErrors.sim_number ? 'border-red-500' : 'border-white/20'}`} />
            {editIotErrors.sim_number && <p className="text-red-400 text-xs mt-1">{editIotErrors.sim_number}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Уровень заряда (%)</label>
            <input type="number" value={editIotForm.battery_level} onChange={e => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) { setEditIotForm(f => ({ ...f, battery_level: v })); setEditIotErrors(prev => ({ ...prev, battery_level: '' })); } }}
              max={100} min={0}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 ${editIotErrors.battery_level ? 'border-red-500' : 'border-white/20'}`} />
            {editIotErrors.battery_level && <p className="text-red-400 text-xs mt-1">{editIotErrors.battery_level}</p>}
          </div>

          {updateIotMutation.isError && <p className="text-red-400 text-sm">Ошибка обновления устройства</p>}
          
          <div className="flex gap-3">
            <button onClick={() => { setEditIotModal(null); setEditIotErrors({}); }}
              className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button
              onClick={() => {
                const errors: Record<string, string> = {};
                
                if (!editIotForm.device_identifier || editIotForm.device_identifier.length !== 15) {
                  errors.device_identifier = 'ID устройства должен быть ровно 15 символов';
                }
                
                const phoneRegex = /^\+375\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
                if (!editIotForm.sim_number || !phoneRegex.test(editIotForm.sim_number)) {
                  errors.sim_number = 'Введите номер в формате +375 29 123 45 67';
                }
                
                if (!editIotForm.battery_level) {
                  errors.battery_level = 'Укажите уровень заряда';
                }
                
                if (Object.keys(errors).length > 0) { setEditIotErrors(errors); return; }
                
                updateIotMutation.mutate();
              }}
              disabled={updateIotMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              {updateIotMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      {/* Map Modal for IoT device */}
      <Modal isOpen={!!mapModalIot} onClose={() => setMapModalIot(null)} title="Положение авто" size="xl">
        {mapModalIot && (() => {
          const iot = iots?.find(i => i.id === mapModalIot);
          const lat = iot?.last_lat != null ? Number(iot.last_lat) : null;
          const lng = iot?.last_lng != null ? Number(iot.last_lng) : null;
          if (lat === null || lng === null) return <div className="text-center py-8 text-gray-500"><MapPin size={32} className="mx-auto mb-2 opacity-40" /><p>Нет данных телеметрии</p></div>;
          return (
            <>
              <div className="rounded-xl overflow-hidden" style={{ height: 380 }}>
                <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      {iot?.car?.brand} {iot?.car?.model}{iot?.car?.plate_number ? ` (${iot.car.plate_number})` : ''}<br />
                      {iot?.device_identifier && <>{iot.device_identifier}<br /></>}
                      {iot?.last_seen_at ? new Date(iot.last_seen_at).toLocaleString('ru-RU') : ''}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-gray-400">
                <span>Координаты: <span className="text-white">{lat.toFixed(5)}, {lng.toFixed(5)}</span></span>
                <span>Обновлено: <span className="text-white">{iot?.last_seen_at ? new Date(iot.last_seen_at).toLocaleString('ru-RU') : '—'}</span></span>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Attach IoT Modal */}
      <Modal isOpen={!!attachIotModal} onClose={() => setAttachIotModal(null)} title="Привязать IoT устройство">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Выберите свободное IoT устройство:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {freeIots?.map(iot => (
              <button key={iot.id} onClick={() => setAttachIotId(iot.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${attachIotId === iot.id ? 'border-[#6C63FF] bg-[#6C63FF]/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <p className="text-white text-sm font-mono">{iot.device_identifier || 'Без ID'}</p>
                <p className="text-gray-500 text-xs">SIM: {iot.sim_number || '—'}</p>
              </button>
            ))}
            {!freeIots?.length && <p className="text-gray-500 text-sm text-center py-4">Нет свободных устройств</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAttachIotModal(null)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button
              onClick={() => attachIotMutation.mutate({ carId: attachIotModal!.carId, iotId: attachIotId })}
              disabled={!attachIotId || attachIotMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              {attachIotMutation.isPending && <Loader2 size={14} className="animate-spin" />}Привязать
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LessorCars;
