import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Eye, EyeOff, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { fetchProfessionistaProfile, upsertProfessionistaProfile } from '@/lib/invoice-service';
import { useTranslation } from 'react-i18next';

const fiscalSchema = z.object({
  nome_cognome: z.string().min(2, 'Nome e cognome obbligatori'),
  partita_iva: z.string().regex(/^\d{11}$/, 'Partita IVA deve avere 11 cifre'),
  codice_fiscale: z.string().length(16, 'Codice fiscale deve avere 16 caratteri'),
  indirizzo_studio: z.string().min(5, 'Indirizzo obbligatorio'),
  regime_fiscale: z.enum(['forfettario', 'ordinario']),
  bollo_a_carico: z.enum(['cliente', 'professionista']),
  iban: z.string().optional(),
  pec: z.string().email('PEC non valida').optional().or(z.literal('')),
  ts_password: z.string().optional(),
  ts_pincode: z.string().optional(),
  ts_auto_send: z.boolean(),
});

type FiscalFormValues = z.infer<typeof fiscalSchema>;

export function FatturazionePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPincode, setShowPincode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);

  const form = useForm<FiscalFormValues>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      nome_cognome: '',
      partita_iva: '',
      codice_fiscale: '',
      indirizzo_studio: '',
      regime_fiscale: 'forfettario',
      bollo_a_carico: 'cliente',
      iban: '',
      pec: '',
      ts_password: '',
      ts_pincode: '',
      ts_auto_send: false,
    },
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      try {
        const profile = await fetchProfessionistaProfile(user.id);
        if (profile) {
          setProfileExists(true);
          form.reset({
            nome_cognome: profile.nome_cognome,
            partita_iva: profile.partita_iva,
            codice_fiscale: profile.codice_fiscale,
            indirizzo_studio: profile.indirizzo_studio,
            regime_fiscale: profile.regime_fiscale,
            bollo_a_carico: profile.bollo_a_carico,
            iban: profile.iban ?? '',
            pec: profile.pec ?? '',
            ts_password: profile.ts_password ?? '',
            ts_pincode: profile.ts_pincode ?? '',
            ts_auto_send: profile.ts_auto_send,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [form]);

  async function onSubmit(values: FiscalFormValues) {
    if (!userId) return;
    setSaving(true);
    try {
      await upsertProfessionistaProfile(userId, {
        nome_cognome: values.nome_cognome,
        partita_iva: values.partita_iva,
        codice_fiscale: values.codice_fiscale,
        indirizzo_studio: values.indirizzo_studio,
        regime_fiscale: values.regime_fiscale,
        bollo_a_carico: values.bollo_a_carico,
        iban: values.iban || null,
        pec: values.pec || null,
        ts_password: values.ts_password || null,
        ts_pincode: values.ts_pincode || null,
        ts_auto_send: values.ts_auto_send,
      });
      setProfileExists(true);
      toast({ title: t('fatturazione.profileSaved'), description: t('fatturazione.profileSavedDesc') });
    } catch {
      toast({ title: t('common.error'), description: t('fatturazione.saveError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout title={t('fatturazione.title')}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title={t('fatturazione.title')} description={t('fatturazione.subtitle')}>
      {!profileExists && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('fatturazione.profileMissing')}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
        <SettingsCard title={t('fatturazione.identitaFiscale')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome_cognome">{t('fatturazione.nomeCognome')}</Label>
              <Input id="nome_cognome" className="mt-1.5" {...form.register('nome_cognome')} />
              {form.formState.errors.nome_cognome && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.nome_cognome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="partita_iva">{t('fatturazione.partitaIva')}</Label>
              <Input id="partita_iva" placeholder="12345678901" className="mt-1.5 font-mono" {...form.register('partita_iva')} />
              {form.formState.errors.partita_iva && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.partita_iva.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="codice_fiscale">{t('fatturazione.codiceFiscale')}</Label>
              <Input
                id="codice_fiscale"
                placeholder="RSSMRA80A01H501U"
                className="mt-1.5 font-mono uppercase"
                {...form.register('codice_fiscale', { setValueAs: (v: string) => v.toUpperCase() })}
              />
              {form.formState.errors.codice_fiscale && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.codice_fiscale.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="indirizzo_studio">{t('fatturazione.indirizzoStudio')}</Label>
              <Input id="indirizzo_studio" placeholder="Via Roma 1, 20100 Milano (MI)" className="mt-1.5" {...form.register('indirizzo_studio')} />
              {form.formState.errors.indirizzo_studio && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.indirizzo_studio.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="regime_fiscale">{t('fatturazione.regimeFiscale')}</Label>
              <Select value={form.watch('regime_fiscale')} onValueChange={(v) => form.setValue('regime_fiscale', v as 'forfettario' | 'ordinario')}>
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
              <Select value={form.watch('bollo_a_carico')} onValueChange={(v) => form.setValue('bollo_a_carico', v as 'cliente' | 'professionista')}>
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

        <SettingsCard title={t('fatturazione.pagamento')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="iban">{t('fatturazione.iban')}</Label>
              <Input id="iban" placeholder="IT60X0542811101000000123456" className="mt-1.5 font-mono" {...form.register('iban')} />
            </div>
            <div>
              <Label htmlFor="pec">{t('fatturazione.pec')}</Label>
              <Input id="pec" type="email" placeholder="studio@pec.it" className="mt-1.5" {...form.register('pec')} />
              {form.formState.errors.pec && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.pec.message}</p>
              )}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title={t('fatturazione.tessera')} description={t('fatturazione.tesseraDesc')}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ts_password">{t('fatturazione.tsPassword')}</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="ts_password"
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    {...form.register('ts_password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="ts_pincode">{t('fatturazione.tsPincode')}</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="ts_pincode"
                    type={showPincode ? 'text' : 'password'}
                    className="pr-10"
                    {...form.register('ts_pincode')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPincode(!showPincode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPincode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch
                id="ts_auto_send"
                checked={form.watch('ts_auto_send')}
                onCheckedChange={(v) => form.setValue('ts_auto_send', v)}
              />
              <div>
                <Label htmlFor="ts_auto_send" className="font-medium">{t('fatturazione.tsAutoSend')}</Label>
                <p className="text-xs text-muted-foreground">{t('fatturazione.tsAutoSendDesc')}</p>
              </div>
            </div>

            <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-cyan-700">{t('fatturazione.tsNote')}</p>
              </div>
            </div>
          </div>
        </SettingsCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
            <Save className="h-4 w-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </SettingsLayout>
  );
}
