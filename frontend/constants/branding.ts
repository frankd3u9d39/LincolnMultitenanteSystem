/**
 * Institutional Theme Palettes and Branding Utilities
 * Allows SuperAdmin onboarding and Admin settings to customize tenant dashboard branding.
 */

export interface ColorPalettePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const COLOR_PALETTES: ColorPalettePreset[] = [
  {
    id: 'crimson',
    name: 'Lincoln Crimson',
    primary: '#B81D22',
    secondary: '#9E1519',
    accent: '#B81D22',
    badgeBg: '#FFFFFF',
    badgeText: '#B81D22',
    description: 'Heritage rich institutional crimson and deep wine',
  },
  {
    id: 'navy',
    name: 'Oxford Navy',
    primary: '#1E3A8A',
    secondary: '#172554',
    accent: '#2563EB',
    badgeBg: '#FFFFFF',
    badgeText: '#1E3A8A',
    description: 'Prestigious academic sapphire & midnight blue',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    primary: '#047857',
    secondary: '#064E3B',
    accent: '#10B981',
    badgeBg: '#FFFFFF',
    badgeText: '#047857',
    description: 'Vibrant botanical forest green & deep jade',
  },
  {
    id: 'purple',
    name: 'Imperial Purple',
    primary: '#7C3AED',
    secondary: '#5B21B6',
    accent: '#8B5CF6',
    badgeBg: '#FFFFFF',
    badgeText: '#7C3AED',
    description: 'Regal violet & modern royal amethyst',
  },
  {
    id: 'onyx',
    name: 'Midnight Onyx',
    primary: '#18181B',
    secondary: '#09090B',
    accent: '#3F3F46',
    badgeBg: '#FFFFFF',
    badgeText: '#18181B',
    description: 'Ultra-modern carbon slate & pitch obsidian',
  },
  {
    id: 'teal',
    name: 'Oceanic Teal',
    primary: '#0F766E',
    secondary: '#115E59',
    accent: '#14B8A6',
    badgeBg: '#FFFFFF',
    badgeText: '#0F766E',
    description: 'Contemporary deep oceanic teal & cyan',
  },
  {
    id: 'amber',
    name: 'Classic Bronze',
    primary: '#B45309',
    secondary: '#78350F',
    accent: '#D97706',
    badgeBg: '#FFFFFF',
    badgeText: '#B45309',
    description: 'Warm collegiate heritage bronze & amber gold',
  },
  {
    id: 'custom',
    name: 'Custom Brand Color',
    primary: '#B81D22',
    secondary: '#9E1519',
    accent: '#B81D22',
    badgeBg: '#FFFFFF',
    badgeText: '#B81D22',
    description: 'Specify an exact institutional hex color',
  },
];

export function getPalette(id?: string | null): ColorPalettePreset {
  if (!id) return COLOR_PALETTES[0];
  const found = COLOR_PALETTES.find((p) => p.id === id);
  return found || COLOR_PALETTES[0];
}

/**
 * Resolves a full image URL for school logos.
 * Handles relative backend URLs (/uploads/logos/...), base64 data URLs, and external links.
 */
export function resolveSchoolLogoUrl(logoUrl?: string | null): string {
  if (!logoUrl) return '/lincoln-logo.png';
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '');
  const cleanPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${apiBase}${cleanPath}`;
}
