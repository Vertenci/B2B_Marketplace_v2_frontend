import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { lessorService } from '../../services/lessorService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CITIES: Record<string, [number, number]> = {
  // Беларусь
  'Минск': [53.9045, 53.9045],
  'Брест': [52.0976, 23.7341],
  'Гродно': [53.6884, 23.8258],
  'Гомель': [52.4412, 30.9878],
  'Могилёв': [53.9168, 30.3449],
  'Витебск': [55.1904, 30.2049],
  'Барановичи': [53.1327, 26.0155],
  'Бобруйск': [53.1381, 29.2213],
  'Пинск': [52.1239, 26.0979],
  'Орша': [54.5073, 30.4146],
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
    <div className="flex items-center justify-center gap-1 mt-3">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || isLoading}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="В начало"
      >
        <ChevronsLeft size={14} />
      </button>
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
      </button>

      {getVisiblePages().map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-1.5 text-gray-600 text-xs">
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
              min-w-[30px] h-7 rounded-lg text-xs font-medium transition-colors
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
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const MapFlyTo = ({ center, zoom = 13 }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  map.flyTo(center, zoom, { duration: 0.8 });
  return null;
};

const LessorGeofences = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const queryClient = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    name: '',
    center_lat: 53.9045,
    center_lng: 53.9045,
    radius_meters: 5000,
    city: 'Минск',
  });
  const [selectedCarId, setSelectedCarId] = useState('');
  const [miniCenter, setMiniCenter] = useState<[number, number]>([55.7558, 37.6173]);

  const skip = (page - 1) * PAGE_SIZE;

  const { data: cars } = useQuery({
    queryKey: ['lessor-cars', companyId],
    queryFn: () => lessorService.getCars(companyId!, 0, 50),
    enabled: !!companyId,
  });

  const { data: geofences, isLoading, isFetching } = useQuery({
    queryKey: ['lessor-geofences', companyId, page],
    queryFn: () => lessorService.getAllGeofences(companyId!, skip, PAGE_SIZE),
    enabled: !!companyId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: () => lessorService.createGeofence(companyId!, selectedCarId, {
      name: form.name,
      center_lat: form.center_lat,
      center_lng: form.center_lng,
      radius_meters: form.radius_meters,
      is_active: true,
    }),
    onSuccess: (geo) => {
      setAddModal(false);
      setForm({ name: '', center_lat: 53.9045, center_lng: 53.9045, radius_meters: 5000, city: 'Минск' });
      setSelectedCarId('');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['lessor-geofences', companyId] });
      const lat = Number(geo.center_lat);
      const lng = Number(geo.center_lng);
      setMapCenter([lat, lng]);
      setFlyTo([lat, lng]);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (geoId: string) => lessorService.toggleGeofence(companyId!, geoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessor-geofences', companyId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (geoId: string) => lessorService.deleteGeofence(companyId!, geoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessor-geofences', companyId] });
      if (selectedId) setSelectedId(null);
    },
  });

  const handleCityChange = (city: string) => {
    const coords = CITIES[city];
    if (coords) {
      setForm(f => ({ ...f, city, center_lat: coords[0], center_lng: coords[1] }));
      setMiniCenter(coords);
    }
  };

  const handleSelectGeofence = (geoId: string, lat: number, lng: number) => {
    setSelectedId(geoId === selectedId ? null : geoId);
    setFlyTo([lat, lng]);
  };

  const totalPages = geofences && geofences.length === PAGE_SIZE ? page + 1 : page;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">
          Геозоны
          {geofences && geofences.length > 0 && (
            <span className="text-sm text-gray-400 ml-2">(стр. {page})</span>
          )}
        </h1>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#6C63FF] hover:bg-[#5a52d6] rounded-xl text-white text-sm transition-colors"
        >
          <Plus size={16} />Создать геозону
        </button>
      </div>

      {/* Main layout: map (left) + list (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map — занимает 3/5 ширины */}
        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 520 }}>
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {flyTo && <MapFlyTo center={flyTo} key={flyTo.toString()} />}
            {geofences?.map(geo => (
              <Circle
                key={geo.id}
                center={[Number(geo.center_lat), Number(geo.center_lng)]}
                radius={geo.radius_meters}
                pathOptions={{
                  color: selectedId === geo.id ? '#FF6584' : geo.is_active ? '#6C63FF' : '#6b7280',
                  fillOpacity: selectedId === geo.id ? 0.25 : 0.1,
                  weight: selectedId === geo.id ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => handleSelectGeofence(geo.id, Number(geo.center_lat), Number(geo.center_lng)),
                }}
              >
                <Popup>
                  <strong>{geo.name}</strong><br />
                  Радиус: {geo.radius_meters}м<br />
                  {geo.car && <span>{geo.car.brand} {geo.car.model} ({geo.car.plate_number})<br /></span>}
                  {geo.is_active ? 'Активна' : 'Неактивна'}
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>

        {/* List — занимает 2/5 ширины */}
        <div className="lg:col-span-2 flex flex-col" style={{ maxHeight: 520 }}>
          <div className="flex flex-col gap-3 overflow-y-auto flex-1">
            {isLoading && <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-[#6C63FF]" /></div>}

            {geofences?.map(geo => {
              const isSelected = selectedId === geo.id;
              return (
                <div
                  key={geo.id}
                  onClick={() => handleSelectGeofence(geo.id, Number(geo.center_lat), Number(geo.center_lng))}
                  className={`
                    p-4 rounded-2xl border cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'bg-[#6C63FF]/15 border-[#6C63FF]/50 shadow-lg shadow-[#6C63FF]/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${geo.is_active ? 'bg-[#6C63FF]' : 'bg-gray-500'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-white text-sm truncate">{geo.name}</h3>
                          <Badge variant={geo.is_active ? 'purple' : 'gray'}>{geo.is_active ? 'Активна' : 'Неактивна'}</Badge>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {geo.radius_meters}м · {Number(geo.center_lat).toFixed(4)}, {Number(geo.center_lng).toFixed(4)}
                        </p>
                        {geo.car && (
                          <p className="text-gray-600 text-xs mt-0.5 truncate">
                            {geo.car.brand} {geo.car.model} ({geo.car.plate_number})
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={e => { e.stopPropagation(); toggleMutation.mutate(geo.id); }}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        {geo.is_active
                          ? <ToggleRight size={18} className="text-[#6C63FF]" />
                          : <ToggleLeft size={18} />
                        }
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm('Удалить геозону?')) deleteMutation.mutate(geo.id); }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!geofences?.length && !isLoading && (
              <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-2xl">
                <MapPin size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Геозон нет</p>
                <p className="text-xs mt-1">Нажмите «Создать геозону»</p>
              </div>
            )}
          </div>

          {/* Пагинация внизу списка */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </div>
      </div>

      {/* Create Geofence Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Создать геозону" size="xl">
        {/* Форма — сверху */}
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Название */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Название</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Зона А"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF]/60 text-sm"
              />
            </div>

            {/* Машина */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Машина</label>
              <select
                value={selectedCarId}
                onChange={e => setSelectedCarId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60 text-sm"
              >
                <option value="">-- Выберите машину --</option>
                {cars?.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.plate_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Город */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Центр (город)</label>
              <select
                value={form.city}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#6C63FF]/60 text-sm"
              >
                {Object.keys(CITIES).map(city => <option key={city}>{city}</option>)}
              </select>
            </div>

            {/* Радиус */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Радиус: <span className="text-white font-medium">{form.radius_meters} м</span>
              </label>
              <input
                type="range" min={100} max={10000} step={50}
                value={form.radius_meters}
                onChange={e => setForm(f => ({ ...f, radius_meters: Number(e.target.value) }))}
                className="w-full accent-[#6C63FF] mt-1"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-0.5"><span>100м</span><span>5км</span></div>
            </div>
          </div>

          {/* Координаты (ручной ввод) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Широта</label>
              <input
                type="number" value={form.center_lat} step={0.0001}
                onChange={e => setForm(f => ({ ...f, center_lat: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Долгота</label>
              <input
                type="number" value={form.center_lng} step={0.0001}
                onChange={e => setForm(f => ({ ...f, center_lng: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">Нажмите на карту ниже чтобы переместить центр геозоны</p>
        </div>

        {/* Мини-карта — снизу, полная ширина */}
        <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 280 }}>
          <MapContainer
            center={miniCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            key={miniCenter.toString()}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[form.center_lat, form.center_lng]}
              radius={form.radius_meters}
              pathOptions={{ color: '#6C63FF', fillOpacity: 0.15 }}
            />
            <Marker position={[form.center_lat, form.center_lng]} />
            <MapClickHandler onMapClick={(lat, lng) => {
              setForm(f => ({ ...f, center_lat: lat, center_lng: lng }));
            }} />
          </MapContainer>
        </div>

        {createMutation.isError && (
          <p className="text-red-400 text-sm mt-3">
            Ошибка создания геозоны. Проверьте что выбрана машина.
          </p>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={() => setAddModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5">
            Отмена
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.name || !selectedCarId || createMutation.isPending}
            className="flex-1 py-3 bg-[#6C63FF] hover:bg-[#5a52d6] disabled:opacity-40 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Создать
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LessorGeofences;
