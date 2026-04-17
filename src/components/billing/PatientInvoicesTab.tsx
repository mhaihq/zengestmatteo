import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTable } from './InvoiceTable';
import { supabase, type Invoice, type ProfessionistaFiscalProfile } from '@/lib/supabase';
import { fetchProfessionistaProfile, fetchAnyProfessionistaProfile, fetchInvoices } from '@/lib/invoice-service';
import { useTranslation } from 'react-i18next';

interface PatientInvoicesTabProps {
  patientId: string;
}

export function PatientInvoicesTab({ patientId }: PatientInvoicesTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<ProfessionistaFiscalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const prof = user
          ? await fetchProfessionistaProfile(user.id)
          : await fetchAnyProfessionistaProfile();
        setProfile(prof);
        if (prof) {
          const data = await fetchInvoices(prof.id, { patientId });
          setInvoices(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  const total = invoices.reduce((acc, inv) => acc + inv.totale, 0);
  const paid = invoices.filter((inv) => inv.pagato).reduce((acc, inv) => acc + inv.totale, 0);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="rounded-lg border bg-card p-3 text-center min-w-[80px]">
            <p className="text-xs text-muted-foreground">{t('fatturazione.statTotal')}</p>
            <p className="text-lg font-bold">{invoices.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center min-w-[100px]">
            <p className="text-xs text-muted-foreground">Fatturato</p>
            <p className="text-lg font-bold">€{total.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center min-w-[100px]">
            <p className="text-xs text-muted-foreground">{t('fatturazione.paid')}</p>
            <p className="text-lg font-bold text-green-600">€{paid.toFixed(2)}</p>
          </div>
        </div>
        {profile && (
          <Button
            size="sm"
            className="gap-2 bg-cyan-600 hover:bg-cyan-700"
            onClick={() => navigate(`/fatture/new?patient_id=${patientId}`)}
          >
            <Plus className="h-4 w-4" />
            {t('fatturazione.newInvoice')}
          </Button>
        )}
      </div>

      <InvoiceTable invoices={invoices} showPatient={false} />
    </div>
  );
}
