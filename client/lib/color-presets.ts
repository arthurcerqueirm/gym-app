export interface ColorPalette {
  name: string;
  description: string;
  light: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    muted: string;
  };
  dark: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    muted: string;
  };
}

export const colorPresets: Record<string, ColorPalette> = {
  warm: {
    name: "Warm",
    description: "Cobre, terracota e âmbar - energia natural",
    light: {
      background: "#F4F3F1",
      foreground: "#2D2420",
      card: "#FFFFFF",
      primary: "#C85A2C",
      secondary: "#E07B39",
      accent: "#EAB308",
      border: "#E8DDD5",
      muted: "#A39D96",
    },
    dark: {
      background: "#1A1815",
      foreground: "#F5F3F0",
      card: "#2D2420",
      primary: "#E59A48",
      secondary: "#F09955",
      accent: "#FCD34D",
      border: "#3D3530",
      muted: "#8B8580",
    },
  },
  cool: {
    name: "Cool",
    description: "Azul, teal e indigo - calma e profundidade",
    light: {
      background: "#F0F4F9",
      foreground: "#1A2A3A",
      card: "#FFFFFF",
      primary: "#0369A1",
      secondary: "#0891B2",
      accent: "#8B5CF6",
      border: "#E0E9F3",
      muted: "#64748B",
    },
    dark: {
      background: "#0F172A",
      foreground: "#F1F5F9",
      card: "#1E293B",
      primary: "#38BDF8",
      secondary: "#06B6D4",
      accent: "#A78BFA",
      border: "#334155",
      muted: "#94A3B8",
    },
  },
  nature: {
    name: "Nature",
    description: "Verde, terracota e madeira - harmonia natural",
    light: {
      background: "#F8F6F1",
      foreground: "#2C3E35",
      card: "#FFFFFF",
      primary: "#2D5A4F",
      secondary: "#6B9B86",
      accent: "#D4A574",
      border: "#E5DDD5",
      muted: "#8B9E95",
    },
    dark: {
      background: "#0F1612",
      foreground: "#F0F4F1",
      card: "#1A2420",
      primary: "#52B788",
      secondary: "#81C784",
      accent: "#E8B884",
      border: "#2D3A32",
      muted: "#6B9080",
    },
  },
  modern: {
    name: "Modern",
    description: "Rosa, violeta e neutro - contemporâneo e elegante",
    light: {
      background: "#FAFAF9",
      foreground: "#18181B",
      card: "#FFFFFF",
      primary: "#EC4899",
      secondary: "#A855F7",
      accent: "#F59E0B",
      border: "#E4E4E7",
      muted: "#71717A",
    },
    dark: {
      background: "#09090B",
      foreground: "#FAFAFA",
      card: "#18181B",
      primary: "#F472B6",
      secondary: "#D8B4FE",
      accent: "#FBBF24",
      border: "#3F3F46",
      muted: "#A1A1AA",
    },
  },
  midnight: {
    name: "Midnight",
    description: "Azul profundo, ouro e preto - premium e sofisticado",
    light: {
      background: "#F9FAFB",
      foreground: "#111827",
      card: "#FFFFFF",
      primary: "#1E3A8A",
      secondary: "#2563EB",
      accent: "#FBBF24",
      border: "#E5E7EB",
      muted: "#6B7280",
    },
    dark: {
      background: "#0F1419",
      foreground: "#F3F4F6",
      card: "#1F2937",
      primary: "#60A5FA",
      secondary: "#93C5FD",
      accent: "#FCD34D",
      border: "#374151",
      muted: "#9CA3AF",
    },
  },
};

export function getColorAsHSL(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const hslH = Math.round(h * 360);
  const hslS = Math.round(s * 100);
  const hslL = Math.round(l * 100);

  return `${hslH} ${hslS}% ${hslL}%`;
}
