import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  DollarSign,
  Loader2,
  ArrowDownLeft,
  Clock,
  Plus,
  ArrowUpRight,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
} from 'lucide-react';

import { lessorService } from '../../services/lessorService';

import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/common/Button';

const PAGE_SIZE = 10;
const MAX_VISIBLE_PAGES = 5;

const AnimatedBalance = ({ value }: { value: number }) => {
  const [displayedValue, setDisplayedValue] = useState(0);
  const previousValue = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = startValue + (endValue - startValue) * easeOutExpo;
      setDisplayedValue(Math.round(currentValue * 100) / 100);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    previousValue.current = endValue;

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <span className="tabular-nums">
      {displayedValue.toLocaleString('ru-RU')}
    </span>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= MAX_VISIBLE_PAGES + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
      let end = Math.min(totalPages - 1, start + MAX_VISIBLE_PAGES - 1);
      
      if (end - start < MAX_VISIBLE_PAGES - 1) {
        start = Math.max(2, end - MAX_VISIBLE_PAGES + 1);
      }
      
      if (start > 2) {
        pages.push('ellipsis');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      {/* Кнопка "В начало" */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || isLoading}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="В начало"
      >
        <ChevronsLeft size={16} />
      </button>
      
      {/* Предыдущая страница */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Номера страниц */}
      {getVisiblePages().map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-600">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className={`
              min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors
              ${page === currentPage
                ? 'bg-[#6C63FF] text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
              disabled:opacity-50
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Следующая страница */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const LessorFinances = () => {
  const queryClient = useQueryClient();
  const { companyId } = useParams<{ companyId: string }>();

  const [amount, setAmount] = useState('');
  const [modalType, setModalType] = useState<'topup' | 'withdraw' | null>(null);
  
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [eventsTotal, setEventsTotal] = useState(0);

  useEffect(() => {
    setPaymentsPage(1);
    setEventsPage(1);
  }, []);

  const {
    data: finances,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['lessor-finances', companyId, paymentsPage, eventsPage],
    queryFn: async () => {
      const skip = (paymentsPage - 1) * PAGE_SIZE;
      const eventsSkip = (eventsPage - 1) * PAGE_SIZE;
      
      const data = await lessorService.getFinances(
        companyId!,
        skip,
        PAGE_SIZE,
        eventsSkip,
      );      
      return data;
    },
    enabled: !!companyId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const balance = finances?.balance ?? 0;
  const payments = finances?.payments ?? [];
  const balanceEvents = finances?.balance_events ?? [];
  
  const paymentsTotalPages = Math.max(1, Math.ceil(paymentsTotal / PAGE_SIZE) || (payments.length === PAGE_SIZE ? paymentsPage + 1 : paymentsPage));
  const eventsTotalPages = Math.max(1, Math.ceil(eventsTotal / PAGE_SIZE) || (balanceEvents.length === PAGE_SIZE ? eventsPage + 1 : eventsPage));

  const closeModal = () => {
    setModalType(null);
    setAmount('');
  };

  const resetAndRefetch = async () => {
    setPaymentsPage(1);
    setEventsPage(1);
    await queryClient.invalidateQueries({ queryKey: ['lessor-finances'] });
  };

  const topUpMutation = useMutation({
    mutationFn: (value: number) =>
      lessorService.topUpBalance(companyId!, value),
    onSuccess: () => {
      resetAndRefetch();
      closeModal();
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (value: number) =>
      lessorService.withdrawBalance(companyId!, value),
    onSuccess: () => {
      resetAndRefetch();
      closeModal();
    },
  });

  const handleSubmit = () => {
    const value = Number(amount);
    if (!value || value <= 0) return;

    if (modalType === 'topup') {
      topUpMutation.mutate(value);
    } else if (modalType === 'withdraw') {
      withdrawMutation.mutate(value);
    }
  };

  const isSubmitting = topUpMutation.isPending || withdrawMutation.isPending;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-3xl font-bold text-white">Финансы</h1>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setModalType('topup')}
          >
            <Plus size={18} />
            Пополнить
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setModalType('withdraw')}
          >
            <ArrowUpRight size={18} />
            Вывести
          </Button>
        </div>
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl" />
          
          <div className="relative flex items-center gap-4 p-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/10">
              <Wallet size={30} className="text-green-400" />
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-1">Текущий баланс</p>
              <p className="text-5xl font-bold text-white tracking-tight">
                <AnimatedBalance value={Number(balance)} />
                <span className="text-2xl ml-2 text-gray-400">₽</span>
              </p>
            </div>

            <div className="absolute top-2 right-4 text-green-500/20">
              <Wallet size={120} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Платежи аренды */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Платежи аренды
            {paymentsTotal > 0 && (
              <span className="text-sm text-gray-400 ml-2">
                (стр. {paymentsPage})
              </span>
            )}
          </h2>

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 size={24} className="animate-spin mx-auto text-[#6C63FF]" />
            </div>
          )}

          {!isLoading && (
            <>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            payment.status === 'PAID'
                              ? 'bg-green-500/20'
                              : payment.status === 'PENDING'
                                ? 'bg-yellow-500/20'
                                : 'bg-red-500/20'
                          }`}
                        >
                          {payment.status === 'PAID' ? (
                            <ArrowDownLeft size={18} className="text-green-400" />
                          ) : (
                            <Clock size={18} className="text-yellow-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium text-sm truncate">
                              {payment.payer_company?.name || '—'} → {payment.receiver_company?.name || '—'}
                            </p>
                            <Badge
                              variant={
                                payment.status === 'PAID'
                                  ? 'green'
                                  : payment.status === 'PENDING'
                                    ? 'yellow'
                                    : 'red'
                              }
                            >
                              {payment.status === 'PAID'
                                ? 'Оплачен'
                                : payment.status === 'PENDING'
                                  ? 'Ожидает'
                                  : 'Ошибка'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {payment.payment_method === 'BALANCE' ? 'С баланса' : 'Картой'}
                            {payment.paid_at &&
                              ` · ${new Date(payment.paid_at).toLocaleDateString('ru-RU')}`}
                          </p>
                          {payment.commission_amount > 0 && (
                            <p className="text-xs text-gray-600">
                              Комиссия: {Number(payment.commission_amount).toLocaleString('ru-RU')} ₽
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-lg font-bold text-white whitespace-nowrap">
                        {Number(payment.amount).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </Card>
                ))}

                {payments.length === 0 && (
                  <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                    <DollarSign size={36} className="mx-auto mb-3 opacity-30" />
                    <p>История платежей пуста</p>
                  </div>
                )}
              </div>

              <Pagination
                currentPage={paymentsPage}
                totalPages={paymentsTotalPages}
                onPageChange={setPaymentsPage}
                isLoading={isFetching}
              />
            </>
          )}
        </div>

        {/* Пополнения и вывод */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Пополнения и вывод
            {eventsTotal > 0 && (
              <span className="text-sm text-gray-400 ml-2">
                (стр. {eventsPage})
              </span>
            )}
          </h2>

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 size={24} className="animate-spin mx-auto text-[#6C63FF]" />
            </div>
          )}

          {!isLoading && (
            <>
              <div className="space-y-3">
                {balanceEvents.map((event) => (
                  <Card key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            event.event_type === 'TOP_UP' ? 'bg-green-500/20' : 'bg-orange-500/20'
                          }`}
                        >
                          {event.event_type === 'TOP_UP' ? (
                            <Plus size={18} className="text-green-400" />
                          ) : (
                            <ArrowUpRight size={18} className="text-orange-400" />
                          )}
                        </div>

                        <div>
                          <p className="text-white font-medium text-sm">
                            {event.event_type === 'TOP_UP' ? 'Пополнение баланса' : 'Вывод средств'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleString('ru-RU')}
                          </p>
                          <p className="text-xs text-gray-600">
                            Баланс: {Number(event.balance_before).toLocaleString('ru-RU')} ₽ →{' '}
                            {Number(event.balance_after).toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      </div>

                      <p
                        className={`text-lg font-bold whitespace-nowrap ${
                          event.event_type === 'TOP_UP' ? 'text-green-400' : 'text-orange-400'
                        }`}
                      >
                        {event.event_type === 'TOP_UP' ? '+' : '-'}
                        {Number(event.operation_amount).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </Card>
                ))}

                {balanceEvents.length === 0 && (
                  <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                    <Wallet size={36} className="mx-auto mb-3 opacity-30" />
                    <p>Операций пока нет</p>
                  </div>
                )}
              </div>

              <Pagination
                currentPage={eventsPage}
                totalPages={eventsTotalPages}
                onPageChange={setEventsPage}
                isLoading={isFetching}
              />
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!modalType}
        onClose={closeModal}
        title={modalType === 'topup' ? 'Пополнение баланса' : 'Вывод средств'}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Сумма</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Введите сумму"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#6C63FF] transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || Number(amount) <= 0}
              className="min-w-[140px] flex items-center justify-center"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : modalType === 'topup' ? (
                'Пополнить'
              ) : (
                'Вывести'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LessorFinances;
