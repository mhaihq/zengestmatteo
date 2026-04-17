import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, Search, TriangleAlert as AlertTriangle, Info, Calculator, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase, type ProfessionistaFiscalProfile, type ClientWithFiscal } from '@/lib/supabase';
import { fetchProfessionistaProfile, fetchAnyProfessionistaProfile, createInvoice } from '@/lib/invoice-service';
import { calculateInvoice, validateCodiceFiscale, FORFETTARIO_BOILERPLATE } from '@/lib/invoice-rules';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const invoiceSchema = z.object({
  type: z.enum(['fattura', 'proforma', 'nota_di_credito']),
  patient_id: z.string().uuid('Seleziona un paziente'),
  descrizione: z.string().min(3, 'Descrizione obbligatoria'),
  importo: z.number({ invalid_type_error: 'Importo obbligatorio' }).positive('Importo deve essere > 0'),
  metodo_pagamento: z.enum(['bonifico', 'carta', 'contanti']).optional(),
  data_pagamento: z.string().optional(),
  pagato: z.boolean(),
  data_emissione: z.string(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function NewInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfessionistaFiscalProfile | null>(null);
  const [patients, setPatients] = useState<ClientWithFiscal[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ClientWithFiscal | null>(null);
  const [saving, setSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [emissDateOpen, setEmissDateOpen] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: 'fattura',
      patient_id: searchParams.get('patient_id') ?? '',
      descrizione: 'Prestazione psicologica',
      importo: 0,
      pagato: false,
      data_emissione: new Date().toISOString().split('T')[0],
    },
  });

  const watchImporto = form.watch('importo');
  const watchPagato = form.watch('pagato');
  const watchDataEmissione = form.watch('data_emissione');
  const watchDataPagamento = form.watch('data_pagamento');

  const calc = profile && watchImporto > 0
    ? calculateInvoice(profile, watchImporto)
    : null;

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const prof = user
        ? await fetchProfessionistaProfile(user.id)
        : await fetchAnyProfessionistaProfile();
      setProfile(prof);

      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      setPatients((data as ClientWithFiscal[]) ?? []);

      const prePatientId = searchParams.get('patient_id');
      if (prePatientId && data) {
        const found = (data as ClientWithFiscal[]).find((p) => p.id === prePatientId);
        if (found) {
          setSelectedPatient(found);
          form.setValue('patient_id', found.id);
          form.setValue('importo', found.tariffa_default ?? 0);
          if (found.metodo_pagamento) {
            form.setValue('metodo_pagamento', found.metodo_pagamento);
          }
        }
      }
    }
    init();
  }, [form, searchParams]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleSelectPatient = (patient: ClientWithFiscal) => {
    setSelectedPatient(patient);
    form.setValue('patient_id', patient.id);
    form.setValue('importo', patient.tariffa_default ?? 0);
    if (patient.metodo_pagamento) {
      form.setValue('metodo_pagamento', patient.metodo_pagamento);
    }
    setPatientOpen(false);
    setPatientSearch('');
  };

  const onSubmit = useCallback(async (values: InvoiceFormValues) => {
    if (!profile) {
      toast({ title: t('fatturazione.profileRequired'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const invoice = await createInvoice({
        type: values.type,
        professionistaId: profile.id,
        patientId: values.patient_id,
        descrizione: values.descrizione,
        importo: values.importo,
        metodo_pagamento: values.metodo_pagamento,
        data_pagamento: values.data_pagamento,
        pagato: values.pagato,
        data_emissione: values.data_emissione,
        professionista: profile,
      });
      toast({ title: t('fatturazione.invoiceCreated'), description: invoice.numero ?? t('fatturazione.draft') });
      navigate(`/fatture/${invoice.id}`);
    } catch (e: unknown) {
      toast({
        title: t('common.error'),
        description: e instanceof Error ? e.message : t('common.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [profile, navigate, toast, t]);

  const cfValid = selectedPatient?.codice_fiscale
    ? validateCodiceFiscale(selectedPatient.codice_fiscale)
    : null;

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 pb-20 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Button variant="ghost" className="gap-2 -ml-2 rounded-full" onClick={() => navigate('/fatture')}>
          <ChevronLeft className="h-4 w-4" />
          {t('fatturazione.invoicesTitle')}
        </Button>

        <div>
          <h1 className="text-2xl font-bold">{t('fatturazione.newInvoice')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('fatturazione.newInvoiceDesc')}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <h2 className="font-semibold text-base">{t('fatturazione.invoiceDetails')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('fatturazione.type')}</Label>
                  <Controller
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fattura">{t('fatturazione.typeF')}</SelectItem>
                          <SelectItem value="proforma">{t('fatturazione.typeP')}</SelectItem>
                          <SelectItem value="nota_di_credito">{t('fatturazione.typeNC')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label>{t('fatturazione.dataEmissione')}</Label>
                  <Popover open={emissDateOpen} onOpenChange={setEmissDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full mt-1.5 justify-start font-normal', !watchDataEmissione && 'text-muted-foreground')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {watchDataEmissione ? format(new Date(watchDataEmissione), 'dd/MM/yyyy', { locale: it }) : t('fatturazione.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={watchDataEmissione ? new Date(watchDataEmissione) : undefined}
                        onSelect={(d) => {
                          if (d) form.setValue('data_emissione', d.toISOString().split('T')[0]);
                          setEmissDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>{t('fatturazione.paziente')}</Label>
                <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full mt-1.5 justify-start font-normal', !selectedPatient && 'text-muted-foreground')}>
                      {selectedPatient ? selectedPatient.name : t('fatturazione.selectPatient')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('fatturazione.searchPatient')}
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-6">{t('clients.noClients')}</p>
                      ) : (
                        filteredPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 text-left"
                            onClick={() => handleSelectPatient(p)}
                          >
                            <div>
                              <span className="font-medium">{p.name}</span>
                              {p.email && <span className="text-muted-foreground ml-2 text-xs">{p.email}</span>}
                            </div>
                            {!p.codice_fiscale && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                                CF mancante
                              </Badge>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {form.formState.errors.patient_id && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.patient_id.message}</p>
                )}
              </div>

              {selectedPatient && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border p-3 bg-muted/20 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">CF paziente:</span>
                      <span className="text-xs font-mono">{selectedPatient.codice_fiscale ?? '—'}</span>
                      {selectedPatient.codice_fiscale && (
                        cfValid ? (
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">Valido</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 text-[10px]">Non valido</Badge>
                        )
                      )}
                    </div>
                    {!selectedPatient.codice_fiscale && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">{t('fatturazione.cfMissingWarning')}</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              <div>
                <Label htmlFor="descrizione">{t('fatturazione.descrizione')}</Label>
                <Textarea
                  id="descrizione"
                  className="mt-1.5 resize-none"
                  rows={2}
                  {...form.register('descrizione')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <h2 className="font-semibold text-base">{t('fatturazione.amounts')}</h2>

              <div>
                <Label htmlFor="importo">{t('fatturazione.importo')}</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
                  <Input
                    id="importo"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-8 font-mono"
                    {...form.register('importo', { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.importo && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.importo.message}</p>
                )}
              </div>

              <AnimatePresence>
                {calc && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border bg-muted/20 overflow-hidden"
                  >
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-medium">{t('fatturazione.calcBreakdown')}</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('fatturazione.prestazione')}</span>
                          <span className="font-mono">€{calc.importo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Contributo ENPAP (2%)
                          </span>
                          <span className="font-mono text-amber-700">+€{calc.contributo_enpap.toFixed(2)}</span>
                        </div>
                        {calc.marca_bollo > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Marca da bollo {calc.bollo_charged_to_client ? `(${t('fatturazione.bolloCliente')})` : `(${t('fatturazione.bolloProfessionista')})`}
                            </span>
                            <span className="font-mono text-amber-700">+€{calc.marca_bollo.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>{t('fatturazione.totale')}</span>
                          <span className="font-mono text-cyan-700">€{calc.totale.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6 space-y-5">
              <h2 className="font-semibold text-base">{t('fatturazione.paymentInfo')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('fatturazione.metodoPagamento')}</Label>
                  <Controller
                    name="metodo_pagamento"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder={t('fatturazione.selectMetodo')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bonifico">Bonifico bancario</SelectItem>
                          <SelectItem value="carta">Carta di credito/debito</SelectItem>
                          <SelectItem value="contanti">Contanti</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label>{t('fatturazione.dataPagamento')}</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full mt-1.5 justify-start font-normal', !watchDataPagamento && 'text-muted-foreground')} disabled={!watchPagato}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {watchDataPagamento ? format(new Date(watchDataPagamento), 'dd/MM/yyyy', { locale: it }) : t('fatturazione.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={watchDataPagamento ? new Date(watchDataPagamento) : undefined}
                        onSelect={(d) => {
                          if (d) form.setValue('data_pagamento', d.toISOString().split('T')[0]);
                          setDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Controller
                  name="pagato"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="pagato"
                      checked={field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v);
                        if (!v) form.setValue('data_pagamento', undefined);
                        else form.setValue('data_pagamento', new Date().toISOString().split('T')[0]);
                      }}
                    />
                  )}
                />
                <Label htmlFor="pagato" className="cursor-pointer font-medium">{t('fatturazione.markedPaid')}</Label>
              </div>
            </CardContent>
          </Card>

          {profile?.regime_fiscale === 'forfettario' && (
            <div className="rounded-xl border border-muted bg-muted/20 p-4">
              <div className="flex items-start gap-2 mb-2">
                <Info className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">{t('fatturazione.boilerplateLabel')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{FORFETTARIO_BOILERPLATE}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/fatture')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !profile} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
              {saving ? t('common.saving') : t('fatturazione.createInvoice')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
