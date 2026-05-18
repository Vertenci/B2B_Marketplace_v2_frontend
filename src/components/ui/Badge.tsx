interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  green: 'bg-green-500/20 text-green-400 border border-green-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

export const Badge = ({ variant = 'gray', children }: BadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
    {children}
  </span>
);
