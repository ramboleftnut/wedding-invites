export interface FontOption {
  name: string
  family: string // exactly as used in CSS font-family
  googleParam: string // URL-encoded for Google Fonts API
}

export const serifFonts: FontOption[] = [
  { name: 'Playfair Display',    family: 'Playfair Display',    googleParam: 'Playfair+Display:ital,wght@0,400;0,700;1,400' },
  { name: 'Cormorant Garamond',  family: 'Cormorant Garamond',  googleParam: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400' },
  { name: 'EB Garamond',         family: 'EB Garamond',         googleParam: 'EB+Garamond:ital,wght@0,400;0,700;1,400' },
  { name: 'Lora',                family: 'Lora',                googleParam: 'Lora:ital,wght@0,400;0,700;1,400' },
  { name: 'Libre Baskerville',   family: 'Libre Baskerville',   googleParam: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400' },
  { name: 'Merriweather',        family: 'Merriweather',        googleParam: 'Merriweather:ital,wght@0,300;0,400;1,300' },
  { name: 'Crimson Text',        family: 'Crimson Text',        googleParam: 'Crimson+Text:ital,wght@0,400;0,600;1,400' },
  { name: 'Cardo',               family: 'Cardo',               googleParam: 'Cardo:ital,wght@0,400;0,700;1,400' },
  { name: 'Spectral',            family: 'Spectral',            googleParam: 'Spectral:ital,wght@0,300;0,400;1,300' },
  { name: 'Vollkorn',            family: 'Vollkorn',            googleParam: 'Vollkorn:ital,wght@0,400;0,700;1,400' },
  { name: 'Sorts Mill Goudy',    family: 'Sorts Mill Goudy',    googleParam: 'Sorts+Mill+Goudy:ital@0;1' },
  { name: 'Noto Serif',          family: 'Noto Serif',          googleParam: 'Noto+Serif:ital,wght@0,400;0,700;1,400' },
  { name: 'PT Serif',            family: 'PT Serif',            googleParam: 'PT+Serif:ital,wght@0,400;0,700;1,400' },
  { name: 'Glegoo',              family: 'Glegoo',              googleParam: 'Glegoo:wght@400;700' },
  { name: 'Rozha One',           family: 'Rozha One',           googleParam: 'Rozha+One' },
]

export const sansFonts: FontOption[] = [
  { name: 'Montserrat',          family: 'Montserrat',          googleParam: 'Montserrat:wght@300;400;600' },
  { name: 'Raleway',             family: 'Raleway',             googleParam: 'Raleway:wght@300;400;600' },
  { name: 'Poppins',             family: 'Poppins',             googleParam: 'Poppins:wght@300;400;600' },
  { name: 'Nunito',              family: 'Nunito',              googleParam: 'Nunito:wght@300;400;600' },
  { name: 'Josefin Sans',        family: 'Josefin Sans',        googleParam: 'Josefin+Sans:wght@300;400;600' },
  { name: 'Quicksand',           family: 'Quicksand',           googleParam: 'Quicksand:wght@400;600' },
  { name: 'Open Sans',           family: 'Open Sans',           googleParam: 'Open+Sans:wght@300;400;600' },
  { name: 'Lato',                family: 'Lato',                googleParam: 'Lato:wght@300;400;700' },
  { name: 'DM Sans',             family: 'DM Sans',             googleParam: 'DM+Sans:wght@300;400;500' },
  { name: 'Outfit',              family: 'Outfit',              googleParam: 'Outfit:wght@300;400;600' },
  { name: 'Mulish',              family: 'Mulish',              googleParam: 'Mulish:wght@300;400;600' },
  { name: 'Rubik',               family: 'Rubik',               googleParam: 'Rubik:wght@300;400;500' },
  { name: 'Plus Jakarta Sans',   family: 'Plus Jakarta Sans',   googleParam: 'Plus+Jakarta+Sans:wght@300;400;600' },
  { name: 'Figtree',             family: 'Figtree',             googleParam: 'Figtree:wght@300;400;600' },
  { name: 'Jost',                family: 'Jost',                googleParam: 'Jost:wght@300;400;500' },
]

export const scriptFonts: FontOption[] = [
  { name: 'Great Vibes',           family: 'Great Vibes',           googleParam: 'Great+Vibes' },
  { name: 'Parisienne',            family: 'Parisienne',            googleParam: 'Parisienne' },
  { name: 'Dancing Script',        family: 'Dancing Script',        googleParam: 'Dancing+Script:wght@400;700' },
  { name: 'Sacramento',            family: 'Sacramento',            googleParam: 'Sacramento' },
  { name: 'Pinyon Script',         family: 'Pinyon Script',         googleParam: 'Pinyon+Script' },
  { name: 'Alex Brush',            family: 'Alex Brush',            googleParam: 'Alex+Brush' },
  { name: 'Allura',                family: 'Allura',                googleParam: 'Allura' },
  { name: 'Tangerine',             family: 'Tangerine',             googleParam: 'Tangerine:wght@400;700' },
  { name: 'Italianno',             family: 'Italianno',             googleParam: 'Italianno' },
  { name: 'Monsieur La Doulaise',  family: 'Monsieur La Doulaise',  googleParam: 'Monsieur+La+Doulaise' },
  { name: 'Petit Formal Script',   family: 'Petit Formal Script',   googleParam: 'Petit+Formal+Script' },
  { name: 'Lovers Quarrel',        family: 'Lovers Quarrel',        googleParam: 'Lovers+Quarrel' },
  { name: 'Clicker Script',        family: 'Clicker Script',        googleParam: 'Clicker+Script' },
  { name: 'Mr De Haviland',        family: 'Mr De Haviland',        googleParam: 'Mr+De+Haviland' },
  { name: 'Ruthie',                family: 'Ruthie',                googleParam: 'Ruthie' },
]

export const fontCategories = {
  serif: serifFonts,
  sans: sansFonts,
  script: scriptFonts,
} as const

export type FontCategory = keyof typeof fontCategories

export interface FontSelection {
  serif: string
  sans: string
  script: string
}

export const defaultFonts: FontSelection = {
  serif: 'Playfair Display',
  sans: 'Montserrat',
  script: 'Great Vibes',
}

export function buildGoogleFontsUrl(families: string[]): string {
  if (!families.length) return ''
  return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`
}

export function fontsToGoogleUrl(selection: FontSelection): string {
  const all = [...serifFonts, ...sansFonts, ...scriptFonts]
  const params = [selection.serif, selection.sans, selection.script]
    .map(name => all.find(f => f.name === name)?.googleParam)
    .filter(Boolean) as string[]
  return buildGoogleFontsUrl(params)
}

export function categoryGoogleUrl(cat: FontCategory): string {
  return buildGoogleFontsUrl(fontCategories[cat].map(f => f.googleParam))
}
