import { Trash2, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import type { Prestazione, PrestazioneCategoria } from '@/lib/supabase';
import { PRESTAZIONE_CATEGORIE } from '@/lib/prestazione-categorie';

interface PrestazioneEditorCardProps {
  prestazione: Prestazione;
  onChange: (patch: Partial<Prestazione>) => void;
  onDelete: () => void;
  onMakeDefault: () => void;
  canDelete: boolean;
}

export function PrestazioneEditorCard({
  prestazione,
  onChange,
  onDelete,
  onMakeDefault,
  canDelete,
}: PrestazioneEditorCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={`p-4 md:p-5 transition-all ${
        prestazione.predefinita ? 'border-cyan-500 ring-1 ring-cyan-500/20' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={onMakeDefault}
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 transition-colors ${
            prestazione.predefinita
              ? 'bg-cyan-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          <Star
            className={`h-3 w-3 ${prestazione.predefinita ? 'fill-white' : ''}`}
          />
          {prestazione.predefinita
            ? t('onboardingFatturazione.predefinitaActive')
            : t('onboardingFatturazione.predefinitaMakeDefault')}
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={!canDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={t('common.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <Label className="text-xs text-muted-foreground">
            {t('onboardingFatturazione.prestazioneNome')}
          </Label>
          <Input
            value={prestazione.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            placeholder={t('onboardingFatturazione.prestazioneNomePlaceholder')}
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-3">
          <Label className="text-xs text-muted-foreground">
            {t('onboardingFatturazione.prestazionePrezzo')}
          </Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
            <Input
              type="number"
              min={0}
              step={1}
              value={prestazione.prezzo}
              onChange={(e) => onChange({ prezzo: Number(e.target.value) || 0 })}
              className="pl-7"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <Label className="text-xs text-muted-foreground">
            {t('onboardingFatturazione.prestazioneDurata')}
          </Label>
          <Input
            type="number"
            min={0}
            step={5}
            value={prestazione.durata_minuti ?? ''}
            onChange={(e) =>
              onChange({
                durata_minuti: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder="50"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-12">
          <Label className="text-xs text-muted-foreground">
            {t('onboardingFatturazione.prestazioneCategoria')}
          </Label>
          <Select
            value={prestazione.categoria}
            onValueChange={(v) => onChange({ categoria: v as PrestazioneCategoria })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESTAZIONE_CATEGORIE.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t">
        <label className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/40">
          <div>
            <p className="text-sm font-medium">
              {t('onboardingFatturazione.prestazioneSanitaria')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('onboardingFatturazione.prestazioneSanitariaDesc')}
            </p>
          </div>
          <Switch
            checked={prestazione.is_sanitaria}
            onCheckedChange={(v) => onChange({ is_sanitaria: v })}
          />
        </label>

        <label className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/40">
          <div>
            <p className="text-sm font-medium">
              {t('onboardingFatturazione.prestazioneEnpap')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('onboardingFatturazione.prestazioneEnpapDesc')}
            </p>
          </div>
          <Switch
            checked={prestazione.applica_enpap}
            onCheckedChange={(v) => onChange({ applica_enpap: v })}
          />
        </label>
      </div>
    </Card>
  );
}
