import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Car, Cpu, Trash2, Loader2, Wifi, WifiOff } from 'lucide-react';
import { lessorService } from '../../services/lessorService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { CarStatus } from '../../types';

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

  const { data: cars, isLoading: carsLoading } = useQuery({
    queryKey: ['lessor-cars', companyId],
    queryFn: () => lessorService.getCars(companyId!, 0, 50),
    enabled: !!companyId,
  });

  const { data: iots } = useQuery({
    queryKey: ['lessor-iots', companyId],
    queryFn: () => lessorService.getIots(companyId!, 0, 50),
    enabled: !!companyId,
  });

  const addCarMutation = useMutation({
    mutationFn: () => lessorService.addCar(companyId!, {
      ...carForm, price_per_day: Number(carForm.price_per_day), status: 'HIDDEN'
    }),
    onSuccess: () => {
      setAddCarModal(false);
      setCarForm({ brand: '', model: '', year: '', plate_number: '', vin: '', price_per_day: '' });
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

  const deleteCarMutation = useMutation({
    mutationFn: (carId: string) => lessorService.deleteCar(companyId!, carId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessor-cars', companyId] }),
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
                      &nbsp;·&nbsp;<span className="text-green-400">{Number(car.price_per_day).toLocaleString('ru-RU')} ₽/день</span>
                    </p>
                    {car.iot_device && (
                      <div className="flex items-center gap-2 mt-1">
                        {car.iot_device.is_online
                          ? <Wifi size={12} className="text-green-400" />
                          : <WifiOff size={12} className="text-gray-500" />
                        }
                        <span className="text-xs text-gray-500">
                          {car.iot_device.device_identifier || 'IoT'}&nbsp;
                          {car.iot_device.battery_level != null && (
                            <span className={car.iot_device.battery_level > 30 ? 'text-green-400' : 'text-red-400'}>
                              {car.iot_device.battery_level}%
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status selector */}
                  <select
                    value={car.status}
                    onChange={e => updateStatusMutation.mutate({ carId: car.id, status: e.target.value })}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="AVAILABLE">Доступна</option>
                    <option value="INACTIVE">Неактивна</option>
                    <option value="HIDDEN">Скрыта</option>
                  </select>
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
                    onClick={() => { if (confirm('Удалить машину?')) deleteCarMutation.mutate(car.id); }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
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
                <button
                  onClick={() => { if (confirm('Удалить IoT устройство?')) deleteIotMutation.mutate(iot.id); }}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
          {!iots?.length && <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl"><Cpu size={40} className="mx-auto mb-3 opacity-30" /><p>IoT устройств нет</p></div>}
        </div>
      )}

      {/* Add Car Modal */}
      <Modal isOpen={addCarModal} onClose={() => setAddCarModal(false)} title="Добавить машину" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Марка', field: 'brand', placeholder: 'Toyota' },
            { label: 'Модель', field: 'model', placeholder: 'Camry' },
            { label: 'Год', field: 'year', placeholder: '2023' },
            { label: 'Гос. номер', field: 'plate_number', placeholder: 'А123ВС77' },
            { label: 'VIN', field: 'vin', placeholder: 'JT...' },
            { label: 'Цена/день (₽)', field: 'price_per_day', placeholder: '5000' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-sm text-gray-300 mb-1">{label}</label>
              <input
                type={field === 'price_per_day' ? 'number' : 'text'}
                value={carForm[field as keyof typeof carForm]}
                onChange={e => setCarForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm"
              />
            </div>
          ))}
        </div>
        {addCarMutation.isError && <p className="text-red-400 text-sm mt-3">Ошибка добавления машины</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={() => setAddCarModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
          <button
            onClick={() => addCarMutation.mutate()}
            disabled={addCarMutation.isPending}
            className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            {addCarMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Добавить
          </button>
        </div>
      </Modal>

      {/* Add IoT Modal */}
      <Modal isOpen={addIotModal} onClose={() => setAddIotModal(false)} title="Добавить IoT устройство">
        <div className="space-y-4">
          {[
            { label: 'ID устройства', field: 'device_identifier', placeholder: 'DEVICE-001' },
            { label: 'Номер SIM', field: 'sim_number', placeholder: '+7 900 000 00 00' },
            { label: 'Уровень заряда (%)', field: 'battery_level', placeholder: '100' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-sm text-gray-300 mb-1">{label}</label>
              <input
                type={field === 'battery_level' ? 'number' : 'text'}
                value={iotForm[field as keyof typeof iotForm]}
                onChange={e => setIotForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60"
              />
            </div>
          ))}
          {addIotMutation.isError && <p className="text-red-400 text-sm">Ошибка добавления устройства</p>}
          <div className="flex gap-3">
            <button onClick={() => setAddIotModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button onClick={() => addIotMutation.mutate()} disabled={addIotMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
              {addIotMutation.isPending && <Loader2 size={14} className="animate-spin" />}Добавить
            </button>
          </div>
        </div>
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
