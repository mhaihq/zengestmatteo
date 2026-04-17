import type { ProfessionistaFiscalProfile, ClientWithFiscal, Invoice } from './supabase';

export const FORFETTARIO_BOILERPLATE = `Operazione effettuata ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 – Regime Forfettario.
Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell'articolo 1, comma 67, L. n. 190/2014.
Imposta di bollo da 2 euro assolta sull'originale per importi maggiori di 77,47 euro.`;

export const CODICE_ATECO = '86.93.00';
export const ENPAP_RATE = 0.02;
export const MARCA_BOLLO_AMOUNT = 2.0;
export const MARCA_BOLLO_THRESHOLD = 77.47;

export interface InvoiceCalculation {
  importo: number;
  contributo_enpap: number;
  subtotal: number;
  marca_bollo: number;
  totale: number;
  bollo_charged_to_client: boolean;
}

export function calculateInvoice(
  professionista: Pick<ProfessionistaFiscalProfile, 'bollo_a_carico'>,
  amount: number
): InvoiceCalculation {
  const importo = Math.round(amount * 100) / 100;
  const contributo_enpap = Math.round(importo * ENPAP_RATE * 100) / 100;
  const subtotal = Math.round((importo + contributo_enpap) * 100) / 100;
  const bolla_needed = subtotal > MARCA_BOLLO_THRESHOLD;
  const bollo_charged_to_client = bolla_needed && professionista.bollo_a_carico === 'cliente';
  const marca_bollo = bollo_charged_to_client ? MARCA_BOLLO_AMOUNT : 0;
  const totale = Math.round((subtotal + marca_bollo) * 100) / 100;

  return {
    importo,
    contributo_enpap,
    subtotal,
    marca_bollo,
    totale,
    bollo_charged_to_client,
  };
}

export function isEligibleForTS(
  invoice: Pick<Invoice, 'type' | 'pagato' | 'data_pagamento'>
): boolean {
  if (invoice.type !== 'fattura') return false;
  if (!invoice.pagato) return false;
  if (!invoice.data_pagamento) return false;
  return true;
}

export interface TSPayload {
  cfCittadino: string;
  dataDoc: string;
  numDoc: string;
  tipoDoc: 'F';
  tipoSpesa: 'SP';
  importo: number;
  flagPagamento: 'SI' | 'MP';
  flagOpposizione: '0' | '1';
}

export function buildTSPayload(
  invoice: Pick<Invoice, 'data_emissione' | 'numero' | 'totale' | 'metodo_pagamento'>,
  patient: Pick<ClientWithFiscal, 'codice_fiscale' | 'ts_opposizione' | 'is_foreign'>
): TSPayload {
  const shouldOmitCF = patient.ts_opposizione || patient.is_foreign;
  return {
    cfCittadino: shouldOmitCF ? '' : (patient.codice_fiscale ?? ''),
    dataDoc: invoice.data_emissione,
    numDoc: invoice.numero ?? '',
    tipoDoc: 'F',
    tipoSpesa: 'SP',
    importo: invoice.totale,
    flagPagamento: invoice.metodo_pagamento === 'contanti' ? 'SI' : 'MP',
    flagOpposizione: shouldOmitCF ? '1' : '0',
  };
}

export function validateCodiceFiscale(cf: string): boolean {
  if (!cf || cf.length !== 16) return false;
  const upper = cf.toUpperCase();
  if (!/^[A-Z0-9]{16}$/.test(upper)) return false;

  const oddMap: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17,
    '8': 19, '9': 21, 'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13,
    'G': 15, 'H': 17, 'I': 19, 'J': 21, 'K': 2, 'L': 4, 'M': 18, 'N': 20,
    'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14, 'U': 16, 'V': 10,
    'W': 22, 'X': 25, 'Y': 24, 'Z': 23,
  };
  const evenMap: Record<string, number> = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
    'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13,
    'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21,
    'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
  };

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = upper[i];
    sum += (i % 2 === 0) ? oddMap[ch] : evenMap[ch];
  }

  const expectedCheck = String.fromCharCode(65 + (sum % 26));
  return upper[15] === expectedCheck;
}

export function formatInvoiceNumber(num: number, year: number): string {
  return `${num}/${year}`;
}
