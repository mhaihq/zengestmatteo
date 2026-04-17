import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, CircleCheck as CheckCircle2, Send, Download, FileX, RefreshCw, TriangleAlert as AlertTriangle, User, FileText, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TSStatusBadge } from '@/components/billing/TSStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { fetchInvoice, updateInvoice, generateInvoicePDF, fetchAnyProfessionistaProfile, fetchProfessionistaProfile } from '@/lib/invoice-service';
import { sendInvoiceToTS } from '@/lib/ts-service';
import { FORFETTARIO_BOILERPLATE } from '@/lib/invoice-rules';
import { supabase, type Invoice, type ProfessionistaFiscalProfile } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [profile, setProfile] = useState<ProfessionistaFiscalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function loadInvoice() {
    if (!invoiceId) return;
    try {
      const data = await fetchInvoice(invoiceId);
      setInvoice(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const prof = user
        ? await fetchProfessionistaProfile(user.id)
        : await fetchAnyProfessionistaProfile();
      setProfile(prof);
      await loadInvoice();
    }
    init();
  }, [invoiceId]);

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateInvoice(invoice.id, {
        pagato: true,
        data_pagamento: today,
        ts_eligible: invoice.type === 'fattura',
      });
      await loadInvoice();
      toast({ title: t('fatturazione.markedPaid') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToTS = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const result = await sendInvoiceToTS(invoice.id);
      if (result.success) {
        toast({ title: t('fatturazione.tsSentOk') });
      } else {
        toast({ title: t('fatturazione.tsSentError'), description: result.error, variant: 'destructive' });
      }
      await loadInvoice();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await updateInvoice(invoice.id, { status: 'cancelled' });
      await loadInvoice();
      toast({ title: t('fatturazione.invoiceCancelled') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCreditNote = () => {
    if (!invoice) return;
    navigate(`/fatture/new?referenced_invoice_id=${invoice.id}&patient_id=${invoice.patient_id}&type=nota_di_credito`);
  };

  const handleGeneratePDF = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      const result = await generateInvoicePDF(invoice.id);
      if (result.success && result.pdf_url) {
        await loadInvoice();
        toast({ title: t('fatturazione.pdfGenerated') });
        window.open(result.pdf_url, '_blank');
      } else {
        toast({ title: t('fatturazione.pdfError'), description: result.error, variant: 'destructive' });
      }
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 text-center py-20">
        <p className="text-muted-foreground">{t('fatturazione.invoiceNotFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/fatture')}>
          {t('fatturazione.invoicesTitle')}
        </Button>
      </div>
    );
  }

  const typeLabel: Record<Invoice['type'], string> = {
    fattura: t('fatturazione.typeF'),
    proforma: t('fatturazione.typeP'),
    nota_di_credito: t('fatturazione.typeNC'),
  };

  const statusColors: Record<Invoice['status'], string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    credited: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const canMarkPaid = !invoice.pagato && invoice.status === 'confirmed';
  const canSendTS = invoice.type === 'fattura' && invoice.pagato &&
    invoice.ts_status !== 'accepted' && invoice.ts_status !== 'sent' &&
    invoice.status === 'confirmed';
  const canCancel = invoice.status === 'confirmed' || invoice.status === 'draft';
  const canCreditNote = invoice.type === 'fattura' && invoice.status === 'confirmed';

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Button variant="ghost" className="gap-2 -ml-2 rounded-full" onClick={() => navigate('/fatture')}>
          <ChevronLeft className="h-4 w-4" />
          {t('fatturazione.invoicesTitle')}
        </Button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono">
                {invoice.numero ?? t('fatturazione.draft')}
              </h1>
              <Badge variant="outline" className="text-xs">{typeLabel[invoice.type]}</Badge>
              <Badge variant="outline" className={cn('text-xs', statusColors[invoice.status])}>
                {invoice.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(invoice.data_emissione), 'dd MMMM yyyy', { locale: it })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canMarkPaid && (
              <Button size="sm" className="gap-2 bg-cyan-600 hover:bg-cyan-700" onClick={handleMarkPaid} disabled={actionLoading}>
                <CheckCircle2 className="h-4 w-4" />
                {t('fatturazione.markPaid')}
              </Button>
            )}
            {canSendTS && (
              <Button size="sm" variant="outline" className="gap-2" onClick={handleSendToTS} disabled={actionLoading}>
                <Send className="h-4 w-4" />
                {t('fatturazione.sendToTS')}
              </Button>
            )}
            {invoice.pdf_url ? (
              <>
                <Button size="sm" variant="outline" className="gap-2" asChild>
                  <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    {t('fatturazione.downloadPDF')}
                  </a>
                </Button>
                <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground" onClick={handleGeneratePDF} disabled={pdfLoading}>
                  <RefreshCw className={cn('h-3.5 w-3.5', pdfLoading && 'animate-spin')} />
                  {t('fatturazione.regeneratePDF')}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" className="gap-2" onClick={handleGeneratePDF} disabled={pdfLoading}>
                {pdfLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {pdfLoading ? t('fatturazione.generatingPDF') : t('fatturazione.generatePDF')}
              </Button>
            )}
            {canCreditNote && (
              <Button size="sm" variant="outline" className="gap-2 text-orange-600 border-orange-300" onClick={handleCreateCreditNote}>
                <FileX className="h-4 w-4" />
                {t('fatturazione.createCreditNote')}
              </Button>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2 text-destructive border-destructive/30" disabled={actionLoading}>
                    <FileX className="h-4 w-4" />
                    {t('fatturazione.cancel')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('fatturazione.cancelConfirm')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('fatturazione.cancelConfirmDesc')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="rounded-full bg-destructive hover:bg-destructive/90">
                      {t('fatturazione.cancel')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                {t('fatturazione.paziente')}
              </div>
              <p className="font-semibold text-lg">{invoice.patient?.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{invoice.patient?.email ?? ''}</p>
              {invoice.patient?.codice_fiscale && (
                <p className="text-xs font-mono text-muted-foreground mt-1">CF: {invoice.patient.codice_fiscale}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t('fatturazione.invoiceDetails')}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{t('fatturazione.descrizione')}</p>
              <p className="font-medium">{invoice.descrizione}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              {t('fatturazione.amounts')}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fatturazione.prestazione')}</span>
                <span className="font-mono">€{invoice.importo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contributo ENPAP (2%)</span>
                <span className="font-mono">€{invoice.contributo_enpap.toFixed(2)}</span>
              </div>
              {invoice.marca_bollo > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marca da bollo</span>
                  <span className="font-mono">€{invoice.marca_bollo.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>{t('fatturazione.totale')}</span>
                <span className="font-mono text-cyan-700">€{invoice.totale.toFixed(2)}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t('fatturazione.metodoPagamento')}</p>
                <p className="font-medium mt-0.5">{invoice.metodo_pagamento ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('fatturazione.dataPagamento')}</p>
                <p className="font-medium mt-0.5">
                  {invoice.data_pagamento
                    ? format(new Date(invoice.data_pagamento), 'dd/MM/yyyy', { locale: it })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t('fatturazione.pagato')}</p>
                <div className="mt-0.5">
                  {invoice.pagato ? (
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                      {t('fatturazione.paid')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      {t('fatturazione.unpaid')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t('fatturazione.tsHistory')}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">{t('fatturazione.tsStatus')}</span>
                <TSStatusBadge status={invoice.ts_status} />
              </div>
              {canSendTS && (
                <Button size="sm" variant="outline" className="gap-2 h-7 text-xs" onClick={handleSendToTS} disabled={actionLoading}>
                  <RefreshCw className="h-3 w-3" />
                  {t('fatturazione.retry')}
                </Button>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {invoice.ts_sent_at && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('fatturazione.tsSentAt')}</span>
                  <span>{format(new Date(invoice.ts_sent_at), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                </div>
              )}
              {invoice.ts_protocol && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('fatturazione.tsProtocol')}</span>
                  <span className="font-mono">{invoice.ts_protocol}</span>
                </div>
              )}
              {invoice.ts_error_message && (
                <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{invoice.ts_error_message}</p>
                </div>
              )}
              {invoice.ts_status === 'not_applicable' && (
                <p className="text-xs text-muted-foreground">{t('fatturazione.tsNotApplicable')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {profile?.regime_fiscale === 'forfettario' && invoice.type === 'fattura' && (
          <div className="rounded-xl border border-muted bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('fatturazione.boilerplateLabel')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{FORFETTARIO_BOILERPLATE}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
