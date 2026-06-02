import type { ThemePreference } from "../contexts/preferences/domain/UserPreferences";

export interface ThemeOption {
  id: ThemePreference;
  name: string;
  swatches: Array<string>;
}

export const themeOptions: ReadonlyArray<ThemeOption> = [
  { id: "current", name: "현재 유지", swatches: ["#00fff0", "#ff00e6", "#f3fffc", "#0a0a0e", "#ffb5d7"] },
  { id: "tokyo-night", name: "Tokyo Night", swatches: ["#7dcfff", "#bb9af7", "#c0caf5", "#101322", "#f7768e"] },
  { id: "one-dark-pro", name: "One Dark Pro", swatches: ["#61afef", "#c678dd", "#abb2bf", "#1e222a", "#e06c75"] },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha", swatches: ["#89dceb", "#cba6f7", "#cdd6f4", "#1e1e2e", "#f38ba8"] },
  { id: "nord", name: "Nord", swatches: ["#88c0d0", "#81a1c1", "#eceff4", "#2e3440", "#bf616a"] },
  { id: "dracula-official", name: "Dracula Official", swatches: ["#8be9fd", "#bd93f9", "#f8f8f2", "#282a36", "#ff79c6"] },
  { id: "gruvbox", name: "Gruvbox", swatches: ["#fabd2f", "#fe8019", "#ebdbb2", "#282828", "#fb4934"] },
  { id: "monokai-pro", name: "Monokai Pro", swatches: ["#78dce8", "#ab9df2", "#fcfcfa", "#2d2a2e", "#ff6188"] },
  { id: "night-owl", name: "Night Owl", swatches: ["#82aaff", "#c792ea", "#d6deeb", "#011627", "#ef5350"] },
  { id: "synthwave-84", name: "Synthwave 84", swatches: ["#36f9f6", "#ff7edb", "#fede5d", "#241b2f", "#fe4450"] },
  { id: "ayu-mirage-dark", name: "Ayu Mirage Dark", swatches: ["#73d0ff", "#dfbfff", "#cbccc6", "#1f2430", "#f28779"] },
];
