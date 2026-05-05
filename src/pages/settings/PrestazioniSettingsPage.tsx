import { useState } from 'react';
import { Save, Plus, CircleCheck as CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/mock-data';
import type { Prestazione } from '@/lib/supabase';
import { PrestazioneEditorCard } from '@/components/billing/PrestazioneEditorCard';

function newLocalId() {
  return 'new-' + Math.random().toString(36).slice(2, 10);
}

export function PrestazioniSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [prestazioni, setPrestazioni] = useState<Prestazione[]>(() => db.prestazioni.list());
  const [dirty, setDirty] = useState(false);

  function addPrestazione() {
    setPrestazioni((prev) => [
      ...prev,
      {
        id: newLocalId(),
        professionista_id: 'prof-1',
        nome: '',
        categoria: 'altro',
        prezzo: 0,
        is_sanitaria: true,
        applica_enpap: true,
        predefinita: prev.length === 0,
        durata_minuti: null,
        attiva: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    setDirty(true);
  }

  function updatePrestazione(id: string, patch: Partial<Prestazione>) {
    setPrestazioni((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirty(true);
  }

  function deletePrestazione(id: string) {
    setPrestazioni((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const wasDefault = prev.find((p) => p.id === id)?.predefinita;
      if (wasDefault && next.length > 0 && !next.some((p) => p.predefinita)) {
        next[0] = { ...next[0], predefinita: true };
      }
      return next;
    });
    setDirty(true);
  }

  function makeDefault(id: string) {
    setPrestazioni((prev) => prev.map((p) => ({ ...p, predefinita: p.id === id })));
    setDirty(true);
  }

  function handleSave() {
    const valid = prestazioni.filter((p) => p.nome.trim() !== '' && p.prezzo > 0);
    if (valid.length !== prestazioni.length) {
      toast({
        title: t('fatturazione.prestazioniInvalidTitle'),
        description: t('fatturazione.prestazioniInvalidDesc'),
        variant: 'destructive',
      });
      return;
    }
    const normalized = valid.map((p) => ({
      ...p,
      id: p.id.startsWith('new-') ? Math.random().toString(36).slice(2, 10) : p.id,
    }));
    db.prestazioni.replaceAll(normalized);
    setPrestazioni(db.prestazioni.list());
    setDirty(false);
    toast({
      title: t('fatturazione.prestazioniSavedTitle'),
      description: t('fatturazione.prestazioniSavedDesc'),
    });
  }

  return (
    <SettingsLayout
      title={t('prestazioniPage.title')}
      description={t('prestazioniPage.subtitle')}
    >
      <div className="space-y-4">
        {prestazioni.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t('fatturazione.prestazioniEmpty')}
            </p>
            <Button onClick={addPrestazione} className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              {t('onboardingFatturazione.addPrestazione')}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {prestazioni.map((p) => (
                <PrestazioneEditorCard
                  key={p.id}
                  prestazione={p}
                  onChange={(patch) => updatePrestazione(p.id, patch)}
                  onDelete={() => deletePrestazione(p.id)}
                  onMakeDefault={() => makeDefault(p.id)}
                  canDelete={prestazioni.length > 1}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addPrestazione}
              className="w-full gap-2 rounded-full"
            >
              <Plus className="h-4 w-4" />
              {t('onboardingFatturazione.addPrestazione')}
            </Button>
          </>
        )}

        <Alert className="bg-cyan-50 border-cyan-200">
          <CheckCircle2 className="h-4 w-4 text-cyan-600" />
          <AlertDescription className="text-cyan-800 text-sm">
            {t('onboardingFatturazione.prestazioniNote')}
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!dirty}
            className="gap-2 bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
