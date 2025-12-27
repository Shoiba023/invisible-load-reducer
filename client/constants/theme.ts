import { Platform } from "react-native";

const tintColorLight = "#8B7BB8";
const tintColorDark = "#A89BD3";

export const Colors = {
  light: {
    text: "#2D2640",
    textSecondary: "#6B6082",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9B8FB8",
    tabIconSelected: tintColorLight,
    link: "#8B7BB8",
    primary: "#8B7BB8",
    primaryLight: "#B8A8D8",
    secondary: "#7BBBA8",
    secondaryLight: "#A8D8C8",
    accent: "#E8B87B",
    accentLight: "#F5D8B8",
    success: "#7BBB8B",
    warning: "#E8B87B",
    error: "#BB7B7B",
    backgroundRoot: "#FAF8FC",
    backgroundDefault: "#F5F0FA",
    backgroundSecondary: "#EDE5F5",
    backgroundTertiary: "#E5DAF0",
    backgroundCard: "#FFFFFF",
    border: "#E0D5EB",
    borderLight: "#F0E8F5",
    gradient: {
      primary: ["#B8A8D8", "#8B7BB8"],
      secondary: ["#A8D8C8", "#7BBBA8"],
      calm: ["#F5F0FA", "#EDE5F5"],
      warmth: ["#F5E8D8", "#E8D5C8"],
    },
  },
  dark: {
    text: "#F0EBF5",
    textSecondary: "#B8A8D0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#7B6B98",
    tabIconSelected: tintColorDark,
    link: "#A89BD3",
    primary: "#A89BD3",
    primaryLight: "#C8BBE8",
    secondary: "#8BD3BB",
    secondaryLight: "#A8E8D0",
    accent: "#D3A87B",
    accentLight: "#E8C8A8",
    success: "#8BD39B",
    warning: "#D3A87B",
    error: "#D38B8B",
    backgroundRoot: "#1A1625",
    backgroundDefault: "#252035",
    backgroundSecondary: "#302845",
    backgroundTertiary: "#3B3055",
    backgroundCard: "#302845",
    border: "#453A60",
    borderLight: "#3B3055",
    gradient: {
      primary: ["#453A60", "#302845"],
      secondary: ["#3A5545", "#2A4535"],
      calm: ["#252035", "#1A1625"],
      warmth: ["#453530", "#352825"],
    },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 52,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  smallMedium: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: "#8B7BB8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#8B7BB8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#8B7BB8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const FREE_BRAIN_DUMP_LIMIT = 2;
export const FREE_RESET_LIMIT = 1;
export const PREMIUM_PRICE = 14;
