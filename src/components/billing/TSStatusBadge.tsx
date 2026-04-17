import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface TSStatusBadgeProps {
  status: Invoice['ts_status'];
  className?: string;
}

const statusConfig: Record<Invoice['ts_status'], { label: string; className: string }> = {
  not_applicable: { label: 'N/A', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  pending: { label: 'Da inviare', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  sent: { label: 'Inviata', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  accepted: { label: 'Accettata', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rifiutata', className: 'bg-red-100 text-red-700 border-red-200' },
  error: { label: 'Errore', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function TSStatusBadge({ status, className }: TSStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status] ?? statusConfig.pending;

  const labelMap: Record<Invoice['ts_status'], string> = {
    not_applicable: 'N/A',
    pending: t('fatturazione.tsPending'),
    sent: t('fatturazione.tsSent'),
    accepted: t('fatturazione.tsAccepted'),
    rejected: t('fatturazione.tsRejected'),
    error: t('fatturazione.tsError'),
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {labelMap[status] ?? config.label}
    </Badge>
  );
}
