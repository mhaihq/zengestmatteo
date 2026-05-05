/*
  # Seed Dummy Clients (Pazienti)

  Inserts 15 realistic Italian patient profiles for development/testing.
  Covers a variety of demographics, billing setups, and edge cases:
  - Mix of genders, ages, session types, and payment methods
  - Some with codice_fiscale, some without (foreign patients)
  - Some with ts_opposizione = true (opted out of Tessera Sanitaria reporting)
  - Varying tariffa_default values typical for Italian private practice

  Safe to run multiple times (skips existing records by name + dob match).
*/

INSERT INTO clients (
  name,
  email,
  phone,
  date_of_birth,
  gender,
  codice_fiscale,
  tariffa_default,
  metodo_pagamento,
  tipo_seduta_default,
  ts_opposizione,
  is_foreign
)
SELECT name, email, phone, date_of_birth, gender, codice_fiscale,
       tariffa_default, metodo_pagamento, tipo_seduta_default, ts_opposizione, is_foreign
FROM (VALUES
  (
    'Marco Bianchi',
    'marco.bianchi@email.it',
    '+39 339 1234567',
    '1988-04-12'::date,
    'M',
    'BNCMRC88D12F205X',
    80.00,
    'bonifico',
    'individuale',
    false,
    false
  ),
  (
    'Sofia Ricci',
    'sofia.ricci@gmail.com',
    '+39 347 9876543',
    '1995-09-23'::date,
    'F',
    'RCCSFO95P63H501Y',
    90.00,
    'carta',
    'individuale',
    false,
    false
  ),
  (
    'Luca Ferrari',
    'luca.ferrari@libero.it',
    '+39 328 4561230',
    '1979-01-05'::date,
    'M',
    'FRRLCU79A05D612Z',
    100.00,
    'contanti',
    'individuale',
    true,
    false
  ),
  (
    'Giulia Rossi',
    'giulia.rossi@outlook.it',
    '+39 333 7890123',
    '2001-07-18'::date,
    'F',
    'RSSGLL01L58H501W',
    70.00,
    'bonifico',
    'primo_colloquio',
    false,
    false
  ),
  (
    'Alessandro Conti',
    'a.conti@gmail.com',
    '+39 340 3456789',
    '1965-11-30'::date,
    'M',
    'CNTLSN65S30F839V',
    100.00,
    'carta',
    'individuale',
    false,
    false
  ),
  (
    'Elena Marini',
    'elena.marini@yahoo.it',
    '+39 349 6543210',
    '1990-03-08'::date,
    'F',
    'MRNLNE90C48G224U',
    80.00,
    'bonifico',
    'individuale',
    false,
    false
  ),
  (
    'Giovanni e Laura Esposito',
    'gesposito@email.it',
    '+39 334 2109876',
    '1982-06-15'::date,
    'M',
    'SPSGNN82H15F839T',
    120.00,
    'bonifico',
    'coppia',
    false,
    false
  ),
  (
    'Chiara Fontana',
    'chiara.fontana@gmail.com',
    '+39 345 8765432',
    '1998-12-02'::date,
    'F',
    'FNTCHR98T42H501S',
    70.00,
    'contanti',
    'breve',
    false,
    false
  ),
  (
    'Roberto Greco',
    'roberto.greco@pec.it',
    '+39 347 1357924',
    '1973-08-27'::date,
    'M',
    'GRCRBT73M27H501R',
    100.00,
    'carta',
    'individuale',
    true,
    false
  ),
  (
    'Valentina De Luca',
    'v.deluca@email.com',
    '+39 320 2468013',
    '1985-02-14'::date,
    'F',
    'DLCVNT85B54F205Q',
    90.00,
    'bonifico',
    'individuale',
    false,
    false
  ),
  (
    'Matteo Bruno',
    'matteo.bruno@gmail.com',
    '+39 338 9753108',
    '2003-10-09'::date,
    'M',
    'BRNMTT03R09H501P',
    70.00,
    'carta',
    'individuale',
    false,
    false
  ),
  (
    'Francesca Lombardi',
    'f.lombardi@virgilio.it',
    '+39 329 1472583',
    '1968-05-21'::date,
    'F',
    'LMBFNC68E61G224N',
    100.00,
    'bonifico',
    'individuale',
    false,
    false
  ),
  (
    'Thomas Müller',
    'thomas.mueller@gmail.de',
    '+49 176 55443322',
    '1991-03-17'::date,
    'M',
    NULL,
    100.00,
    'carta',
    'individuale',
    false,
    true
  ),
  (
    'Sara e Pietro Mancini',
    'mancini.coppia@email.it',
    '+39 342 3698521',
    '1980-09-04'::date,
    'F',
    'MNCSRA80P44H501M',
    130.00,
    'bonifico',
    'coppia',
    false,
    false
  ),
  (
    'Andrea Moretti',
    NULL,
    '+39 335 7418529',
    '1957-12-11'::date,
    'M',
    'MRTNDR57T11G224L',
    80.00,
    'contanti',
    'individuale',
    true,
    false
  )
) AS t(
  name, email, phone, date_of_birth, gender, codice_fiscale,
  tariffa_default, metodo_pagamento, tipo_seduta_default, ts_opposizione, is_foreign
)
WHERE NOT EXISTS (
  SELECT 1 FROM clients c
  WHERE c.name = t.name
    AND c.date_of_birth = t.date_of_birth
);
