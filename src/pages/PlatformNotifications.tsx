import { useQuery } from '@tanstack/react-query';
import { Megaphone, CalendarDays, Loader2 } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Card } from '../components/ui/Card';

const NotificationCard = ({ notification }: { notification: { id: string; title: string; details: string; created_at: string } }) => {
  return (
    <Card className="overflow-hidden mb-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs whitespace-nowrap flex-shrink-0">
          <CalendarDays size={12} />
          {new Date(notification.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{notification.details}</p>
    </Card>
  );
};

const PlatformNotifications = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-notifications'],
    queryFn: notificationService.getNotifications,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <Megaphone size={20} className="text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Изменения на платформе</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
        </div>
      ) : !data || data.notifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Megaphone size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Нет изменений на платформе</p>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-4">Всего изменений: {data.total}</p>
          <div className="space-y-4">
            {data.notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlatformNotifications;
