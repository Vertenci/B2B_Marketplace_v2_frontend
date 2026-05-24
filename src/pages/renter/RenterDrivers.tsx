import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Car, Calendar, MapPin } from 'lucide-react';
import { renterService } from '../../services/renterService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { DriverCompanyUser, Rental } from '../../types';

const statusConfig: Record<string, { label: string; variant: 'green' | 'gray' | 'red' }> = {
  ACTIVE: { label: 'Активна', variant: 'green' },
  COMPLETED: { label: 'Завершена', variant: 'gray' },
  OVERDUE: { label: 'Просрочена', variant: 'red' },
};

const RenterDrivers = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverCompanyUser | null>(null);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['renter-drivers', companyId],
    queryFn: () => renterService.getDrivers(companyId!),
    enabled: !!companyId,
    staleTime: 0,
  });

  const { data: driverRentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ['renter-driver-rentals', companyId, selectedDriver?.user_id],
    queryFn: () => renterService.getRentals(companyId!, undefined, 0, 50, selectedDriver!.user_id),
    enabled: !!companyId && !!selectedDriver,
  });

  const addMutation = useMutation({
    mutationFn: () => renterService.addDriver(companyId!, email),
    onSuccess: () => {
      setAddModal(false);
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['renter-drivers', companyId] });
    },
    onError: (err: any) => alert(err?.response?.data?.detail || 'Ошибка добавления водителя'),
  });

  const removeMutation = useMutation({
    mutationFn: (driverId: string) => renterService.removeDriver(companyId!, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-drivers', companyId] }),
    onError: (err: any) => alert(err?.response?.data?.detail || 'Ошибка удаления водителя'),
  });

  const toggleMutation = useMutation({
    mutationFn: (driverId: string) => renterService.toggleDriver(companyId!, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-drivers', companyId] }),
    onError: (err: any) => alert(err?.response?.data?.detail || 'Ошибка изменения статуса'),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Водители</h1>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl text-white text-sm transition-colors">
          <Plus size={16} />Добавить водителя
        </button>
      </div>

      {isLoading && <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

      <div className="space-y-3">
        {drivers?.map(driver => (
          <Card key={driver.id}>
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedDriver(driver)} className="flex items-center gap-3 flex-1 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${driver.is_active ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                  <span className="text-lg">{driver.is_active ? '🟢' : '⚫'}</span>
                </div>
                <div>
                  {driver.user ? (
                    <>
                      <p className="text-white font-medium">{driver.user.full_name}</p>
                      <p className="text-gray-500 text-sm">{driver.user.email} · {driver.user.phone}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">ID: {driver.user_id.slice(0, 8)}...</p>
                  )}
                  <p className="text-gray-600 text-xs">С {new Date(driver.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant={driver.is_active ? 'green' : 'gray'}>{driver.is_active ? 'Активен' : 'Неактивен'}</Badge>
                <button onClick={() => toggleMutation.mutate(driver.id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                  {driver.is_active ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => { if (confirm('Удалить водителя?')) removeMutation.mutate(driver.id); }}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!drivers?.length && !isLoading && (
          <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>Водителей нет. Добавьте первого!</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedDriver} onClose={() => setSelectedDriver(null)} title="Аренды водителя" size="lg">
        {selectedDriver && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedDriver.is_active ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <span className="text-lg">{selectedDriver.is_active ? '🟢' : '⚫'}</span>
              </div>
              <div>
                <p className="text-white font-medium">{selectedDriver.user?.full_name || 'Без имени'}</p>
                <p className="text-gray-500 text-sm">{selectedDriver.user?.email}</p>
              </div>
            </div>

            {rentalsLoading && <div className="text-center py-4"><Loader2 size={20} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

            {driverRentals?.length === 0 && !rentalsLoading && (
              <p className="text-gray-500 text-center py-4">У водителя нет аренд</p>
            )}

            {driverRentals?.map((rental: Rental) => {
              const cfg = statusConfig[rental.status] || { label: rental.status, variant: 'gray' as const };
              return (
                <div key={rental.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Car size={16} className="text-gray-400" />
                      <span className="text-white font-medium">
                        {rental.car ? `${rental.car.brand} ${rental.car.model} (${rental.car.plate_number})` : '—'}
                      </span>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(rental.start_date).toLocaleDateString('ru-RU')} — {new Date(rental.end_date).toLocaleDateString('ru-RU')}
                    </span>
                    <span>{rental.base_price_total.toLocaleString('ru-RU')} ₽</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {rental.lessor_company?.name || '—'}
                    </span>
                  </div>
                  {rental.status === 'ACTIVE' && rental.actual_return_date && (
                    <p className="text-xs text-gray-500 mt-2">Фактический возврат: {new Date(rental.actual_return_date).toLocaleDateString('ru-RU')}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Добавить водителя" size="sm">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Пользователь должен быть зарегистрирован на платформе.</p>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email водителя</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="driver@example.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAddModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button onClick={() => addMutation.mutate()} disabled={!email || addMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
              {addMutation.isPending && <Loader2 size={14} className="animate-spin" />}Добавить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RenterDrivers;
