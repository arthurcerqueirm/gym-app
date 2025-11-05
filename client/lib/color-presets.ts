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
      foreground: "#1F1815",
      card: "#FFFFFF",
      primary: "#B8482D",
      secondary: "#C85A2C",
      accent: "#C47A1C",
      border: "#E8DDD5",
      muted: "#756F67",
    },
    dark: {
      background: "#1A1815",
      foreground: "#F5F3F0",
      card: "#2D2420",
      primary: "#E59A48",
      secondary: "#F09955",
      accent: "#DBA51B",
      border: "#3D3530",
      muted: "#8B8580",
    },
  },
  cool: {
    name: "Cool",
    description: "Azul, teal e indigo - calma e profundidade",
    light: {
      background: "#F0F4F9",
      foreground: "#0F1F35",
      card: "#FFFFFF",
      primary: "#024B7A",
      secondary: "#0869A6",
      accent: "#1F7A6F",
      border: "#E0E9F3",
      muted: "#3B5870",
    },
    dark: {
      background: "#0F172A",
      foreground: "#F1F5F9",
      card: "#1E293B",
      primary: "#38BDF8",
      secondary: "#06B6D4",
      accent: "#34D399",
      border: "#334155",
      muted: "#94A3B8",
    },
  },
  nature: {
    name: "Nature",
    description: "Verde, terracota e madeira - harmonia natural",
    light: {
      background: "#F8F6F1",
      foreground: "#1F2F28",
      card: "#FFFFFF",
      primary: "#1F4D40",
      secondary: "#2D6D5D",
      accent: "#3D8B70",
      border: "#E5DDD5",
      muted: "#5A7367",
    },
    dark: {
      background: "#0F1612",
      foreground: "#F0F4F1",
      card: "#1A2420",
      primary: "#52B788",
      secondary: "#81C784",
      accent: "#4CAF7F",
      border: "#2D3A32",
      muted: "#6B9080",
    },
  },
  modern: {
    name: "Modern",
    description: "Rosa, violeta e neutro - contemporâneo e elegante",
    light: {
      background: "#FAFAF9",
      foreground: "#0F0F11",
      card: "#FFFFFF",
      primary: "#C1235F",
      secondary: "#8B3A8B",
      accent: "#D97706",
      border: "#E4E4E7",
      muted: "#4F4F52",
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
      foreground: "#050A12",
      card: "#FFFFFF",
      primary: "#172554",
      secondary: "#1E40AF",
      accent: "#D97706",
      border: "#E5E7EB",
      muted: "#3F4654",
    },
    dark: {
      background: "#0F1419",
      foreground: "#F3F4F6",
      card: "#1F2937",
      primary: "#60A5FA",
      secondary: "#93C5FD",
      accent: "#FBBF24",
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
