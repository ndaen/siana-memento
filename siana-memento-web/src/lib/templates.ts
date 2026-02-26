export type TemplateId = 'boheme' | 'moderne' | 'classique' | 'vintage' | 'minimaliste'

export interface TemplateConfig {
  id: TemplateId
  name: string
  identity: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  illustration: string
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'boheme',
    name: 'Bohème',
    identity: 'Romantique & naturel',
    primaryColor: '#C17A6F',
    secondaryColor: '#F5E6D3',
    accentColor: '#2D4A3E',
    illustration: 'Aquarelle douce',
  },
  {
    id: 'moderne',
    name: 'Moderne',
    identity: 'Épuré & sophistiqué',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#D4AF37',
    illustration: 'Flat design géométrique',
  },
  {
    id: 'classique',
    name: 'Classique',
    identity: 'Intemporel & élégant',
    primaryColor: '#800020',
    secondaryColor: '#F4EAD5',
    accentColor: '#D4AF37',
    illustration: 'Portrait dessiné',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    identity: 'Nostalgie & rétro chic',
    primaryColor: '#A67C52',
    secondaryColor: '#EFE8D8',
    accentColor: '#6B705C',
    illustration: 'Rotoscope années 70',
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste',
    identity: 'Épuré & zen',
    primaryColor: '#E8DCD4',
    secondaryColor: '#FAF8F6',
    accentColor: '#A8968A',
    illustration: 'Line art one-line',
  },
]

export function getTemplate(id: TemplateId): TemplateConfig {
  const tpl = TEMPLATES.find((t) => t.id === id)
  if (!tpl) throw new Error(`Template inconnu : ${id}`)
  return tpl
}
