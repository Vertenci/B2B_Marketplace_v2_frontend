import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Loader2, User } from 'lucide-react';
import { lessorService } from '../../services/lessorService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const LessorEmployers = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [email, setEmail] = useState('');

  const { data: employers, isLoading } = useQuery({
    queryKey: ['lessor-employers', companyId],
    queryFn: () => lessorService.getEmployers(companyId!),
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: () => lessorService.addEmployer(companyId!, email),
    onSuccess: () => {
      setAddModal(false);
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['lessor-employers', companyId] });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Сотрудники</h1>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl text-white text-sm transition-colors">
          <Plus size={16} />Добавить владельца
        </button>
      </div>

      {isLoading && <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

      <div className="space-y-3">
        {employers?.map(emp => (
          <Card key={emp.id}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#6C63FF]/20 rounded-xl flex items-center justify-center">
                <User size={18} className="text-[#6C63FF]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">ID: {emp.user_id.slice(0, 8)}...</p>
                  <Badge variant={emp.position === 'owner' ? 'purple' : 'blue'}>
                    {emp.position === 'owner' ? 'Владелец' : 'Водитель'}
                  </Badge>
                  {emp.is_active ? <Badge variant="green">Активен</Badge> : <Badge variant="gray">Неактивен</Badge>}
                </div>
                <p className="text-gray-500 text-xs">С {new Date(emp.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
          </Card>
        ))}
        {!employers?.length && !isLoading && (
          <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>Сотрудников нет</p>
          </div>
        )}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Добавить владельца" size="sm">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Введите email пользователя, которого хотите добавить совладельцем компании.</p>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email пользователя</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60" />
          </div>
          {addMutation.isError && <p className="text-red-400 text-sm">Пользователь не найден или уже является сотрудником</p>}
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

export default LessorEmployers;
