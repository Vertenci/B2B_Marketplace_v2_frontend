import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { renterService } from '../../services/renterService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const RenterDrivers = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [email, setEmail] = useState('');

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['renter-drivers', companyId],
    queryFn: () => renterService.getDrivers(companyId!),
    enabled: !!companyId,
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: () => renterService.addDriver(companyId!, email),
    onSuccess: () => {
      setAddModal(false);
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['renter-drivers', companyId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (driverId: string) => renterService.removeDriver(companyId!, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-drivers', companyId] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (driverId: string) => renterService.toggleDriver(companyId!, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-drivers', companyId] }),
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
              <div className="flex items-center gap-3">
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
              </div>
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

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Добавить водителя" size="sm">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Пользователь должен быть зарегистрирован на платформе.</p>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email водителя</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="driver@example.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60" />
          </div>
          {addMutation.isError && <p className="text-red-400 text-sm">Пользователь не найден или уже является водителем</p>}
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
