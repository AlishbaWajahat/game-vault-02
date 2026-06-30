import { PrismaClient, Role, FieldType, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ── Image helpers (matching frontend/lib/data.ts) ──

const IGDB = (id: string) => `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.jpg`;
const IGDB_HD = (id: string) => `https://images.igdb.com/igdb/image/upload/t_1080p/${id}.jpg`;
const IGDB_SHOT = (id: string) => `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${id}.jpg`;
const FALLBACK_COVER = IGDB("co49x5");

const COVER_OVERRIDES: Record<string, string> = {
  "zelda-tears-kingdom": IGDB("co5vmg"),
  "elden-ring": IGDB("co4jni"),
  "cyberpunk-2077": IGDB("co4hk6"),
  "red-dead-2": IGDB("co1q1f"),
  "spider-man-miles": IGDB("co2hbg"),
  "forza-horizon-5": IGDB("co3ofx"),
  "gta-v": IGDB("co2lbd"),
  "mario-kart-8": IGDB("co1rcr"),
  "pokemon-legends-za": IGDB("co8ld4"),
  "resident-evil-4": IGDB("co6bsc"),
  "hollow-knight": IGDB("co5w56"),
  "stardew-valley": IGDB("co1lhk"),
  "fifa-25": IGDB("co6x2s"),
  "civilization-vi": IGDB("co52l6"),
  "f1-24": IGDB("co5s5v"),
  "pokemon-emerald": IGDB("co3p2d"),
  "super-mario-64": IGDB("co4jjr"),
  "zelda-oot": IGDB("co5w20"),
  "chrono-trigger": IGDB("co6bnd"),
};

const GAME_SCREENSHOTS: Record<string, string[]> = {
  "cyberpunk-2077": ["sc8k6a", "sc8k6b", "sc8k6c", "sc8k6d", "sc8k6e"],
  "zelda-tears-kingdom": ["scmj0m", "scmj0n", "scmj0o", "scmj0p", "scmj0q"],
  "elden-ring": ["sclihg", "sclihh", "sclihi", "sclihj", "sclihk"],
  "spider-man-miles": ["sck11t", "sck11u", "sck11v", "sck11w"],
  "red-dead-2": ["scfa7i", "scfa7j", "scfa7k", "scfa7l", "scfa7m"],
  "pokemon-legends-za": ["scrhs5", "scrhs6", "scrhs7", "scrhs8"],
  "mario-kart-8": ["sccz31", "sccz32", "sccz33", "sccz34"],
  "gta-v": ["scbgb5", "scbgb6", "scbgb7", "scbgb8", "scbgb9"],
  "hollow-knight": ["scd08p", "scd08q", "scd08r", "scd08s"],
  "stardew-valley": ["scfv5b", "scfv5c", "scfv5d", "scfv5e"],
  "resident-evil-4": ["scm0g4", "scm0g5", "scm0g6", "scm0g7", "scm0g8"],
  "f1-24": ["scpnqp", "scpnqq", "scpnqr", "scpnqs"],
  "fifa-25": ["scqsp2", "scqsp3", "scqsp4", "scqsp5"],
  "civilization-vi": ["sc7evx", "sc7evy", "sc7evz", "sc7ew0"],
  "pokemon-emerald": ["scdl0u", "scdl0v", "scdl0w"],
  "super-mario-64": ["scf2ue", "scf2uf", "scf2ug"],
  "zelda-oot": ["scdmgg", "scdmgh", "scdmgi", "scdmgj"],
  "chrono-trigger": ["scfuhc", "scfuhd", "scfuhe"],
  "metroid-prime": ["scer0u", "scer0v", "scer0w"],
  "gow-psp": ["scdxpt", "scdxpu", "scdxpv"],
  "shenmue": ["sccr0a", "sccr0b", "sccr0c"],
  "halo-infinite": ["sclrax", "sclray", "sclraz", "sclrb0"],
  "forza-horizon-5": ["scn9fs", "scn9ft", "scn9fu", "scn9fv", "scn9fw"],
  "ghost-of-tsushima": ["scg5j7", "scg5j8", "scg5j9", "scg5ja"],
};

const FALLBACK_SCREENSHOT_IDS = ["scshp", "sctng", "scs4s"];

const cover = (slug: string) => COVER_OVERRIDES[slug] ?? FALLBACK_COVER;
const screenshots = (slug: string) => {
  const ids = GAME_SCREENSHOTS[slug] ?? FALLBACK_SCREENSHOT_IDS;
  return ids.map((id) => IGDB_SHOT(id));
};

// Platform name → slug mapping
const PLATFORM_SLUG_MAP: Record<string, string> = {
  PC: "pc",
  "Nintendo Switch": "switch",
  PlayStation: "playstation",
  Xbox: "xbox",
  GBA: "gba",
  SNES: "snes",
  N64: "n64",
  NDS: "nds",
  PSP: "psp",
  Dreamcast: "dreamcast",
  Wii: "wii",
  PS2: "ps2",
};

// ── Seed Data ──

const platformsData = [
  { slug: "pc", name: "PC", classic: false, icon: "Monitor", color: "#3B82F6", sortOrder: 0 },
  { slug: "switch", name: "Nintendo Switch", classic: false, icon: "Gamepad2", color: "#EF4444", sortOrder: 1 },
  { slug: "playstation", name: "PlayStation", classic: false, icon: "Disc3", color: "#2563EB", sortOrder: 2 },
  { slug: "xbox", name: "Xbox", classic: false, icon: "Shield", color: "#22C55E", sortOrder: 3 },
  { slug: "gba", name: "GBA", classic: true, icon: "Smartphone", color: "#7C3AED", sortOrder: 4 },
  { slug: "snes", name: "SNES", classic: true, icon: "Gamepad", color: "#6366F1", sortOrder: 5 },
  { slug: "n64", name: "N64", classic: true, icon: "Joystick", color: "#F59E0B", sortOrder: 6 },
  { slug: "nds", name: "NDS", classic: true, icon: "TabletSmartphone", color: "#06B6D4", sortOrder: 7 },
  { slug: "psp", name: "PSP", classic: true, icon: "TvMinimalPlay", color: "#8B5CF6", sortOrder: 8 },
  { slug: "dreamcast", name: "Dreamcast", classic: true, icon: "Orbit", color: "#F97316", sortOrder: 9 },
  { slug: "wii", name: "Wii", classic: true, icon: "Sparkles", color: "#14B8A6", sortOrder: 10 },
  { slug: "ps2", name: "PS2", classic: true, icon: "Disc2", color: "#1D4ED8", sortOrder: 11 },
];

const categoriesData = [
  { slug: "action", name: "Action", icon: "Sword", description: "Fast-paced, reflex-driven gameplay across modern and classic titles." },
  { slug: "rpg", name: "RPG", icon: "Sparkles", description: "Deep narratives, character builds, and expansive worlds." },
  { slug: "adventure", name: "Adventure", icon: "Map", description: "Story-rich exploration across handcrafted worlds." },
  { slug: "racing", name: "Racing", icon: "Flag", description: "Arcade to simulation racers on every platform." },
  { slug: "sports", name: "Sports", icon: "Trophy", description: "Yearly franchises and arcade sports classics." },
  { slug: "horror", name: "Horror", icon: "Ghost", description: "Survival, psychological, and atmospheric horror." },
  { slug: "indie", name: "Indie", icon: "Leaf", description: "Hand-crafted gems from independent studios." },
  { slug: "strategy", name: "Strategy", icon: "Brain", description: "Turn-based, real-time, and grand strategy classics." },
];

// ── "Games" ContentType field definitions ──
// These define the dynamic fields that go into Content.fields JSONB

const gamesFieldDefinitions = [
  // Details group
  { slug: "genre", name: "Genre", fieldType: FieldType.SELECT, isRequired: true, sortOrder: 0, group: "details", showInList: true, showInDetail: true, isFilterable: true, isSortable: true, options: ["Action", "RPG", "Adventure", "Racing", "Sports", "Horror", "Indie", "Strategy", "Puzzle", "Simulation", "Fighting", "Platformer"] },
  { slug: "rating", name: "Rating", fieldType: FieldType.RATING, isRequired: false, sortOrder: 1, group: "details", showInList: true, showInDetail: true, isFilterable: false, isSortable: true, validation: { min: 0, max: 5 } },
  { slug: "releaseDate", name: "Release Date", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "details", showInList: false, showInDetail: true, isFilterable: false, isSortable: true },
  { slug: "developer", name: "Developer", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, placeholder: "e.g. CD Projekt Red" },
  { slug: "publisher", name: "Publisher", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 4, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, placeholder: "e.g. Nintendo" },

  // Technical group
  { slug: "fileSize", name: "File Size", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 0, group: "technical", showInList: true, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. 72 GB" },
  { slug: "version", name: "Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. v2.31" },
  { slug: "romFormat", name: "ROM Format", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, placeholder: "e.g. .NSP, REPACK, .GBA" },
  { slug: "titleId", name: "Title ID", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "requiredFirmware", name: "Required Firmware", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 4, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "region", name: "Region", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 5, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },

  // Engagement group
  { slug: "likes", name: "Likes", fieldType: FieldType.NUMBER, isRequired: false, sortOrder: 0, group: "engagement", showInList: false, showInDetail: true, isFilterable: false, isSortable: true, defaultValue: 0 },
  { slug: "dislikes", name: "Dislikes", fieldType: FieldType.NUMBER, isRequired: false, sortOrder: 1, group: "engagement", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, defaultValue: 0 },

  // Flags group
  { slug: "isRom", name: "Is ROM", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 0, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isTrending", name: "Is Trending", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 1, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isPopular", name: "Is Popular", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 2, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "updatedToday", name: "Updated Today", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 3, group: "flags", showInList: false, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },

  // Media group
  { slug: "screenshots", name: "Screenshots", fieldType: FieldType.IMAGE_ARRAY, isRequired: false, sortOrder: 0, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "features", name: "Features", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "languages", name: "Languages", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 2, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },

  // System Requirements group
  { slug: "systemReqMin", name: "Minimum Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 0, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "systemReqRec", name: "Recommended Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
];

// ── Game content data ──

const baseFeatures = [
  "Pre-installed and ready to play",
  "Full English language support",
  "Includes all DLC and patches",
  "No DRM, no online activation",
];
const baseReq = {
  min: ["OS: Windows 10 64-bit", "CPU: Intel i5-3570K", "RAM: 8 GB", "GPU: GTX 780", "Storage: 70 GB"],
  rec: ["OS: Windows 11 64-bit", "CPU: Intel i7-9700K", "RAM: 16 GB", "GPU: RTX 2070", "Storage: 70 GB SSD"],
};

type GameSeed = {
  slug: string;
  title: string;
  platform: string[];
  downloads: number;
  popularity: number;
  description: string;
  // Dynamic fields (stored in JSONB)
  genre: string;
  rating: number;
  releaseDate: string;
  developer: string;
  publisher: string;
  fileSize: string;
  version?: string;
  romFormat: string;
  isRom: boolean;
  isTrending: boolean;
  isPopular: boolean;
  updatedToday: boolean;
};

const gamesData: GameSeed[] = [
  { slug: "cyberpunk-2077", title: "Cyberpunk 2077", platform: ["PC"], genre: "RPG", rating: 4.5, downloads: 284512, version: "v2.31", fileSize: "72 GB", romFormat: "REPACK", developer: "CD Projekt Red", publisher: "CD Projekt", isTrending: true, isPopular: true, updatedToday: true, popularity: 96, isRom: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "zelda-tears-kingdom", title: "Zelda: Tears of the Kingdom", platform: ["Nintendo Switch"], genre: "Adventure", rating: 4.9, downloads: 412900, fileSize: "16.3 GB", romFormat: ".NSP", version: "v1.2.1", developer: "Nintendo EPD", publisher: "Nintendo", isRom: true, isTrending: true, isPopular: true, updatedToday: true, popularity: 99, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "elden-ring", title: "Elden Ring", platform: ["PC"], genre: "RPG", rating: 4.8, downloads: 198443, fileSize: "60 GB", romFormat: "REPACK", version: "v1.12", developer: "FromSoftware", publisher: "Bandai Namco", isTrending: true, isPopular: true, popularity: 95, isRom: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "spider-man-miles", title: "Spider-Man: Miles Morales", platform: ["PC", "PlayStation"], genre: "Action", rating: 4.6, downloads: 142001, fileSize: "50 GB", romFormat: "REPACK", developer: "Insomniac", publisher: "Sony", isTrending: true, popularity: 88, isRom: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "red-dead-2", title: "Red Dead Redemption 2", platform: ["PC"], genre: "Adventure", rating: 4.9, downloads: 322100, fileSize: "120 GB", romFormat: "REPACK", version: "v1.0.1491", developer: "Rockstar", publisher: "Rockstar", isTrending: true, isPopular: true, popularity: 97, isRom: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "pokemon-legends-za", title: "Pokémon Legends Z-A", platform: ["Nintendo Switch"], genre: "RPG", rating: 4.4, downloads: 88240, fileSize: "8.2 GB", romFormat: ".XCI", developer: "Game Freak", publisher: "Nintendo", isRom: true, isTrending: true, updatedToday: true, popularity: 84, isPopular: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "mario-kart-8", title: "Mario Kart 8 Deluxe", platform: ["Nintendo Switch"], genre: "Racing", rating: 4.8, downloads: 256780, fileSize: "6.7 GB", romFormat: ".NSZ", developer: "Nintendo", publisher: "Nintendo", isRom: true, isPopular: true, popularity: 92, isTrending: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "gta-v", title: "GTA V", platform: ["PC"], genre: "Action", rating: 4.7, downloads: 502201, fileSize: "94 GB", romFormat: "REPACK", developer: "Rockstar", publisher: "Rockstar", isPopular: true, popularity: 98, isRom: false, isTrending: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "hollow-knight", title: "Hollow Knight", platform: ["PC", "Nintendo Switch"], genre: "Indie", rating: 4.9, downloads: 88210, fileSize: "1.2 GB", romFormat: "GOG", developer: "Team Cherry", publisher: "Team Cherry", popularity: 89, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "stardew-valley", title: "Stardew Valley", platform: ["PC"], genre: "Indie", rating: 4.9, downloads: 199001, fileSize: "500 MB", romFormat: "GOG", developer: "ConcernedApe", publisher: "ConcernedApe", popularity: 90, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "resident-evil-4", title: "Resident Evil 4 Remake", platform: ["PC"], genre: "Horror", rating: 4.7, downloads: 112045, fileSize: "67 GB", romFormat: "REPACK", developer: "Capcom", publisher: "Capcom", updatedToday: true, popularity: 86, isRom: false, isTrending: false, isPopular: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "f1-24", title: "F1 24", platform: ["PC"], genre: "Racing", rating: 4.1, downloads: 22001, fileSize: "44 GB", romFormat: "REPACK", developer: "Codemasters", publisher: "EA", popularity: 64, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "fifa-25", title: "EA Sports FC 25", platform: ["PC"], genre: "Sports", rating: 4.0, downloads: 80201, fileSize: "50 GB", romFormat: "REPACK", developer: "EA Vancouver", publisher: "EA", popularity: 70, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "civilization-vi", title: "Civilization VI", platform: ["PC"], genre: "Strategy", rating: 4.5, downloads: 64012, fileSize: "12 GB", romFormat: "GOG", developer: "Firaxis", publisher: "2K", popularity: 75, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "pokemon-emerald", title: "Pokémon Emerald", platform: ["GBA"], genre: "RPG", rating: 4.9, downloads: 902111, fileSize: "16 MB", romFormat: ".GBA", developer: "Game Freak", publisher: "Nintendo", isRom: true, isPopular: true, popularity: 99, isTrending: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "super-mario-64", title: "Super Mario 64", platform: ["N64"], genre: "Adventure", rating: 4.9, downloads: 502300, fileSize: "8 MB", romFormat: ".Z64", developer: "Nintendo EAD", publisher: "Nintendo", isRom: true, popularity: 96, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "zelda-oot", title: "Zelda: Ocarina of Time", platform: ["N64"], genre: "Adventure", rating: 5.0, downloads: 612000, fileSize: "32 MB", romFormat: ".Z64", developer: "Nintendo EAD", publisher: "Nintendo", isRom: true, isPopular: true, popularity: 99, isTrending: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "chrono-trigger", title: "Chrono Trigger", platform: ["SNES"], genre: "RPG", rating: 5.0, downloads: 320111, fileSize: "4 MB", romFormat: ".SFC", developer: "Square", publisher: "Square", isRom: true, popularity: 97, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "metroid-prime", title: "Metroid Prime", platform: ["NDS"], genre: "Adventure", rating: 4.6, downloads: 88100, fileSize: "64 MB", romFormat: ".NDS", developer: "Retro Studios", publisher: "Nintendo", isRom: true, popularity: 78, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "gow-psp", title: "God of War: Chains of Olympus", platform: ["PSP"], genre: "Action", rating: 4.6, downloads: 121000, fileSize: "1.1 GB", romFormat: ".ISO", developer: "Ready at Dawn", publisher: "Sony", isRom: true, popularity: 80, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "shenmue", title: "Shenmue", platform: ["Dreamcast"], genre: "Adventure", rating: 4.5, downloads: 22001, fileSize: "1.2 GB", romFormat: ".CDI", developer: "Sega AM2", publisher: "Sega", isRom: true, popularity: 68, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "halo-infinite", title: "Halo Infinite", platform: ["Xbox", "PC"], genre: "Action", rating: 4.3, downloads: 90120, fileSize: "48 GB", romFormat: "REPACK", developer: "343 Industries", publisher: "Xbox Game Studios", updatedToday: true, popularity: 82, isRom: false, isTrending: false, isPopular: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "forza-horizon-5", title: "Forza Horizon 5", platform: ["Xbox", "PC"], genre: "Racing", rating: 4.8, downloads: 178200, fileSize: "110 GB", romFormat: "REPACK", developer: "Playground Games", publisher: "Xbox Game Studios", popularity: 91, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
  { slug: "ghost-of-tsushima", title: "Ghost of Tsushima", platform: ["PlayStation", "PC"], genre: "Adventure", rating: 4.8, downloads: 142078, fileSize: "75 GB", romFormat: "REPACK", developer: "Sucker Punch", publisher: "Sony", popularity: 89, isRom: false, isTrending: false, isPopular: false, updatedToday: false, releaseDate: "2024-06-12", description: "An expansive, atmospheric experience that blends tight gameplay with a sweeping narrative across a hand-crafted world." },
];

const articlesData = [
  { slug: "switch-library-expanded", title: "Nintendo Switch Library Just Got Bigger", category: "Updates", date: "2025-06-12", author: "Alex Mendez", excerpt: "We added 240 new Switch titles this week, including the latest Pokémon expansion.", image: IGDB_HD("co5vmg"), body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
  { slug: "rom-format-explained", title: "ROM Formats Explained: NSP vs XCI vs NSZ", category: "Guides", date: "2025-06-10", author: "Sam Park", excerpt: "A quick primer on the file formats you'll see on every Switch download.", image: IGDB_HD("co4jni"), body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." },
  { slug: "weekly-trending", title: "Trending This Week: Cyberpunk 2.31", category: "Trending", date: "2025-06-09", author: "Mira Chen", excerpt: "Phantom Liberty's latest patch is driving a new wave of installs.", image: IGDB_HD("co4hk6"), body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit." },
  { slug: "retro-revival", title: "The Retro Revival: GBA Is Back On Top", category: "Editorial", date: "2025-06-07", author: "Jordan Reed", excerpt: "Why classic GBA ROMs are the most-downloaded category this month.", image: IGDB_HD("co3p2d"), body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Excepteur sint occaecat cupidatat non proident." },
  { slug: "request-queue", title: "Inside the Request Queue: What's Coming Next", category: "Platform", date: "2025-06-05", author: "Alex Mendez", excerpt: "A peek at the most-requested titles we're sourcing right now.", image: IGDB_HD("co1q1f"), body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation." },
  { slug: "dreamcast-archive", title: "Saving Dreamcast: An Archive Effort", category: "Editorial", date: "2025-06-02", author: "Mira Chen", excerpt: "Preserving Sega's last console one ROM at a time.", image: IGDB_HD("co2lbd"), body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit." },
];

const requestsData = [
  { title: "Silent Hill 2 Remake", platform: "PC", status: "IN_REVIEW" as const },
  { title: "Metroid Prime 4", platform: "Switch", status: "PENDING" as const },
  { title: "Bloodborne PC", platform: "PC", status: "PENDING" as const },
  { title: "Persona 3 Reload", platform: "PS5", status: "AVAILABLE" as const },
  { title: "Banjo-Kazooie", platform: "N64", status: "AVAILABLE" as const },
];

const defaultSettings = [
  { key: "site_name", value: "VAULTROM", group: "general" },
  { key: "site_description", value: "Your trusted source for game downloads", group: "general" },
  { key: "meta_title", value: "VAULTROM - Game Downloads Portal", group: "seo" },
  { key: "meta_description", value: "Download games, ROMs, and repacks for PC, Switch, PlayStation, Xbox, and retro consoles.", group: "seo" },
  { key: "homepage_hero_title", value: "Download Games. No Limits.", group: "homepage" },
  { key: "about_heading", value: "About VAULTROM", group: "about" },
  { key: "about_content", value: "VAULTROM is a curated archive of ROMs, PC games, and indie titles spanning multiple platforms. Every entry is verified, versioned, and updated daily.", group: "about" },
  { key: "about_mission", value: "Our mission is to preserve and provide access to games across every platform — from modern PC releases and Nintendo Switch titles to classic GBA and SNES ROMs. All downloads are free and always will be.", group: "about" },
];

// ── Main seed function ──

async function main() {
  console.log("Seeding database...\n");

  const siteId = process.env.SITE_ID || "vaultrom";
  const siteName = process.env.SITE_NAME || "VAULTROM";

  // 1. Create admin users
  const adminEmail = process.env.ADMIN_EMAIL || "admin@vaultrom.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const testHash = await bcrypt.hash("testpass123", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "Super Admin", role: Role.SUPER_ADMIN },
  });
  await prisma.user.upsert({
    where: { email: "gamer@vaultrom.com" },
    update: {},
    create: { email: "gamer@vaultrom.com", passwordHash: testHash, name: "Game Manager", role: Role.GAME_MANAGER },
  });
  await prisma.user.upsert({
    where: { email: "content@vaultrom.com" },
    update: {},
    create: { email: "content@vaultrom.com", passwordHash: testHash, name: "Content Manager", role: Role.CONTENT_MANAGER },
  });
  console.log(`  Users: admin + 2 test accounts seeded`);

  // 2. Create Site
  const site = await prisma.site.upsert({
    where: { siteId },
    update: { name: siteName },
    create: { siteId, name: siteName, domain: "localhost", description: "VAULTROM game download portal" },
  });
  console.log(`  Site: ${site.name} (${site.siteId})`);

  // 3. Create ContentType "Games"
  const gamesType = await prisma.contentType.upsert({
    where: { slug: "games" },
    update: { name: "Games" },
    create: { slug: "games", name: "Games", icon: "Gamepad2", description: "Downloadable games and ROMs", sortOrder: 0 },
  });
  console.log(`  ContentType: ${gamesType.name} (${gamesType.slug})`);

  // 4. Create ContentTypeFields for "Games"
  // Delete existing fields first (for clean re-seed)
  await prisma.contentTypeField.deleteMany({ where: { contentTypeId: gamesType.id } });

  for (const field of gamesFieldDefinitions) {
    await prisma.contentTypeField.create({
      data: {
        contentTypeId: gamesType.id,
        slug: field.slug,
        name: field.name,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        sortOrder: field.sortOrder,
        group: field.group,
        showInList: field.showInList,
        showInDetail: field.showInDetail,
        isFilterable: field.isFilterable,
        isSortable: field.isSortable,
        options: field.options ? field.options : undefined,
        validation: field.validation ? field.validation : undefined,
        defaultValue: field.defaultValue !== undefined ? field.defaultValue : undefined,
        placeholder: field.placeholder ?? undefined,
      },
    });
  }
  console.log(`  ContentTypeFields: ${gamesFieldDefinitions.length} fields for "Games"`);

  // 5. Seed platforms + PlatformContentType
  const platformMap: Record<string, string> = {};
  for (const p of platformsData) {
    const platform = await prisma.platform.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
    platformMap[p.slug] = platform.id;

    // Link platform to "Games" content type
    await prisma.platformContentType.upsert({
      where: { platformId_contentTypeId: { platformId: platform.id, contentTypeId: gamesType.id } },
      update: {},
      create: { platformId: platform.id, contentTypeId: gamesType.id },
    });
  }
  console.log(`  Platforms: ${platformsData.length} seeded + linked to "Games" type`);

  // 6. Seed categories with contentTypeId
  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { ...c, contentTypeId: gamesType.id },
      create: { ...c, contentTypeId: gamesType.id },
    });
  }
  console.log(`  Categories: ${categoriesData.length} seeded (linked to "Games" type)`);

  // 7. Seed Content items (replaces Game seeding)
  for (const g of gamesData) {
    const screenshotUrls = screenshots(g.slug);

    // Build JSONB fields object
    const fields: Prisma.InputJsonValue = {
      genre: g.genre,
      rating: g.rating,
      releaseDate: g.releaseDate,
      developer: g.developer,
      publisher: g.publisher,
      fileSize: g.fileSize,
      version: g.version,
      romFormat: g.romFormat,
      titleId: "0100F43008C44000",
      requiredFirmware: "N/A",
      region: "USA",
      likes: 82,
      dislikes: 9,
      isRom: g.isRom,
      isTrending: g.isTrending,
      isPopular: g.isPopular,
      updatedToday: g.updatedToday,
      screenshots: screenshotUrls,
      features: baseFeatures,
      languages: ["English", "French", "Spanish"],
      systemReqMin: baseReq.min,
      systemReqRec: baseReq.rec,
    };

    const content = await prisma.content.upsert({
      where: { slug: g.slug },
      update: {
        title: g.title,
        downloads: g.downloads,
        popularity: g.popularity,
        fields,
      },
      create: {
        contentTypeId: gamesType.id,
        slug: g.slug,
        title: g.title,
        coverImage: cover(g.slug),
        description: g.description,
        downloads: g.downloads,
        popularity: g.popularity,
        isPublished: true,
        fields,
      },
    });

    // Create ContentSite junction (this content belongs to this site)
    await prisma.contentSite.upsert({
      where: { contentId_siteId: { contentId: content.id, siteId: site.id } },
      update: {},
      create: { contentId: content.id, siteId: site.id },
    });

    // Create ContentPlatform junctions
    for (const platName of g.platform) {
      const platSlug = PLATFORM_SLUG_MAP[platName];
      if (platSlug && platformMap[platSlug]) {
        await prisma.contentPlatform.upsert({
          where: { contentId_platformId: { contentId: content.id, platformId: platformMap[platSlug] } },
          update: {},
          create: { contentId: content.id, platformId: platformMap[platSlug] },
        });
      }
    }
  }
  console.log(`  Content: ${gamesData.length} games seeded with JSONB fields + site/platform links`);

  // 8. Seed articles (unchanged)
  for (const a of articlesData) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: a,
      create: { ...a, isPublished: true },
    });
  }
  console.log(`  Articles: ${articlesData.length} seeded`);

  // 9. Seed content requests (replaces game requests)
  for (const r of requestsData) {
    const existing = await prisma.contentRequest.findFirst({ where: { title: r.title } });
    if (!existing) {
      await prisma.contentRequest.create({ data: r });
    }
  }
  console.log(`  Content Requests: ${requestsData.length} seeded`);

  // 10. Seed site settings (now linked to site)
  for (const s of defaultSettings) {
    const existing = await prisma.siteSetting.findFirst({
      where: { key: s.key, siteId: site.id },
    });
    if (!existing) {
      await prisma.siteSetting.create({
        data: { ...s, siteId: site.id },
      });
    }
  }
  console.log(`  Settings: ${defaultSettings.length} seeded (linked to site)`);

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
