export type TemplateId = 'boheme' | 'moderne' | 'classique' | 'vintage' | 'minimaliste'

export interface PaletteOption {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export interface TemplateConfig {
  id: TemplateId
  name: string
  identity: string
  illustration: string
  palettes: PaletteOption[]
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'boheme',
    name: 'Bohème',
    identity: 'Romantique & naturel',
    illustration: 'Aquarelle douce',
    palettes: [
      {
        id: 'terre-sauge',
        name: 'Terre & Sauge',
        primaryColor: '#C17A6F',
        secondaryColor: '#F5E6D3',
        accentColor: '#2D4A3E',
      },
      {
        id: 'lavande-miel',
        name: 'Lavande & Miel',
        primaryColor: '#7B6B8A',
        secondaryColor: '#FDF6EC',
        accentColor: '#8B6F47',
      },
      {
        id: 'rose-foret',
        name: 'Rose & Forêt',
        primaryColor: '#9E5A63',
        secondaryColor: '#F0EBE3',
        accentColor: '#3D5A45',
      },
    ],
  },
  {
    id: 'moderne',
    name: 'Moderne',
    identity: 'Épuré & sophistiqué',
    illustration: 'Flat design géométrique',
    palettes: [
      {
        id: 'noir-or',
        name: 'Noir & Or',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#D4AF37',
      },
      {
        id: 'marine-cuivre',
        name: 'Marine & Cuivre',
        primaryColor: '#1B2A4A',
        secondaryColor: '#F7F5F2',
        accentColor: '#B87333',
      },
      {
        id: 'charbon-blush',
        name: 'Charbon & Blush',
        primaryColor: '#2C2C2C',
        secondaryColor: '#FFFFFF',
        accentColor: '#C27685',
      },
    ],
  },
  {
    id: 'classique',
    name: 'Classique',
    identity: 'Intemporel & élégant',
    illustration: 'Portrait dessiné',
    palettes: [
      {
        id: 'bordeaux-or',
        name: 'Bordeaux & Or',
        primaryColor: '#800020',
        secondaryColor: '#F4EAD5',
        accentColor: '#D4AF37',
      },
      {
        id: 'bleu-royal',
        name: 'Bleu Royal',
        primaryColor: '#1E3A5F',
        secondaryColor: '#F2EDE6',
        accentColor: '#C5A258',
      },
      {
        id: 'emeraude-creme',
        name: 'Émeraude & Crème',
        primaryColor: '#2E5945',
        secondaryColor: '#FBF7F0',
        accentColor: '#B8860B',
      },
    ],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    identity: 'Nostalgie & rétro chic',
    illustration: 'Rotoscope années 70',
    palettes: [
      {
        id: 'ocre-olive',
        name: 'Ocre & Olive',
        primaryColor: '#A67C52',
        secondaryColor: '#EFE8D8',
        accentColor: '#6B705C',
      },
      {
        id: 'rouille-moutarde',
        name: 'Rouille & Moutarde',
        primaryColor: '#8B4513',
        secondaryColor: '#F5EDDA',
        accentColor: '#B8860B',
      },
      {
        id: 'brique-sapin',
        name: 'Brique & Sapin',
        primaryColor: '#9B5B4C',
        secondaryColor: '#F0E9DD',
        accentColor: '#4A5D4F',
      },
    ],
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste',
    identity: 'Épuré & zen',
    illustration: 'Line art one-line',
    palettes: [
      {
        id: 'nude-taupe',
        name: 'Nude & Taupe',
        primaryColor: '#E8DCD4',
        secondaryColor: '#FAF8F6',
        accentColor: '#A8968A',
      },
      {
        id: 'argile-sable',
        name: 'Argile & Sable',
        primaryColor: '#B07156',
        secondaryColor: '#FAF5F0',
        accentColor: '#8C6E5D',
      },
      {
        id: 'saumon-lin',
        name: 'Saumon & Lin',
        primaryColor: '#D4917A',
        secondaryColor: '#FFF8F5',
        accentColor: '#C07A60',
      },
    ],
  },
]

export function getTemplate(id: TemplateId): TemplateConfig {
  const tpl = TEMPLATES.find((t) => t.id === id)
  if (!tpl) throw new Error(`Template inconnu : ${id}`)
  return tpl
}

export function getDefaultPalette(id: TemplateId): PaletteOption {
  return getTemplate(id).palettes[0]
}
