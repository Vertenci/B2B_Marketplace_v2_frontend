import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Calendar, Edit3, Trash2, Loader2 } from 'lucide-react';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useLogout } from '../hooks/useAuth';

const Profile = () => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [form, setForm] = useState({ phone: '', full_name: '' });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['my-dashboard'],
    queryFn: profileService.getDashboard,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { phone?: string; full_name?: string }) => profileService.updateProfile(data),
    onSuccess: (updated) => {
      setUser(updated);
      setEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: profileService.deleteProfile,
    onSuccess: () => {
      logoutMutation.mutate();
    },
  });

  const openEdit = () => {
    if (profile) {
      setForm({ phone: profile.phone, full_name: profile.full_name });
    }
    setEditModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-[#6C63FF] animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Мой профиль</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Profile card */}
        <div className="md:col-span-2">
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#6C63FF]/20 rounded-2xl flex items-center justify-center">
                  <User size={28} className="text-[#6C63FF]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="purple">Пользователь</Badge>
                    {profile.public_offer_accepted && <Badge variant="green">Оферта принята</Badge>}
                    {profile.is_active && <Badge variant="green">Активен</Badge>}
                  </div>
                </div>
              </div>
              <button
                onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm transition-colors"
              >
                <Edit3 size={14} />
                Редактировать
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Mail size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-white text-sm">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Phone size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Телефон</p>
                  <p className="text-white text-sm">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Calendar size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Дата регистрации</p>
                  <p className="text-white text-sm">{new Date(profile.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Dashboard */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Мои компании</h3>
            {dashboard ? (
              <>
                <div className="text-4xl font-bold text-white mb-4">{dashboard.total_companies}</div>
                <div className="space-y-2">
                  {dashboard.companies_by_type.map(({ type, count }) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm capitalize">{type === 'lessor' ? 'Арендодатель' : 'Арендатор'}</span>
                      <Badge variant={type === 'lessor' ? 'purple' : 'green'}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Нет компаний</p>
            )}
          </Card>
        </div>
      </div>

      {/* Danger zone */}
      {(dashboard?.total_companies ?? 0) === 0 && (
        <Card className="border-red-500/20">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <Trash2 size={16} />
            Удаление аккаунта
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Это действие необратимо. Аккаунт будет удалён только если у вас нет компаний.
          </p>
          <button
            onClick={() => setDeleteModal(true)}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-sm transition-colors"
          >
            Удалить аккаунт
          </button>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Редактировать профиль">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Полное имя</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Телефон</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60"
            />
          </div>
          {updateMutation.isError && <p className="text-red-400 text-sm">Ошибка обновления профиля</p>}
          <div className="flex gap-3">
            <button onClick={() => setEditModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button
              onClick={() => updateMutation.mutate({ phone: form.phone || undefined, full_name: form.full_name || undefined })}
              disabled={updateMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Удаление аккаунта" size="sm">
        <div className="text-center">
          <Trash2 size={40} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-6">Вы уверены что хотите удалить аккаунт? Это действие необратимо.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">Отмена</button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 rounded-xl text-white font-semibold"
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
