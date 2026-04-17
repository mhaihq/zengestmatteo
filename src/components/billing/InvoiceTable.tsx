import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TSStatusBadge } from './TSStatusBadge';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  showPatient?: boolean;
  selectedIds?: Set<string>;
  onSelectId?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

export function InvoiceTable({
  invoices,
  showPatient = true,
  selectedIds,
  onSelectId,
  onSelectAll,
}: InvoiceTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasSelection = selectedIds !== undefined;
  const allSelected = hasSelection && invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id));

  const typeLabel: Record<Invoice['type'], string> = {
    fattura: t('fatturazione.typeF'),
    proforma: t('fatturazione.typeP'),
    nota_di_credito: t('fatturazione.typeNC'),
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            {hasSelection && (
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(v) => onSelectAll?.(!!v)} />
              </TableHead>
            )}
            <TableHead>{t('fatturazione.numero')}</TableHead>
            <TableHead>{t('fatturazione.data')}</TableHead>
            {showPatient && <TableHead>{t('fatturazione.paziente')}</TableHead>}
            <TableHead className="text-right">{t('fatturazione.importo')}</TableHead>
            <TableHead className="text-right">{t('fatturazione.totale')}</TableHead>
            <TableHead>{t('fatturazione.pagato')}</TableHead>
            <TableHead>{t('fatturazione.tsStatus')}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={showPatient ? 9 : 8} className="text-center py-12 text-muted-foreground">
                {t('fatturazione.noInvoices')}
              </TableCell>
            </TableRow>
          )}
          {invoices.map((inv) => (
            <TableRow
              key={inv.id}
              className={cn(
                'cursor-pointer hover:bg-muted/30 transition-colors',
                inv.status === 'cancelled' && 'opacity-50'
              )}
              onClick={() => navigate(`/fatture/${inv.id}`)}
            >
              {hasSelection && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds?.has(inv.id)}
                    onCheckedChange={(v) => onSelectId?.(inv.id, !!v)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {inv.numero ?? '—'}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {typeLabel[inv.type]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(inv.data_emissione), 'dd/MM/yyyy', { locale: it })}
              </TableCell>
              {showPatient && (
                <TableCell className="font-medium text-sm">
                  {inv.patient?.name ?? '—'}
                </TableCell>
              )}
              <TableCell className="text-right font-mono text-sm">
                €{inv.importo.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold">
                €{inv.totale.toFixed(2)}
              </TableCell>
              <TableCell>
                {inv.pagato ? (
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                    {t('fatturazione.paid')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    {t('fatturazione.unpaid')}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <TSStatusBadge status={inv.ts_status} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => navigate(`/fatture/${inv.id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
