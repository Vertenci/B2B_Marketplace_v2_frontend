import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Shield, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { documentService } from '../services/documentService';
import { profileService } from '../services/profileService';
import { useAuthStore } from '../store/authStore';

const PublicOffer = () => {
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const acceptMutation = useMutation({
    mutationFn: documentService.acceptPublicOffer,
    onSuccess: async () => {
      try {
        const user = await profileService.getProfile();
        setUser(user);
      } catch {}
      navigate('/dashboard');
    },
  });

  const downloadUrl = documentService.getPublicOfferDownloadUrl();

  return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-4">
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#6C63FF] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#FF6584] rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#6C63FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-[#6C63FF]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Публичная оферта</h1>
          <p className="text-gray-400">
            Для использования платформы необходимо принять условия оферты
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* Offer preview */}
          <div className="bg-white/5 rounded-xl p-6 mb-6 max-h-64 overflow-y-auto">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#6C63FF]" />
              Условия использования платформы FleetMarket
            </h3>
            <div className="text-gray-400 text-sm space-y-3">
              <p>
                Настоящая публичная оферта является тестовым предложением ООО «FleetMarket» 
                (далее — Платформа) заключить договор на использование платформы для аренды 
                транспортных средств между юридическими лицами в рамках демонстрационного режима.
              </p>
              <p>
                <strong className="text-gray-300">1. Предмет договора.</strong> Платформа предоставляет пользователям тестовый доступ к сервисам поиска, 
                  аренды и мониторинга транспортных средств. Все операции выполняются с 
                  виртуальными средствами и не влекут реальных юридических последствий.
              </p>
              <p>
                <strong className="text-gray-300">2. Права и обязанности.</strong> Пользователь обязуется использовать платформу исключительно в целях 
                  тестирования функционала. Запрещается использовать реальные персональные 
                  данные и платёжные инструменты.
              </p>
              <p>
                <strong className="text-gray-300">3. Конфиденциальность.</strong> Все данные, вводимые в тестовой среде, не сохраняются в промышленных базах 
                  и удаляются при сбросе тестового окружения. Не рекомендуется использовать 
                  реальные конфиденциальные данные.
              </p>
              <p>
                <strong className="text-gray-300">4. Ответственность.</strong> Платформа не несёт ответственности за любые убытки, понесённые в результате 
                  использования тестовой версии. Сервис предоставляется «как есть» (AS IS).
              </p>
              <p>
                <strong className="text-gray-300">5. Изменение условий.</strong> Условия тестовой оферты могут изменяться без предварительного уведомления 
                  для целей отладки и улучшения платформы.
              </p>
            </div>
          </div>

          {/* Download link */}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl text-[#6C63FF] hover:bg-[#6C63FF]/20 transition-colors mb-6 text-sm"
          >
            <FileText size={16} />
            Скачать полный текст оферты (PDF)
          </a>

          {/* contacts */}
          <div className="flex items-start gap-3 p-4 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl">
            <Shield className="text-[#6C63FF] flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-white font-medium mb-1">Техническая поддержка</p>
              <p className="text-gray-400 text-sm">
                По вопросам тестирования обращайтесь: vladoc536481@gmail.com
              </p>
            </div>
          </div>
          <br></br>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <div
              onClick={() => setChecked(!checked)}
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
                checked ? 'bg-[#6C63FF] border-[#6C63FF]' : 'border-white/30 bg-transparent'
              }`}
            >
              {checked && <CheckCircle size={12} className="text-white" />}
            </div>
            <span className="text-gray-300 text-sm leading-relaxed">
              Я прочитал(а) и согласен(а) с условиями публичной оферты и политикой конфиденциальности платформы FleetMarket
            </span>
          </label>

          {acceptMutation.isError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
              <AlertCircle size={16} />
              Ошибка при принятии оферты. Попробуйте ещё раз.
            </div>
          )}

          <button
            onClick={() => acceptMutation.mutate()}
            disabled={!checked || acceptMutation.isPending}
            className="w-full py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors"
          >
            {acceptMutation.isPending ? 'Сохранение...' : 'Принять и продолжить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicOffer;
