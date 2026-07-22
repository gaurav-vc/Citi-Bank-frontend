import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: React.ElementType;
  format?: 'currency' | 'number' | 'percentage';
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  format = 'number',
  onClick,
  className,
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          notation: val >= 100000 ? 'compact' : 'standard',
          maximumFractionDigits: 1,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-IN').format(val);
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div
      onClick={onClick}
      className={cn(
        'drilldown-card p-6',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between w-full">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-primary/5 text-primary/70 shrink-0">
            <Icon className="h-5 w-5 stroke-[1.75]" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground font-manrope">
          {formatValue(value)}
        </p>
      </div>
      {trend && trendValue && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-semibold font-manrope', trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
