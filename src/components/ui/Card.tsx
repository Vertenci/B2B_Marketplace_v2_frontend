interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card = ({ children, className = '', onClick, hover }: CardProps) => (
  <div
    onClick={onClick}
    className={`
      bg-white/5 border border-white/10 rounded-2xl p-6
      ${hover ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

export const StatCard = ({
  label, value, icon: Icon, color = 'blue'
}: {
  label: string; value: string | number; icon: React.ComponentType<{ size?: number; className?: string }>; color?: string;
}) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    red: 'text-red-400 bg-red-500/20',
  };
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
          <Icon size={22} className={colorMap[color]?.split(' ')[0] || 'text-blue-400'} />
        </div>
      </div>
    </Card>
  );
};
