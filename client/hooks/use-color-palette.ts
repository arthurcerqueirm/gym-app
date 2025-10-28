import { useEffect, useState } from 'react';
import { colorPresets, type ColorPalette, getColorAsHSL } from '@/lib/color-presets';

export function useColorPalette() {
  const [paletteKey, setPaletteKey] = useState<string>(() => {
    const saved = localStorage.getItem('gym-streak-palette');
    return saved || 'warm';
  });

  const [customColors, setCustomColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('gym-streak-custom-colors');
    return saved ? JSON.parse(saved) : {};
  });

  const palette = colorPresets[paletteKey];

  useEffect(() => {
    localStorage.setItem('gym-streak-palette', paletteKey);
  }, [paletteKey]);

  useEffect(() => {
    localStorage.setItem('gym-streak-custom-colors', JSON.stringify(customColors));
    applyColorsToDOM();
  }, [customColors]);

  const applyColorsToDOM = () => {
    const root = document.documentElement;
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const currentPalette = colorPresets[paletteKey];
    const colors = currentPalette[theme as 'light' | 'dark'];

    // Apply base colors
    Object.entries(colors).forEach(([key, value]) => {
      const varName = `--${key}`;
      const customValue = customColors[`${paletteKey}-${theme}-${key}`];
      const colorValue = customValue || value;
      const hslValue = getColorAsHSL(colorValue);
      root.style.setProperty(varName, hslValue);
    });

    // Apply sidebar colors
    root.style.setProperty('--sidebar-background', getColorAsHSL(colors.primary));
    root.style.setProperty('--sidebar-foreground', getColorAsHSL(colors.card === '#FFFFFF' ? '#FFFFFF' : '#FFFFFF'));
    root.style.setProperty('--sidebar-primary', getColorAsHSL(colors.primary));
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%');
    root.style.setProperty('--sidebar-accent', getColorAsHSL(colors.secondary));
    root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
  };

  useEffect(() => {
    applyColorsToDOM();
  }, [paletteKey, customColors]);

  const selectPalette = (key: string) => {
    if (colorPresets[key]) {
      setPaletteKey(key);
      setCustomColors({});
    }
  };

  const updateColor = (colorKey: string, hexValue: string, theme: 'light' | 'dark') => {
    const key = `${paletteKey}-${theme}-${colorKey}`;
    setCustomColors(prev => ({
      ...prev,
      [key]: hexValue,
    }));
  };

  const resetColors = () => {
    setCustomColors({});
  };

  return {
    paletteKey,
    palette,
    selectPalette,
    updateColor,
    resetColors,
    customColors,
    availablePalettes: Object.keys(colorPresets),
  };
}
