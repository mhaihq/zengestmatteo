import type { PrestazioneCategoria } from './supabase';

export interface CategoriaOption {
  value: PrestazioneCategoria;
  labelKey: string;
}

export const PRESTAZIONE_CATEGORIE: CategoriaOption[] = [
  { value: 'abilitazione_riabilitazione', labelKey: 'prestazioneCategorie.abilitazione_riabilitazione' },
  { value: 'arbitrato', labelKey: 'prestazioneCategorie.arbitrato' },
  { value: 'consulenza_sostegno', labelKey: 'prestazioneCategorie.consulenza_sostegno' },
  { value: 'diagnosi_psicologica', labelKey: 'prestazioneCategorie.diagnosi_psicologica' },
  { value: 'docenza', labelKey: 'prestazioneCategorie.docenza' },
  { value: 'formazione_supervisione', labelKey: 'prestazioneCategorie.formazione_supervisione' },
  { value: 'intervento_clinico', labelKey: 'prestazioneCategorie.intervento_clinico' },
  { value: 'mediazione_familiare', labelKey: 'prestazioneCategorie.mediazione_familiare' },
  { value: 'neuropsicologia', labelKey: 'prestazioneCategorie.neuropsicologia' },
  { value: 'perizia_ctu_ctp', labelKey: 'prestazioneCategorie.perizia_ctu_ctp' },
  { value: 'prevenzione_promozione', labelKey: 'prestazioneCategorie.prevenzione_promozione' },
  { value: 'psicologia_lavoro', labelKey: 'prestazioneCategorie.psicologia_lavoro' },
  { value: 'psicoterapia', labelKey: 'prestazioneCategorie.psicoterapia' },
  { value: 'ricerca_scientifica', labelKey: 'prestazioneCategorie.ricerca_scientifica' },
  { value: 'altro', labelKey: 'prestazioneCategorie.altro' },
];
