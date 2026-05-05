import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Eye,
  EyeOff,
  CircleAlert as AlertCircle,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/mock-data';
import { REGIONI_ITALIANE, formatIban } from '@/lib/regioni-italiane';

const fiscalSchema = z.object({
  nome_cognome: z.string().min(2, 'Nome e cognome obbligatori'),
  partita_iva: z.string().regex(/^\d{11}$/, 'Partita IVA deve avere 11 cifre'),
  codice_fiscale: z.string().length(16, 'Codice fiscale deve avere 16 caratteri'),
  indirizzo_via: z.string().min(2, 'Via obbligatoria'),
  indirizzo_cap: z.string().regex(/^\d{5}$/, 'CAP di 5 cifre'),
  indirizzo_comune: z.string().min(2, 'Comune obbligatorio'),
  indirizzo_provincia: z.string().length(2, 'Sigla provincia (2 lettere)'),
  codice_destinatario: z
    .string()
    .regex(/^[A-Z0-9]{6,7}$/i, 'Codice destinatario non valido')
    .optional()
    .or(z.literal('')),
  pec: z.string().email('PEC non valida'),
  numero_albo: z.string().optional(),
  regione_albo: z.string().optional(),
  regime_fiscale: z.enum(['forfettario', 'ordinario']),
  bollo_a_carico: z.enum(['cliente', 'professionista']),
  iban: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^IT\d{2}[A-Z]\d{22}$/.test(v.replace(/\s+/g, '').toUpperCase()),
      'IBAN italiano non valido (IT + 2 cifre + 1 lettera + 22 cifre)'
    ),
  bic_swift: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v.replace(/\s+/g, '').toUpperCase()),
      'BIC/SWIFT non valido (8 o 11 caratteri)'
    ),
});

type FiscalFormValues = z.infer<typeof fiscalSchema>;

type TabKey = 'fiscale' | 'assicurazione' | 'ts';

export function FatturazionePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const profile = db.profile.get();
  const needsOnboarding = !profile.onboarding_completed;

  const initialTab: TabKey =
    (new URLSearchParams(location.search).get('tab') as TabKey) || 'fiscale';
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== tab) {
      params.set('tab', tab);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [tab, location.pathname, location.search, navigate]);

  return (
    <SettingsLayout
      title={t('fatturazione.title')}
      description={t('fatturazione.subtitle')}
    >
      {needsOnboarding && (
        <Alert className="mb-6 border-cyan-200 bg-cyan-50">
          <AlertCircle className="h-4 w-4 text-cyan-600" />
          <AlertDescription className="text-cyan-800">
            {t('fatturazione.onboardingBanner')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="fiscale">{t('fatturazione.tabFiscale')}</TabsTrigger>
          <TabsTrigger value="assicurazione">{t('fatturazione.tabAssicurazione')}</TabsTrigger>
          <TabsTrigger value="ts">{t('fatturazione.tabTs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="fiscale">
          <FiscaleTab
            t={t}
            toast={toast}
            onCompleteOnboarding={() => navigate('/settings/prestazioni')}
          />
        </TabsContent>

        <TabsContent value="assicurazione">
          <AssicurazioneTab t={t} toast={toast} />
        </TabsContent>

        <TabsContent value="ts">
          <TSTab t={t} toast={toast} />
        </TabsContent>
      </Tabs>
    </SettingsLayout>
  );
}

// ─── Tab 1: Dati fiscali ─────────────────────────────────────────────────────

interface FiscaleTabProps {
  t: (k: string) => string;
  toast: ReturnType<typeof useToast>['toast'];
  onCompleteOnboarding: () => void;
}

function FiscaleTab({ t, toast, onCompleteOnboarding }: FiscaleTabProps) {
  const [saving, setSaving] = useState(false);
  const profile = db.profile.get();
  const wasOnboarding = !profile.onboarding_completed;

  const form = useForm<FiscalFormValues>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      nome_cognome: profile.nome_cognome,
      partita_iva: profile.partita_iva,
      codice_fiscale: profile.codice_fiscale,
      indirizzo_via: profile.indirizzo_via ?? '',
      indirizzo_cap: profile.indirizzo_cap ?? '',
      indirizzo_comune: profile.indirizzo_comune ?? '',
      indirizzo_provincia: profile.indirizzo_provincia ?? '',
      codice_destinatario: profile.codice_destinatario ?? '',
      pec: profile.pec ?? '',
      numero_albo: profile.numero_albo ?? '',
      regione_albo: profile.regione_albo ?? '',
      regime_fiscale: profile.regime_fiscale,
      bollo_a_carico: profile.bollo_a_carico,
      iban: profile.iban ? formatIban(profile.iban) : '',
      bic_swift: profile.bic_swift ?? '',
    },
  });

  function onSubmit(values: FiscalFormValues) {
    setSaving(true);
    const cleanIban = (values.iban ?? '').replace(/\s+/g, '').toUpperCase();
    const cleanBic = (values.bic_swift ?? '').replace(/\s+/g, '').toUpperCase();
    const indirizzoStudio = [
      values.indirizzo_via,
      values.indirizzo_cap,
      values.indirizzo_comune,
      values.indirizzo_provincia ? `(${values.indirizzo_provincia})` : '',
    ]
      .filter(Boolean)
      .join(', ');

    db.profile.update({
      nome_cognome: values.nome_cognome,
      partita_iva: values.partita_iva,
      codice_fiscale: values.codice_fiscale,
      indirizzo_studio: indirizzoStudio,
      indirizzo_via: values.indirizzo_via || null,
      indirizzo_cap: values.indirizzo_cap || null,
      indirizzo_comune: values.indirizzo_comune || null,
      indirizzo_provincia: values.indirizzo_provincia || null,
      codice_destinatario: values.codice_destinatario?.toUpperCase() || null,
      pec: values.pec || null,
      numero_albo: values.numero_albo || null,
      regione_albo: values.regione_albo || null,
      regime_fiscale: values.regime_fiscale,
      bollo_a_carico: values.bollo_a_carico,
      iban: cleanIban || null,
      bic_swift: cleanBic || null,
      onboarding_completed: true,
    });
    toast({
      title: t('fatturazione.profileSaved'),
      description: t('fatturazione.profileSavedDesc'),
    });
    setSaving(false);
    if (wasOnboarding) onCompleteOnboarding();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
      <SettingsCard title={t('fatturazione.identitaFiscale')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="nome_cognome">{t('fatturazione.nomeCognome')}</Label>
            <Input id="nome_cognome" className="mt-1.5" {...form.register('nome_cognome')} />
            {form.formState.errors.nome_cognome && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.nome_cognome.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="partita_iva">{t('fatturazione.partitaIva')}</Label>
            <Input
              id="partita_iva"
              placeholder="12345678901"
              className="mt-1.5 font-mono"
              {...form.register('partita_iva')}
            />
            {form.formState.errors.partita_iva && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.partita_iva.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="codice_fiscale">{t('fatturazione.codiceFiscale')}</Label>
            <Input
              id="codice_fiscale"
              placeholder="RSSMRA80A01H501U"
              className="mt-1.5 font-mono uppercase"
              {...form.register('codice_fiscale', {
                setValueAs: (v: string) => (v ?? '').toUpperCase(),
              })}
            />
            {form.formState.errors.codice_fiscale && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.codice_fiscale.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="indirizzo_via">{t('fatturazione.indirizzoVia')}</Label>
            <Input
              id="indirizzo_via"
              placeholder="Via Roma 1"
              className="mt-1.5"
              {...form.register('indirizzo_via')}
            />
            {form.formState.errors.indirizzo_via && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.indirizzo_via.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="indirizzo_cap">{t('fatturazione.cap')}</Label>
            <Input
              id="indirizzo_cap"
              placeholder="20121"
              maxLength={5}
              className="mt-1.5 font-mono"
              {...form.register('indirizzo_cap')}
            />
            {form.formState.errors.indirizzo_cap && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.indirizzo_cap.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="indirizzo_comune">{t('fatturazione.comune')}</Label>
            <Input
              id="indirizzo_comune"
              placeholder="Milano"
              className="mt-1.5"
              {...form.register('indirizzo_comune')}
            />
            {form.formState.errors.indirizzo_comune && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.indirizzo_comune.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="indirizzo_provincia">{t('fatturazione.provincia')}</Label>
            <Input
              id="indirizzo_provincia"
              placeholder="MI"
              maxLength={2}
              className="mt-1.5 font-mono uppercase"
              {...form.register('indirizzo_provincia', {
                setValueAs: (v: string) => (v ?? '').toUpperCase(),
              })}
            />
            {form.formState.errors.indirizzo_provincia && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.indirizzo_provincia.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="pec">{t('fatturazione.pec')}</Label>
            <Input
              id="pec"
              type="email"
              placeholder="studio@pec.it"
              className="mt-1.5"
              {...form.register('pec')}
            />
            {form.formState.errors.pec && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.pec.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="codice_destinatario">
              {t('fatturazione.codiceDestinatario')}{' '}
              <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Input
              id="codice_destinatario"
              placeholder="0000000"
              maxLength={7}
              className="mt-1.5 font-mono uppercase"
              {...form.register('codice_destinatario', {
                setValueAs: (v: string) => (v ?? '').toUpperCase(),
              })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('fatturazione.codiceDestinatarioDesc')}
            </p>
            {form.formState.errors.codice_destinatario && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.codice_destinatario.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="numero_albo">
              {t('fatturazione.numeroAlbo')}{' '}
              <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Input
              id="numero_albo"
              placeholder="03/12345"
              className="mt-1.5 font-mono"
              {...form.register('numero_albo')}
            />
          </div>

          <div>
            <Label htmlFor="regione_albo">
              {t('fatturazione.regioneAlbo')}{' '}
              <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Select
              value={form.watch('regione_albo') ?? ''}
              onValueChange={(v) => form.setValue('regione_albo', v)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {REGIONI_ITALIANE.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="regime_fiscale">{t('fatturazione.regimeFiscale')}</Label>
            <Select
              value={form.watch('regime_fiscale')}
              onValueChange={(v) =>
                form.setValue('regime_fiscale', v as 'forfettario' | 'ordinario')
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forfettario">Regime Forfettario</SelectItem>
                <SelectItem value="ordinario">Regime Ordinario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bollo_a_carico">{t('fatturazione.bolloACarico')}</Label>
            <Select
              value={form.watch('bollo_a_carico')}
              onValueChange={(v) =>
                form.setValue('bollo_a_carico', v as 'cliente' | 'professionista')
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">{t('fatturazione.bolloCliente')}</SelectItem>
                <SelectItem value="professionista">{t('fatturazione.bolloProfessionista')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('fatturazione.bolloDesc')}</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t('fatturazione.pagamento')}
        description={t('fatturazione.pagamentoDesc')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="iban">{t('fatturazione.iban')}</Label>
            <Input
              id="iban"
              placeholder="IT60 X054 2811 1010 0000 0123 456"
              className="mt-1.5 font-mono tracking-wider"
              value={form.watch('iban') ?? ''}
              onChange={(e) => form.setValue('iban', formatIban(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('fatturazione.ibanDesc')}</p>
            {form.formState.errors.iban && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.iban.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bic_swift">
              {t('fatturazione.bicSwift')}{' '}
              <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Input
              id="bic_swift"
              placeholder="BPMIITMMXXX"
              maxLength={11}
              className="mt-1.5 font-mono uppercase"
              {...form.register('bic_swift', {
                setValueAs: (v: string) => (v ?? '').toUpperCase(),
              })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('fatturazione.bicSwiftDesc')}</p>
            {form.formState.errors.bic_swift && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.bic_swift.message}
              </p>
            )}
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <Save className="h-4 w-4" />
          {saving
            ? t('common.saving')
            : wasOnboarding
            ? t('fatturazione.saveAndContinue')
            : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

// ─── Tab 2: Sistema Tessera Sanitaria ────────────────────────────────────────

interface TabCommonProps {
  t: (k: string) => string;
  toast: ReturnType<typeof useToast>['toast'];
}

// ─── Tab 2: Assicurazione ────────────────────────────────────────────────────

function AssicurazioneTab({ t, toast }: TabCommonProps) {
  const profile = db.profile.get();

  const [polizzaNome, setPolizzaNome] = useState(profile.polizza_nome ?? '');
  const [polizzaNumero, setPolizzaNumero] = useState(profile.polizza_numero ?? '');
  const [polizzaCompagnia, setPolizzaCompagnia] = useState(profile.polizza_compagnia ?? '');
  const [polizzaMassimale, setPolizzaMassimale] = useState<string>(
    profile.polizza_massimale != null ? String(profile.polizza_massimale) : ''
  );
  const [preavvisoUnita, setPreavvisoUnita] = useState<'ore' | 'giorni'>(
    profile.preavviso_unita ?? 'ore'
  );
  const [preavvisoNumero, setPreavvisoNumero] = useState<string>(
    profile.preavviso_numero != null ? String(profile.preavviso_numero) : '0'
  );
  const [preavvisoPerc, setPreavvisoPerc] = useState<string>(
    profile.preavviso_percentuale != null ? String(profile.preavviso_percentuale) : '0'
  );
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!polizzaNome.trim() || !polizzaNumero.trim() || !polizzaCompagnia.trim()) {
      toast({
        title: t('fatturazione.polizzaIncompletaTitle'),
        description: t('fatturazione.polizzaIncompletaDesc'),
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    db.profile.update({
      polizza_nome: polizzaNome.trim(),
      polizza_numero: polizzaNumero.trim(),
      polizza_compagnia: polizzaCompagnia.trim(),
      polizza_massimale: polizzaMassimale ? Number(polizzaMassimale) : null,
      preavviso_unita: preavvisoUnita,
      preavviso_numero: preavvisoNumero ? Number(preavvisoNumero) : null,
      preavviso_percentuale: preavvisoPerc ? Number(preavvisoPerc) : null,
    });
    toast({
      title: t('fatturazione.assicurazioneSavedTitle'),
      description: t('fatturazione.assicurazioneSavedDesc'),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-0">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {t('fatturazione.assicurazioneIntro')}
        </p>
      </div>

      <SettingsCard title={t('fatturazione.polizzaTitle')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="polizza_nome">
              {t('fatturazione.polizzaNome')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="polizza_nome"
              value={polizzaNome}
              onChange={(e) => setPolizzaNome(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="polizza_numero">
              {t('fatturazione.polizzaNumero')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="polizza_numero"
              value={polizzaNumero}
              onChange={(e) => setPolizzaNumero(e.target.value)}
              className="mt-1.5 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="polizza_compagnia">
              {t('fatturazione.polizzaCompagnia')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="polizza_compagnia"
              value={polizzaCompagnia}
              onChange={(e) => setPolizzaCompagnia(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="polizza_massimale">{t('fatturazione.polizzaMassimale')}</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              <Input
                id="polizza_massimale"
                type="number"
                min={0}
                step={1000}
                value={polizzaMassimale}
                onChange={(e) => setPolizzaMassimale(e.target.value)}
                className="pl-7 font-mono"
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t('fatturazione.preavvisoTitle')}
        description={t('fatturazione.preavvisoDesc')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="preavviso_unita">{t('fatturazione.preavvisoUnita')}</Label>
            <Select
              value={preavvisoUnita}
              onValueChange={(v) => setPreavvisoUnita(v as 'ore' | 'giorni')}
            >
              <SelectTrigger id="preavviso_unita" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ore">{t('fatturazione.unitaOre')}</SelectItem>
                <SelectItem value="giorni">{t('fatturazione.unitaGiorni')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="preavviso_numero">{t('fatturazione.preavvisoNumero')}</Label>
            <Input
              id="preavviso_numero"
              type="number"
              min={0}
              step={1}
              value={preavvisoNumero}
              onChange={(e) => setPreavvisoNumero(e.target.value)}
              className="mt-1.5 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="preavviso_perc">{t('fatturazione.preavvisoPerc')}</Label>
            <div className="relative mt-1.5">
              <Input
                id="preavviso_perc"
                type="number"
                min={0}
                max={100}
                step={5}
                value={preavvisoPerc}
                onChange={(e) => setPreavvisoPerc(e.target.value)}
                className="pr-7 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-cyan-600 hover:bg-cyan-700"
        >
          <Save className="h-4 w-4" />
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

// ─── Tab 3: Sistema Tessera Sanitaria ────────────────────────────────────────

function TSTab({ t, toast }: TabCommonProps) {
  const profile = db.profile.get();

  const [tsPassword, setTsPassword] = useState(profile.ts_password ?? '');
  const [tsPincode, setTsPincode] = useState(profile.ts_pincode ?? '');
  const [tsAutoSend, setTsAutoSend] = useState(profile.ts_auto_send);
  const [tsTitolareCf, setTsTitolareCf] = useState(
    profile.ts_titolare_cf ?? profile.codice_fiscale ?? ''
  );
  const [tsIdentificativo, setTsIdentificativo] = useState(profile.ts_identificativo ?? '');
  const [tsStruttura, setTsStruttura] = useState(profile.ts_struttura_sanitaria);
  const [tsDataMinima, setTsDataMinima] = useState(
    profile.ts_data_minima_invio ?? `${new Date().getFullYear()}-01-01`
  );
  const [showPwd, setShowPwd] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleTest() {
    if (!tsPassword.trim() || !tsPincode.trim()) {
      toast({
        title: t('onboardingFatturazione.tsTestMissingTitle'),
        description: t('onboardingFatturazione.tsTestMissingDesc'),
        variant: 'destructive',
      });
      return;
    }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast({
        title: t('onboardingFatturazione.tsTestOkTitle'),
        description: t('onboardingFatturazione.tsTestOkDesc'),
      });
    }, 900);
  }

  function handleSave() {
    setSaving(true);
    db.profile.update({
      ts_password: tsPassword || null,
      ts_pincode: tsPincode || null,
      ts_auto_send: tsAutoSend,
      ts_titolare_cf: tsTitolareCf || null,
      ts_identificativo: tsIdentificativo || null,
      ts_struttura_sanitaria: tsStruttura,
      ts_data_minima_invio: tsDataMinima || null,
    });
    toast({
      title: t('fatturazione.tsSavedTitle'),
      description: t('fatturazione.tsSavedDesc'),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-0">
      <SettingsCard title={t('fatturazione.tessera')} description={t('fatturazione.tesseraDesc')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ts_titolare_cf">{t('onboardingFatturazione.tsTitolareCf')}</Label>
            <Input
              id="ts_titolare_cf"
              value={tsTitolareCf}
              onChange={(e) => setTsTitolareCf(e.target.value.toUpperCase())}
              placeholder={t('onboardingFatturazione.tsTitolareCfPlaceholder')}
              className="mt-1.5 font-mono uppercase"
            />
          </div>

          <div>
            <Label htmlFor="ts_identificativo">{t('onboardingFatturazione.tsIdentificativo')}</Label>
            <Input
              id="ts_identificativo"
              value={tsIdentificativo}
              onChange={(e) => setTsIdentificativo(e.target.value)}
              className="mt-1.5 font-mono"
            />
          </div>

          <div>
            <Label htmlFor="ts_password">{t('fatturazione.tsPassword')}</Label>
            <div className="relative mt-1.5">
              <Input
                id="ts_password"
                type={showPwd ? 'text' : 'password'}
                value={tsPassword}
                onChange={(e) => setTsPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? t('common.hide') : t('common.show')}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="ts_pincode">{t('fatturazione.tsPincode')}</Label>
            <div className="relative mt-1.5">
              <Input
                id="ts_pincode"
                type={showPin ? 'text' : 'password'}
                value={tsPincode}
                onChange={(e) => setTsPincode(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPin ? t('common.hide') : t('common.show')}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="ts_data_minima">{t('onboardingFatturazione.tsDataMinima')}</Label>
            <Input
              id="ts_data_minima"
              type="date"
              value={tsDataMinima}
              onChange={(e) => setTsDataMinima(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('onboardingFatturazione.tsDataMinimaDesc')}
            </p>
          </div>

          <div className="flex items-center gap-3 md:pt-7">
            <Switch checked={tsStruttura} onCheckedChange={setTsStruttura} />
            <div>
              <p className="text-sm font-medium">{t('onboardingFatturazione.tsStrutturaLabel')}</p>
              <p className="text-xs text-muted-foreground">
                {t('onboardingFatturazione.tsStrutturaDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 mt-4 border-t">
          <Switch checked={tsAutoSend} onCheckedChange={setTsAutoSend} />
          <div>
            <Label className="font-medium">{t('fatturazione.tsAutoSend')}</Label>
            <p className="text-xs text-muted-foreground">{t('fatturazione.tsAutoSendDesc')}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 mt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {t('onboardingFatturazione.tsNoCredentials')}{' '}
            <a
              href="https://sistemats1.sanita.finanze.it"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-600 hover:underline"
            >
              sistemats1.sanita.finanze.it
            </a>
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="gap-2 rounded-full"
          >
            <Zap className={`h-4 w-4 ${testing ? 'animate-pulse' : ''}`} />
            {testing
              ? t('onboardingFatturazione.tsTesting')
              : t('onboardingFatturazione.tsTestBtn')}
          </Button>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <Save className="h-4 w-4" />
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
