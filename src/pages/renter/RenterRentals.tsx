import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, MapPin, AlertTriangle, DollarSign, Download, Loader2, Car, Calendar, CheckSquare, ChevronLeft, ChevronRight, ChevronsLeft, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renterService } from '../../services/renterService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { RentalStatus } from '../../types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusConfig: Record<RentalStatus, { label: string; variant: 'green' | 'gray' | 'red' }> = {
  ACTIVE: { label: 'Активна', variant: 'green' },
  COMPLETED: { label: 'Завершена', variant: 'gray' },
  OVERDUE: { label: 'Просрочена', variant: 'red' },
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

const RenterRentals = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RentalStatus | 'SOON' | undefined>(undefined);
  const [mapModal, setMapModal] = useState<string | null>(null);
  const [violationsModal, setViolationsModal] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const skip = (page - 1) * PAGE_SIZE;

  const { data: rentals, isLoading, isFetching } = useQuery({
    queryKey: ['renter-rentals', companyId, filter === 'SOON' ? 'ACTIVE' : filter, page],
    queryFn: () => renterService.getRentals(companyId!, filter === 'SOON' ? 'ACTIVE' : filter, skip, PAGE_SIZE),
    enabled: !!companyId,
  });

  const daysUntilEnd = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredRentals = filter === 'SOON'
    ? (rentals || []).filter(r => {
        const days = daysUntilEnd(r.end_date);
        return days >= 0 && days <= 3;
      })
    : (rentals || []);

  const totalPages = rentals && rentals.length === PAGE_SIZE ? page + 1 : page;

  const { data: telemetry } = useQuery({
    queryKey: ['renter-telemetry', mapModal],
    queryFn: () => renterService.getRentalTelemetry(companyId!, mapModal!),
    enabled: !!mapModal && !!companyId,
    refetchInterval: 5000,
  });

  const { data: violations } = useQuery({
    queryKey: ['renter-violations', violationsModal],
    queryFn: () => renterService.getRentalViolations(companyId!, violationsModal!),
    enabled: !!violationsModal && !!companyId,
  });

  const completeMutation = useMutation({
    mutationFn: (rentalId: string) => renterService.completeRental(companyId!, rentalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-rentals', companyId] }),
  });

  const payMutation = useMutation({
    mutationFn: (rentalId: string) => renterService.payRental(companyId!, rentalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renter-rentals', companyId] }),
  });

  const downloadMutation = useMutation({
    mutationFn: ({ rentalId, type }: { rentalId: string; type: string }) =>
      renterService.downloadDocument(companyId!, rentalId, type),
    onSuccess: (blob, { type, rentalId }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${rentalId}.pdf`;
      a.click();
    },
  });

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: undefined, label: 'Все' },
    { key: 'ACTIVE', label: 'Активные' },
    { key: 'SOON', label: 'Скоро' },
    { key: 'COMPLETED', label: 'Завершённые' },
    { key: 'OVERDUE', label: 'Просроченные' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Мои аренды</h1>

      <div className="flex gap-2 mb-6">
        {filterTabs.map(({ key, label }) => (
          <button key={label} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

      <div className="space-y-4">
        {filteredRentals.map(rental => (
          <Card key={rental.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={statusConfig[rental.status].variant}>{statusConfig[rental.status].label}</Badge>
                  {rental.status === 'ACTIVE' && (() => {
                    const days = daysUntilEnd(rental.end_date);
                    if (days <= 0) return <Badge variant="red">Сегодня</Badge>;
                    if (days === 1) return <Badge variant="yellow">Завтра</Badge>;
                    if (days <= 3) return <Badge variant="yellow">Скоро</Badge>;
                    return null;
                  })()}
                  {!rental.is_paid && rental.status === 'COMPLETED' && <Badge variant="red">Не оплачена</Badge>}
                  {rental.is_paid && <Badge variant="green">Оплачена</Badge>}
                </div>
                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  {rental.car && (
                    <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                      <Car size={14} className="text-[#6C63FF] mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Автомобиль</p>
                        <p className="text-sm text-white font-medium">{rental.car.brand} {rental.car.model}</p>
                        <p className="text-xs text-gray-500">{rental.car.plate_number}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                    <Calendar size={14} className="text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Период</p>
                      <p className="text-sm text-white">{new Date(rental.start_date).toLocaleDateString('ru-RU')}</p>
                      <p className="text-sm text-white">— {new Date(rental.end_date).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                  {rental.lessor_company && (
                    <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                      <Building2 size={14} className="text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Компания</p>
                        <p className="text-sm text-white font-medium">{rental.lessor_company.name}</p>
                        <p className="text-xs text-gray-500">{rental.lessor_company.inn}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Стоимость: <span className="text-white font-medium">{Number(rental.base_price_total).toLocaleString('ru-RU')} ₽</span></span>
                  {Number(rental.extra_days_fee) > 0 && <span className="text-red-400">+{Number(rental.extra_days_fee).toLocaleString('ru-RU')} ₽</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                {rental.status === 'ACTIVE' && (
                  <>
                    <button onClick={() => setMapModal(rental.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs transition-colors">
                      <MapPin size={12} />На карте
                    </button>
                    <button onClick={() => setViolationsModal(rental.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs transition-colors">
                      <AlertTriangle size={12} />Нарушения
                    </button>
                    {daysUntilEnd(rental.end_date) <= 0 && (
                      <button onClick={() => { if (confirm('Завершить аренду?')) completeMutation.mutate(rental.id); }}
                        disabled={completeMutation.isPending}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded-lg text-xs transition-colors">
                        {completeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />}
                        Завершить
                      </button>
                    )}
                  </>
                )}
                {rental.status === 'COMPLETED' && !rental.is_paid && (
                  <button onClick={() => payMutation.mutate(rental.id)} disabled={payMutation.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded-lg text-xs transition-colors">
                    {payMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                    Оплатить
                  </button>
                )}
                {['contract', 'act', 'invoice'].map(type => {
                  const canDownload = type === 'contract' || rental.status === 'COMPLETED';
                  return (
                    <button
                      key={type}
                      onClick={() => { if (canDownload) downloadMutation.mutate({ rentalId: rental.id, type }); }}
                      disabled={!canDownload || downloadMutation.isPending}
                      title={!canDownload && type !== 'contract' ? 'Можно скачать после аренды' : undefined}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        canDownload
                          ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'
                          : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <Download size={12} />{type === 'contract' ? 'Договор' : type === 'act' ? 'Акт' : 'Счёт'}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
        {!filteredRentals.length && !isLoading && (
          <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>Аренд нет</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isFetching}
      />

      {/* Map Modal */}
      <Modal isOpen={!!mapModal} onClose={() => setMapModal(null)} title="Текущее положение авто" size="xl">
        <div className="rounded-xl overflow-hidden" style={{ height: 380 }}>
          {telemetry ? (
            <MapContainer center={[Number(telemetry.lat), Number(telemetry.lng)]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[Number(telemetry.lat), Number(telemetry.lng)]}>
                <Popup>Скорость: {telemetry.speed} км/ч<br />{new Date(telemetry.recorded_at).toLocaleTimeString('ru-RU')}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-white/5 rounded-xl text-gray-500">
              <div className="text-center"><MapPin size={32} className="mx-auto mb-2 opacity-40" /><p>Нет телеметрии</p></div>
            </div>
          )}
        </div>
        {telemetry && (
          <div className="mt-3 flex gap-4 text-sm text-gray-400">
            <span>Скорость: <span className="text-white">{telemetry.speed} км/ч</span></span>
            <span>Обновлено: <span className="text-white">{new Date(telemetry.recorded_at).toLocaleTimeString('ru-RU')}</span></span>
          </div>
        )}
      </Modal>

      {/* Violations Modal */}
      <Modal isOpen={!!violationsModal} onClose={() => setViolationsModal(null)} title="Нарушения" size="lg">
        {violations?.length ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {violations.map(v => (
              <div key={v.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">
                    {v.type === 'GEOFENCE_EXIT' ? 'Выход из геозоны' : v.type === 'SPEEDING' ? 'Превышение скорости' : v.type}
                  </p>
                  <p className="text-gray-500 text-xs">{new Date(v.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <Badge variant="red">{v.severity || 'WARN'}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500"><AlertTriangle size={32} className="mx-auto mb-2 opacity-30" /><p>Нарушений нет</p></div>
        )}
      </Modal>
    </div>
  );
};

export default RenterRentals;
