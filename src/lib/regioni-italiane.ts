export const REGIONI_ITALIANE = [
  'Abruzzo',
  'Basilicata',
  'Calabria',
  'Campania',
  'Emilia-Romagna',
  'Friuli-Venezia Giulia',
  'Lazio',
  'Liguria',
  'Lombardia',
  'Marche',
  'Molise',
  'Piemonte',
  'Puglia',
  'Sardegna',
  'Sicilia',
  'Toscana',
  'Trentino-Alto Adige',
  'Umbria',
  "Valle d'Aosta",
  'Veneto',
] as const;

export type RegioneItaliana = (typeof REGIONI_ITALIANE)[number];

export function formatIban(value: string): string {
  const clean = value.replace(/\s+/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') ?? '';
}

export function isValidIban(value: string): boolean {
  const clean = value.replace(/\s+/g, '').toUpperCase();
  return /^IT\d{2}[A-Z]\d{22}$/.test(clean);
}

export function isValidBic(value: string): boolean {
  if (!value) return true;
  const clean = value.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean);
}
