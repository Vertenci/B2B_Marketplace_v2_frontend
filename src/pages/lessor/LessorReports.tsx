import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, Building2, Car, AlertTriangle, Loader2 } from 'lucide-react';
import { lessorService } from '../../services/lessorService';
import { Card } from '../../components/ui/Card';

type Period = 'WEEK' | 'MONTH' | 'ALL';

const periods: { value: Period; label: string }[] = [
  { value: 'WEEK', label: 'Неделя' },
  { value: 'MONTH', label: 'Месяц' },
  { value: 'ALL', label: 'Всё время' },
];

const PeriodTabs = ({ value, onChange }: { value: Period; onChange: (v: Period) => void }) => (
  <div className="flex gap-1 bg-white/5 rounded-xl p-1">
    {periods.map((p) => (
      <button
        key={p.value}
        onClick={() => onChange(p.value)}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          value === p.value
            ? 'bg-[#6C63FF] text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        {p.label}
      </button>
    ))}
  </div>
);

const ChartCard = ({
  title, icon: Icon, data, dataKey, color, loading,
}: {
  title: string; icon: React.ElementType; data: { name: string; value: number }[];
  dataKey: string; color: string; loading: boolean;
}) => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[#6C63FF]" />
      </div>
    ) : data.length === 0 ? (
      <div className="text-center py-12 text-gray-600 border border-dashed border-white/10 rounded-xl">
        <p>Нет данных</p>
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: '#fff',
            }}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </Card>
);

const LessorReports = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [period, setPeriod] = useState<Period>('ALL');

  const rentalsByCompany = useQuery({
    queryKey: ['lessor-reports', 'rentals-by-company', companyId, period],
    queryFn: () => lessorService.getReportsRentalsByCompany(companyId!, period),
    enabled: !!companyId,
  });

  const paymentsByCompany = useQuery({
    queryKey: ['lessor-reports', 'payments-by-company', companyId, period],
    queryFn: () => lessorService.getReportsPaymentsByCompany(companyId!, period),
    enabled: !!companyId,
  });

  const rentalsByCar = useQuery({
    queryKey: ['lessor-reports', 'rentals-by-car', companyId, period],
    queryFn: () => lessorService.getReportsRentalsByCar(companyId!, period),
    enabled: !!companyId,
  });

  const violationsByRenter = useQuery({
    queryKey: ['lessor-reports', 'violations-by-renter', companyId, period],
    queryFn: () => lessorService.getReportsViolationsByRenter(companyId!, period),
    enabled: !!companyId,
  });

  const toChartData = (data: { company_name?: string; car_name?: string; count?: number; total?: number }[] | undefined, valueKey: 'count' | 'total') =>
    (data ?? []).map((d) => ({ name: d.company_name ?? d.car_name ?? '—', value: d[valueKey] ?? 0 }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} className="text-[#6C63FF]" />
          <h1 className="text-3xl font-bold text-white">Отчётность</h1>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Аренды по компаниям"
          icon={Building2}
          data={toChartData(rentalsByCompany.data, 'count')}
          dataKey="count"
          color="#6C63FF"
          loading={rentalsByCompany.isLoading}
        />
        <ChartCard
          title="Выручка по компаниям (BYN)"
          icon={Building2}
          data={toChartData(paymentsByCompany.data, 'total')}
          dataKey="total"
          color="#22c55e"
          loading={paymentsByCompany.isLoading}
        />
        <ChartCard
          title="Аренды по автомобилям"
          icon={Car}
          data={toChartData(rentalsByCar.data, 'count')}
          dataKey="count"
          color="#f59e0b"
          loading={rentalsByCar.isLoading}
        />
        <ChartCard
          title="Нарушения по компаниям"
          icon={AlertTriangle}
          data={toChartData(violationsByRenter.data, 'count')}
          dataKey="count"
          color="#ef4444"
          loading={violationsByRenter.isLoading}
        />
      </div>
    </div>
  );
};

export default LessorReports;
