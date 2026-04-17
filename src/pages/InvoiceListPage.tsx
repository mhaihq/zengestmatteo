import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, SquareCheck as CheckSquare, Send, RefreshCw, FileText, CircleAlert as AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { useToast } from '@/hooks/use-toast';
import { supabase, type Invoice, type ProfessionistaFiscalProfile } from '@/lib/supabase';
import { fetchProfessionistaProfile, fetchAnyProfessionistaProfile, fetchInvoices, updateInvoice } from '@/lib/invoice-service';
import { sendInvoiceToTS, generateTSExportXML } from '@/lib/ts-service';
import { useTranslation } from 'react-i18next';

export function InvoiceListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfessionistaFiscalProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [filterTS, setFilterTS] = useState<'all' | Invoice['ts_status']>('all');
  const [filterType, setFilterType] = useState<'all' | Invoice['type']>('all');

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const prof = user
        ? await fetchProfessionistaProfile(user.id)
        : await fetchAnyProfessionistaProfile();
      setProfile(prof);
      if (!prof) { setLoading(false); return; }

      const data = await fetchInvoices(prof.id);
      setInvoices(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let result = invoices;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((inv) =>
        inv.patient?.name?.toLowerCase().includes(q) ||
        inv.numero?.toLowerCase().includes(q) ||
        inv.descrizione.toLowerCase().includes(q)
      );
    }
    if (filterPaid === 'paid') result = result.filter((inv) => inv.pagato);
    if (filterPaid === 'unpaid') result = result.filter((inv) => !inv.pagato);
    if (filterTS !== 'all') result = result.filter((inv) => inv.ts_status === filterTS);
    if (filterType !== 'all') result = result.filter((inv) => inv.type === filterType);
    setFiltered(result);
    setSelectedIds(new Set());
  }, [search, filterPaid, filterTS, filterType, invoices]);

  const handleSelectId = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map((i) => i.id)) : new Set());
  };

  const handleBulkMarkPaid = async () => {
    setBulkLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await Promise.all(
        [...selectedIds].map((id) =>
          updateInvoice(id, { pagato: true, data_pagamento: today, ts_eligible: true })
        )
      );
      await loadData();
      setSelectedIds(new Set());
      toast({ title: t('fatturazione.markedPaid') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSendTS = async () => {
    setBulkLoading(true);
    let ok = 0;
    let fail = 0;
    for (const id of selectedIds) {
      const result = await sendInvoiceToTS(id);
      result.success ? ok++ : fail++;
    }
    await loadData();
    setSelectedIds(new Set());
    setBulkLoading(false);
    toast({ title: `TS: ${ok} inviate${fail > 0 ? `, ${fail} errori` : ''}` });
  };

  const handleExportXML = () => {
    const toExport = invoices.filter(
      (inv) => inv.type === 'fattura' && inv.pagato && inv.numero
    );
    const patientsMap = Object.fromEntries(
      toExport.map((inv) => [
        inv.patient_id,
        {
          id: inv.patient_id,
          codice_fiscale: inv.patient?.codice_fiscale ?? null,
          ts_opposizione: false,
          is_foreign: false,
        },
      ])
    );
    const xml = generateTSExportXML(toExport, patientsMap);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tessera-sanitaria-${new Date().getFullYear()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.pagato).length,
    pending_ts: invoices.filter((i) => i.ts_status === 'pending' && i.ts_eligible).length,
    revenue: invoices.filter((i) => i.pagato).reduce((acc, i) => acc + i.totale, 0),
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('fatturazione.invoicesTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('fatturazione.invoicesSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportXML}>
              <Download className="h-4 w-4" />
              {t('fatturazione.exportXML')}
            </Button>
            <Button size="sm" className="gap-2 bg-cyan-600 hover:bg-cyan-700" onClick={() => navigate('/fatture/new')}>
              <Plus className="h-4 w-4" />
              {t('fatturazione.newInvoice')}
            </Button>
          </div>
        </div>

        {!profile && !loading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('fatturazione.profileRequired')}{' '}
              <button
                className="underline font-medium"
                onClick={() => navigate('/settings/fatturazione')}
              >
                {t('fatturazione.configureProfile')}
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('fatturazione.statTotal'), value: stats.total, suffix: '' },
            { label: t('fatturazione.statPaid'), value: stats.paid, suffix: '' },
            { label: t('fatturazione.statTsPending'), value: stats.pending_ts, suffix: '' },
            { label: t('fatturazione.statRevenue'), value: `€${stats.revenue.toFixed(2)}`, suffix: '' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('fatturazione.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="md:w-[160px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('fatturazione.allTypes')}</SelectItem>
              <SelectItem value="fattura">{t('fatturazione.typeF')}</SelectItem>
              <SelectItem value="proforma">{t('fatturazione.typeP')}</SelectItem>
              <SelectItem value="nota_di_credito">{t('fatturazione.typeNC')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPaid} onValueChange={(v) => setFilterPaid(v as typeof filterPaid)}>
            <SelectTrigger className="md:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('fatturazione.allPayments')}</SelectItem>
              <SelectItem value="paid">{t('fatturazione.paid')}</SelectItem>
              <SelectItem value="unpaid">{t('fatturazione.unpaid')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTS} onValueChange={(v) => setFilterTS(v as typeof filterTS)}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('fatturazione.allTS')}</SelectItem>
              <SelectItem value="pending">{t('fatturazione.tsPending')}</SelectItem>
              <SelectItem value="sent">{t('fatturazione.tsSent')}</SelectItem>
              <SelectItem value="accepted">{t('fatturazione.tsAccepted')}</SelectItem>
              <SelectItem value="error">{t('fatturazione.tsError')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 border border-cyan-200">
            <Badge className="bg-cyan-600">{selectedIds.size} {t('fatturazione.selected')}</Badge>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkMarkPaid} disabled={bulkLoading}>
                <CheckSquare className="h-4 w-4" />
                {t('fatturazione.markPaid')}
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkSendTS} disabled={bulkLoading}>
                <Send className="h-4 w-4" />
                {t('fatturazione.sendToTS')}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <InvoiceTable
            invoices={filtered}
            showPatient
            selectedIds={selectedIds}
            onSelectId={handleSelectId}
            onSelectAll={handleSelectAll}
          />
        )}

        {!loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {filtered.length} {t('fatturazione.of')} {invoices.length} {t('fatturazione.invoices')}
          </div>
        )}
      </motion.div>
    </div>
  );
}
