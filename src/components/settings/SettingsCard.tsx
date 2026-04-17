import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  cardClassName?: string;
  variant?: 'default' | 'danger';
}

export function SettingsCard({ children, title, description, className, cardClassName, variant = 'default' }: SettingsCardProps) {
  return (
    <div className={cn('mb-6', className)}>
      {title && (
        <h3 className={cn(
          'text-lg font-semibold mb-3',
          variant === 'danger' && 'text-destructive'
        )}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}
      <Card className={cn(
        'p-6 relative',
        variant === 'danger' && 'border-destructive/30',
        cardClassName
      )}>
        {children}
      </Card>
    </div>
  );
}

interface SettingsRowProps {
  children: ReactNode;
  label: string;
  description?: string;
  className?: string;
}

export function SettingsRow({ children, label, description, className }: SettingsRowProps) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-start md:justify-between gap-4 py-4 border-b last:border-0 last:pb-0 first:pt-0', className)}>
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 md:w-auto">
        {children}
      </div>
    </div>
  );
}
