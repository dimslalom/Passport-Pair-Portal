// Derives ISO 3166-1 alpha-2 codes via Intl.DisplayNames (no hardcoded country table).
// OVERRIDES covers the 18 cases where the CSV's common English name diverges from
// the ISO standard name that Intl.DisplayNames returns in English.
const OVERRIDES: Record<string, string> = {
  'Antigua and Barbuda': 'AG',  'Bosnia and Herzegovina': 'BA',
  'Congo': 'CG',                'DR Congo': 'CD',
  'Czech Republic': 'CZ',       'Hong Kong': 'HK',
  'Ivory Coast': 'CI',          'Macao': 'MO',
  'Myanmar': 'MM',              'Palestine': 'PS',
  'Saint Kitts and Nevis': 'KN','Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Sao Tome and Principe': 'ST','Swaziland': 'SZ',
  'Trinidad and Tobago': 'TT',  'Turkey': 'TR',
  'Vatican': 'VA',
};

// Built once at module load: English Intl display name → alpha-2 code
const intlMap = new Map<string, string>();
const display = new Intl.DisplayNames(['en'], { type: 'region' });
for (let i = 65; i <= 90; i++) {
  for (let j = 65; j <= 90; j++) {
    const code = String.fromCharCode(i, j);
    try {
      const name = display.of(code);
      if (name && name !== code) intlMap.set(name, code);
    } catch { /* skip invalid region codes */ }
  }
}

export function getISOCode(countryName: string): string | undefined {
  return OVERRIDES[countryName] ?? intlMap.get(countryName);
}
