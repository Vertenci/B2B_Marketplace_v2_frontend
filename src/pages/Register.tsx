import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useRegister } from '../hooks/useAuth';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', phone: '', full_name: '' });
  const [showPass, setShowPass] = useState(false);
  const registerMutation = useRegister();

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(form);
  };

  if (registerMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Аккаунт создан!</h2>
          <p className="text-gray-400 mb-6">Теперь вы можете войти в систему</p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl font-semibold text-white transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-4">
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#6C63FF] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#FF6584] rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#6C63FF] rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">FleetMarket</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Регистрация</h1>
          <p className="text-gray-400 mt-2">Создайте аккаунт для работы с платформой</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Полное имя</label>
              <input
                type="text" value={form.full_name} onChange={setField('full_name')}
                placeholder="Иван Иванов" required minLength={2}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                type="email" value={form.email} onChange={setField('email')}
                placeholder="you@company.com" required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Телефон</label>
              <input
                type="tel" value={form.phone} onChange={setField('phone')}
                placeholder="+7 900 000 00 00" required minLength={7}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={setField('password')}
                  placeholder="Минимум 8 символов" required minLength={8}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {registerMutation.isError && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                Ошибка регистрации. Возможно, email или телефон уже используются.
              </div>
            )}

            <button type="submit" disabled={registerMutation.isPending}
              className="w-full py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-50 rounded-xl font-semibold text-white transition-colors">
              {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-[#6C63FF] hover:text-[#8078ff] font-medium">Войти</Link>
          </p>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          <Link to="/" className="hover:text-gray-400 transition-colors">← На главную</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
