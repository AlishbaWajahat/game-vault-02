// Re-export types and platform metadata from the new types module
// This file is kept for backward compatibility during migration

export { PLATFORM_COLORS as PLATFORM_META, getPlatformColors } from "./types";
export type { ContentItem as Game, Platform, Category, Article } from "./types";

export const FALLBACK_COVER = "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg";

// Platform icon mapping — maps platform slug to icon name for PlatformIcon component
export const PLATFORM_ICONS: Record<string, string> = {
  pc: "Monitor",
  switch: "Gamepad2",
  playstation: "Disc3",
  xbox: "Shield",
  gba: "Smartphone",
  snes: "Gamepad",
  n64: "Joystick",
  nds: "TabletSmartphone",
  psp: "TvMinimalPlay",
  dreamcast: "Orbit",
  wii: "Sparkles",
  ps2: "Disc2",
};
