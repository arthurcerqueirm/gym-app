import { useState } from "react";
import { useColorPalette } from "@/hooks/use-color-palette";
import { colorPresets } from "@/lib/color-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";

export default function ColorPaletteSelector() {
  const { paletteKey, palette, selectPalette, updateColor, resetColors, customColors } = useColorPalette();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
  const currentTheme = theme as "light" | "dark";
  const colors = palette[currentTheme];

  return (
    <div className="space-y-6">
      {/* Preset Palettes */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Escolha uma Paleta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(colorPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => selectPalette(key)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                paletteKey === key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: preset.light.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: preset.light.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: preset.light.accent }}
                  />
                </div>
                {paletteKey === key && (
                  <span className="text-xs font-bold text-primary ml-auto">✓ Ativa</span>
                )}
              </div>
              <p className="font-semibold text-foreground text-sm">{preset.name}</p>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Preview das Cores</h3>
          {Object.keys(customColors).length > 0 && (
            <Button
              onClick={resetColors}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 text-xs"
            >
              <RotateCcw size={14} />
              Resetar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div
                className="w-full h-24 rounded-lg border border-border shadow-sm cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: value }}
                onClick={() => setShowCustomizer(!showCustomizer)}
              />
              <p className="text-xs font-medium text-foreground capitalize text-center">
                {key}
              </p>
              <p className="text-xs text-muted-foreground text-center font-mono">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Color Customizer */}
      {showCustomizer && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Personalizar Cores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(colors).map(([key, defaultValue]) => {
              const customKey = `${paletteKey}-${currentTheme}-${key}`;
              const customValue = customColors[customKey] || defaultValue;

              return (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-foreground capitalize">
                    {key}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customValue}
                      onChange={(e) => updateColor(key, e.target.value, currentTheme)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customValue}
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          updateColor(key, e.target.value, currentTheme);
                        }
                      }}
                      placeholder="#000000"
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Showcase */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Preview dos Componentes</h3>
        <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
          {/* Button Preview */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Botão Primário</p>
            <Button className="bg-primary hover:opacity-90 text-white">
              Exemplo de Botão
            </Button>
          </div>

          {/* Card Preview */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            <p style={{ color: colors.foreground }} className="font-semibold mb-2">
              Exemplo de Card
            </p>
            <p style={{ color: colors.muted }}>Texto secundário</p>
          </div>

          {/* Text Preview */}
          <div className="space-y-1">
            <p style={{ color: colors.foreground }} className="font-semibold">
              Texto Primário
            </p>
            <p style={{ color: colors.muted }}>Texto Secundário</p>
            <a href="#" style={{ color: colors.primary }} className="font-medium">
              Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
