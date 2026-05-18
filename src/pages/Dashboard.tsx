import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Truck, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { companyService } from '../services/companyService';
import { profileService } from '../services/profileService';
import { driverService } from '../services/driverService';
import { useAuthStore } from '../store/authStore';
import { Card, StatCard } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import type { CompanyType } from '../types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { setActiveCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', inn: '', type: 'lessor' as CompanyType });

  const { data: profile } = useQuery({ 
    queryKey: ['profile'], 
    queryFn: profileService.getProfile 
  });
  
  useQuery({ 
    queryKey: ['my-dashboard'], 
    queryFn: profileService.getDashboard 
  });
  
  const { data: mainDashboard } = useQuery({ 
    queryKey: ['main-dashboard'], 
    queryFn: companyService.getMainDashboard 
  });
  
  const { data: lessorCompanies } = useQuery({ 
    queryKey: ['lessor-companies'], 
    queryFn: companyService.getMyLessorCompanies 
  });
  
  const { data: renterCompanies } = useQuery({ 
    queryKey: ['renter-companies'], 
    queryFn: companyService.getMyRenterCompanies 
  });

  const { data: driverCompany } = useQuery({
    queryKey: ['driver-company'],
    queryFn: driverService.getMyCompany,
    retry: false,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => companyService.createCompany(createForm.type, { 
      name: createForm.name, 
      inn: createForm.inn 
    }),
    onSuccess: () => {
      setShowCreateModal(false);
      setCreateForm({ name: '', inn: '', type: 'lessor' });
      queryClient.invalidateQueries({ queryKey: ['lessor-companies'] });
      queryClient.invalidateQueries({ queryKey: ['renter-companies'] });
      queryClient.invalidateQueries({ queryKey: ['my-dashboard'] });
    },
  });

  if (driverCompany) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Добро пожаловать, {profile?.full_name || profile?.email}!
          </h1>
          <p className="text-gray-400 mt-1">Вы работаете водителем в компании</p>
        </div>
        <Card
          hover
          onClick={() => navigate('/driver/rentals')}
          className="max-w-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Truck size={18} className="text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{driverCompany.name}</p>
                <p className="text-gray-500 text-sm">Ваша компания</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-600" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Добро пожаловать, {profile?.full_name || profile?.email}!
        </h1>
        <p className="text-gray-400 mt-1">Выберите компанию или создайте новую</p>
      </div>

      {/* Platform stats */}
      {mainDashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Компаний на платформе" value={mainDashboard.total_companies} icon={Building2} color="blue" />
          <StatCard label="Пользователей" value={mainDashboard.total_users} icon={Users} color="green" />
          <StatCard label="Арендодателей" value={mainDashboard.total_lessor_companies} icon={Truck} color="purple" />
          <StatCard label="Арендаторов" value={mainDashboard.total_renter_companies} icon={Building2} color="yellow" />
        </div>
      )}

      {/* My companies */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Lessor companies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Мои компании (Арендодатель)</h2>
            <span className="text-gray-500 text-sm">{lessorCompanies?.length || 0} шт.</span>
          </div>
          <div className="space-y-3">
            {lessorCompanies?.map(company => (
              <Card
                key={company.id}
                hover
                onClick={() => {
                  setActiveCompany(company);
                  navigate(`/lessor/${company.id}/dashboard`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-[#6C63FF]/20 rounded-lg flex items-center justify-center">
                        <Building2 size={14} className="text-[#6C63FF]" />
                      </div>
                      <p className="font-semibold text-white">{company.name}</p>
                    </div>
                    <p className="text-gray-500 text-sm ml-10">ИНН: {company.inn}</p>
                    <p className="text-gray-500 text-sm ml-10">Баланс: {Number(company.balance).toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                </div>
              </Card>
            ))}
            {!lessorCompanies?.length && (
              <div className="text-center py-8 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                Нет компаний-арендодателей
              </div>
            )}
          </div>
        </div>

        {/* Renter companies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Мои компании (Арендатор)</h2>
            <span className="text-gray-500 text-sm">{renterCompanies?.length || 0} шт.</span>
          </div>
          <div className="space-y-3">
            {renterCompanies?.map(company => (
              <Card
                key={company.id}
                hover
                onClick={() => {
                  setActiveCompany(company);
                  navigate(`/renter/${company.id}/dashboard`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Truck size={14} className="text-green-400" />
                      </div>
                      <p className="font-semibold text-white">{company.name}</p>
                    </div>
                    <p className="text-gray-500 text-sm ml-10">ИНН: {company.inn}</p>
                    <p className="text-gray-500 text-sm ml-10">Баланс: {Number(company.balance).toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                </div>
              </Card>
            ))}
            {!renterCompanies?.length && (
              <div className="text-center py-8 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                Нет компаний-арендаторов
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create company button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-3 px-6 py-4 bg-[#6C63FF]/10 border border-[#6C63FF]/30 hover:bg-[#6C63FF]/20 rounded-2xl text-[#6C63FF] font-medium transition-colors"
      >
        <Plus size={20} />
        Создать новую компанию
      </button>

      {/* Create Company Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Создать компанию">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Тип компании</label>
            <div className="grid grid-cols-2 gap-3">
              {(['lessor', 'renter'] as CompanyType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setCreateForm(f => ({ ...f, type }))}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    createForm.type === type
                      ? 'border-[#6C63FF] bg-[#6C63FF]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`text-2xl mb-1`}>{type === 'lessor' ? '🏢' : '🚛'}</div>
                  <p className="text-white text-sm font-medium">{type === 'lessor' ? 'Арендодатель' : 'Арендатор'}</p>
                  <p className="text-gray-500 text-xs">{type === 'lessor' ? 'Сдаёте авто' : 'Арендуете авто'}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Название компании</label>
            <input
              type="text"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ООО «Моя компания»"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">ИНН</label>
            <input
              type="text"
              value={createForm.inn}
              onChange={e => setCreateForm(f => ({ ...f, inn: e.target.value }))}
              placeholder="1234567890"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60"
            />
          </div>

          {createMutation.isError && (
            <p className="text-red-400 text-sm">Ошибка создания компании. Возможно, название или ИНН уже заняты.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!createForm.name || !createForm.inn || createMutation.isPending}
              className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
