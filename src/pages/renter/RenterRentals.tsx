import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, MapPin, AlertTriangle, DollarSign, Download, Loader2, Car, Calendar } from 'lucide-react';
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

const RenterRentals = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RentalStatus | undefined>(undefined);
  const [mapModal, setMapModal] = useState<string | null>(null);
  const [violationsModal, setViolationsModal] = useState<string | null>(null);

  const { data: rentals, isLoading } = useQuery({
    queryKey: ['renter-rentals', companyId, filter],
    queryFn: () => renterService.getRentals(companyId!, filter, 0, 50),
    enabled: !!companyId,
  });

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Мои аренды</h1>

      <div className="flex gap-2 mb-6">
        {([undefined, 'ACTIVE', 'COMPLETED', 'OVERDUE'] as (RentalStatus | undefined)[]).map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === s ? 'bg-[#6C63FF] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            {s ? statusConfig[s].label : 'Все'}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

      <div className="space-y-4">
        {rentals?.map(rental => (
          <Card key={rental.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={statusConfig[rental.status].variant}>{statusConfig[rental.status].label}</Badge>
                  {!rental.is_paid && rental.status === 'COMPLETED' && <Badge variant="red">Не оплачена</Badge>}
                  {rental.is_paid && <Badge variant="green">Оплачена</Badge>}
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
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
                  </>
                )}
                {rental.status === 'COMPLETED' && !rental.is_paid && (
                  <button onClick={() => payMutation.mutate(rental.id)} disabled={payMutation.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded-lg text-xs transition-colors">
                    {payMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                    Оплатить
                  </button>
                )}
                {['contract', 'act', 'invoice'].map(type => (
                  <button key={type} onClick={() => downloadMutation.mutate({ rentalId: rental.id, type })}
                    disabled={downloadMutation.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 rounded-lg text-xs transition-colors">
                    <Download size={12} />{type === 'contract' ? 'Договор' : type === 'act' ? 'Акт' : 'Счёт'}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}
        {!rentals?.length && !isLoading && (
          <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-2xl">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>Аренд нет</p>
          </div>
        )}
      </div>

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
