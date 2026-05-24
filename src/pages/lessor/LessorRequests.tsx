import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, CheckCircle, XCircle, Car, Building2, User, Calendar, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft
} from 'lucide-react';
import { lessorService } from '../../services/lessorService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { RentalRequestStatus } from '../../types';

const statusConfig: Record<RentalRequestStatus, { label: string; variant: 'yellow' | 'green' | 'red' | 'gray' }> = {
  PENDING: { label: 'Ожидает', variant: 'yellow' },
  APPROVED: { label: 'Одобрена', variant: 'green' },
  REJECTED: { label: 'Отклонена', variant: 'red' },
  CANCELLED: { label: 'Отменена', variant: 'gray' },
};

const PAGE_SIZE = 10;
const MAX_VISIBLE_PAGES = 5;

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
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || isLoading}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="В начало"
      >
        <ChevronsLeft size={16} />
      </button>
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

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

const LessorRequests = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RentalRequestStatus | undefined>(undefined);
  
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const skip = (page - 1) * PAGE_SIZE;

  const { data: requests, isLoading, isFetching } = useQuery({
    queryKey: ['lessor-requests', companyId, filter, page],
    queryFn: () => lessorService.getRequests(companyId!, filter, skip, PAGE_SIZE),
    enabled: !!companyId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => lessorService.approveRequest(companyId!, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessor-requests', companyId] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => lessorService.rejectRequest(companyId!, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessor-requests', companyId] }),
  });

  const pendingCount = requests?.filter(r => r.status === 'PENDING').length || 0;

  const totalPages = requests && requests.length === PAGE_SIZE ? page + 1 : page;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Заявки на аренду
            {requests && requests.length > 0 && (
              <span className="text-sm text-gray-400 ml-2">(стр. {page})</span>
            )}
          </h1>
          {pendingCount > 0 && <p className="text-yellow-400 text-sm mt-1">{pendingCount} заявок ожидают ответа</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {([undefined, 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as (RentalRequestStatus | undefined)[]).map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === s ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}>
            {s ? statusConfig[s].label : 'Все'}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

      <div className="space-y-4">
        {requests?.map(req => (
          <Card key={req.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={statusConfig[req.status].variant}>{statusConfig[req.status].label}</Badge>
                  <span className="text-gray-500 text-xs">{new Date(req.created_at).toLocaleDateString('ru-RU')}</span>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {/* Car */}
                  <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <Car size={14} className="text-[#6C63FF] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Автомобиль</p>
                      <p className="text-sm text-white font-medium">{req.car.brand} {req.car.model}</p>
                      <p className="text-xs text-gray-500">{req.car.plate_number} · {Number(req.car.price_per_day).toLocaleString('ru-RU')} BYN/день</p>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <Building2 size={14} className="text-green-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Арендатор</p>
                      <p className="text-sm text-white font-medium">{req.company.name}</p>
                      <p className="text-xs text-gray-500">ИНН: {req.company.inn}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <Calendar size={14} className="text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Период аренды</p>
                      <p className="text-sm text-white">{new Date(req.start_date).toLocaleDateString('ru-RU')}</p>
                      <p className="text-sm text-white">— {new Date(req.end_date).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-2 mt-2 px-1">
                  <User size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Водитель: {req.user.full_name} ({req.user.email})</span>
                </div>

                {req.message && (
                  <p className="text-xs text-gray-400 mt-2 px-1 italic">«{req.message}»</p>
                )}
              </div>

              {/* Actions */}
              {req.status === 'PENDING' && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(req.id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 rounded-xl text-sm font-medium transition-colors"
                  >
                    {approveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Одобрить
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors"
                  >
                    {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {!requests?.length && !isLoading && (
          <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>Заявок нет</p>
          </div>
        )}
      </div>

      {/* Пагинация */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isFetching}
      />
    </div>
  );
};

export default LessorRequests;
