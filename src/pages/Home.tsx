import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Truck, Shield, Zap, MapPin } from 'lucide-react';
import { companyService } from '../services/companyService';

const Home = () => {
  const { data: dashboard } = useQuery({
    queryKey: ['main-dashboard'],
    queryFn: companyService.getMainDashboard,
  });

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f1923]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center">
              <Truck size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl">FleetMarket</span>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium bg-[#6C63FF] hover:bg-[#5a52d6] rounded-lg transition-colors"
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6C63FF] rounded-full blur-3xl opacity-10" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FF6584] rounded-full blur-3xl opacity-10" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-full text-sm text-[#6C63FF] mb-8">
            <Zap size={14} />
            B2B платформа аренды транспорта
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Умная аренда<br />
            <span className="text-[#6C63FF]">автомобилей</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Цифровая экосистема для арендодателей и арендаторов с IoT-мониторингом,
            геозонами и автоматизацией документооборота
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Начать бесплатно
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-white/20 hover:border-white/40 rounded-xl font-semibold text-lg transition-all hover:bg-white/5"
            >
              Войти
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {dashboard && (
        <section className="py-16 px-6 border-y border-white/10">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-gray-400 text-sm uppercase tracking-wider mb-10">
              Статистика платформы
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Компаний', value: dashboard.total_companies, icon: Building2, color: 'text-[#6C63FF]' },
                { label: 'Пользователей', value: dashboard.total_users, icon: Users, color: 'text-green-400' },
                { label: 'Арендодателей', value: dashboard.total_lessor_companies, icon: Truck, color: 'text-blue-400' },
                { label: 'Арендаторов', value: dashboard.total_renter_companies, icon: Building2, color: 'text-yellow-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <Icon size={28} className={`${color} mx-auto mb-3`} />
                  <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Всё что нужно для аренды</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Полный цикл от заявки до оплаты с автоматическим контролем
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Truck,
                color: 'bg-[#6C63FF]/20 text-[#6C63FF]',
                title: 'Управление автопарком',
                desc: 'Добавляйте машины, привязывайте IoT-устройства, управляйте статусами и ценами',
              },
              {
                icon: MapPin,
                color: 'bg-green-500/20 text-green-400',
                title: 'Геозоны и мониторинг',
                desc: 'Задавайте геозоны для каждого автомобиля. Получайте уведомления о нарушениях',
              },
              {
                icon: Shield,
                color: 'bg-blue-500/20 text-blue-400',
                title: 'Безопасные сделки',
                desc: 'Автоматические контракты, акты и счета-фактуры в PDF при каждой аренде',
              },
              {
                icon: Zap,
                color: 'bg-yellow-500/20 text-yellow-400',
                title: 'IoT в реальном времени',
                desc: 'Телеметрия каждые 3 секунды — координаты, скорость, заряд батареи устройства',
              },
              {
                icon: Users,
                color: 'bg-purple-500/20 text-purple-400',
                title: 'Управление командой',
                desc: 'Добавляйте водителей в компанию, контролируйте активность и историю аренд',
              },
              {
                icon: Building2,
                color: 'bg-red-500/20 text-red-400',
                title: 'Несколько компаний',
                desc: 'Создавайте несколько компаний-арендодателей или арендаторов под одним аккаунтом',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-colors">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-gray-400 mb-8">Регистрация занимает менее минуты</p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            Зарегистрироваться
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-white/10 text-center text-gray-600 text-sm">
        © 2026 FleetMarket — B2B платформа аренды транспорта
      </footer>
    </div>
  );
};

export default Home;
