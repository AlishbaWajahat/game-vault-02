import { FieldType } from "@prisma/client";

interface FieldTemplate {
  slug: string;
  name: string;
  fieldType: FieldType;
  isRequired: boolean;
  sortOrder: number;
  group: string;
  showInList: boolean;
  showInDetail: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  options?: string[];
  validation?: Record<string, unknown>;
  defaultValue?: unknown;
  placeholder?: string;
}

// ── Template definitions keyed by content type slug ──

const gamesTemplate: FieldTemplate[] = [
  // Details
  { slug: "genre", name: "Genre", fieldType: FieldType.SELECT, isRequired: true, sortOrder: 0, group: "details", showInList: true, showInDetail: true, isFilterable: true, isSortable: true, options: ["Action", "RPG", "Adventure", "Racing", "Sports", "Horror", "Indie", "Strategy", "Puzzle", "Simulation", "Fighting", "Platformer"] },
  { slug: "rating", name: "Rating", fieldType: FieldType.RATING, isRequired: false, sortOrder: 1, group: "details", showInList: true, showInDetail: true, isFilterable: false, isSortable: true, validation: { min: 0, max: 5 } },
  { slug: "releaseDate", name: "Release Date", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "details", showInList: false, showInDetail: true, isFilterable: false, isSortable: true },
  { slug: "developer", name: "Developer", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, placeholder: "e.g. CD Projekt Red" },
  { slug: "publisher", name: "Publisher", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 4, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, placeholder: "e.g. Nintendo" },
  // Technical
  { slug: "fileSize", name: "File Size", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 0, group: "technical", showInList: true, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. 72 GB" },
  { slug: "version", name: "Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. v2.31" },
  { slug: "romFormat", name: "ROM Format", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, placeholder: "e.g. .NSP, REPACK, .GBA" },
  { slug: "titleId", name: "Title ID", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "requiredFirmware", name: "Required Firmware", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 4, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "region", name: "Region", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 5, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  // Engagement
  { slug: "likes", name: "Likes", fieldType: FieldType.NUMBER, isRequired: false, sortOrder: 0, group: "engagement", showInList: false, showInDetail: true, isFilterable: false, isSortable: true, defaultValue: 0 },
  { slug: "dislikes", name: "Dislikes", fieldType: FieldType.NUMBER, isRequired: false, sortOrder: 1, group: "engagement", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, defaultValue: 0 },
  // Flags
  { slug: "isRom", name: "Is ROM", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 0, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isTrending", name: "Is Trending", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 1, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isPopular", name: "Is Popular", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 2, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "updatedToday", name: "Updated Today", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 3, group: "flags", showInList: false, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  // Media
  { slug: "screenshots", name: "Screenshots", fieldType: FieldType.IMAGE_ARRAY, isRequired: false, sortOrder: 0, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "features", name: "Features", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "languages", name: "Languages", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 2, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  // System Requirements
  { slug: "systemReqMin", name: "Minimum Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 0, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "systemReqRec", name: "Recommended Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
];

const softwareTemplate: FieldTemplate[] = [
  // Details
  { slug: "genre", name: "Genre", fieldType: FieldType.SELECT, isRequired: true, sortOrder: 0, group: "details", showInList: true, showInDetail: true, isFilterable: true, isSortable: true, options: ["Action", "RPG", "Adventure", "Racing", "Sports", "Horror", "Indie", "Strategy", "Puzzle", "Simulation", "Fighting", "Platformer"] },
  { slug: "rating", name: "Rating", fieldType: FieldType.RATING, isRequired: false, sortOrder: 1, group: "details", showInList: true, showInDetail: true, isFilterable: false, isSortable: true, validation: { min: 0, max: 5 } },
  { slug: "developer", name: "Developer", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  { slug: "publisher", name: "Publisher", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  { slug: "releaseDate", name: "Release Date", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 4, group: "details", showInList: false, showInDetail: true, isFilterable: false, isSortable: true },
  // Technical
  { slug: "fileSize", name: "File Size", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 0, group: "technical", showInList: true, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. 500 MB" },
  { slug: "version", name: "Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. v3.0.1" },
  { slug: "license", name: "License", fieldType: FieldType.SELECT, isRequired: false, sortOrder: 2, group: "technical", showInList: true, showInDetail: true, isFilterable: true, isSortable: false, options: ["Free", "Freemium", "Paid", "Open Source", "Trial"] },
  { slug: "operatingSystem", name: "Operating System", fieldType: FieldType.MULTI_SELECT, isRequired: false, sortOrder: 3, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, options: ["Windows", "macOS", "Linux"] },
  { slug: "architecture", name: "Architecture", fieldType: FieldType.SELECT, isRequired: false, sortOrder: 4, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, options: ["x86", "x64", "ARM", "Universal"] },
  // Flags
  { slug: "isTrending", name: "Is Trending", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 0, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isPopular", name: "Is Popular", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 1, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "updatedToday", name: "Updated Today", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 2, group: "flags", showInList: false, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  // Media
  { slug: "screenshots", name: "Screenshots", fieldType: FieldType.IMAGE_ARRAY, isRequired: false, sortOrder: 0, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "features", name: "Features", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "languages", name: "Languages", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 2, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  // System Requirements
  { slug: "systemReqMin", name: "Minimum Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 0, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "systemReqRec", name: "Recommended Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
];

const pluginsTemplate: FieldTemplate[] = [
  // Details
  { slug: "rating", name: "Rating", fieldType: FieldType.RATING, isRequired: false, sortOrder: 0, group: "details", showInList: true, showInDetail: true, isFilterable: false, isSortable: true, validation: { min: 0, max: 5 } },
  { slug: "developer", name: "Developer", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  { slug: "releaseDate", name: "Release Date", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "details", showInList: false, showInDetail: true, isFilterable: false, isSortable: true },
  // Technical
  { slug: "fileSize", name: "File Size", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 0, group: "technical", showInList: true, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. 12 MB" },
  { slug: "version", name: "Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. v1.4.2" },
  { slug: "compatibleWith", name: "Compatible With", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. WordPress 6.x, Chrome 120+" },
  { slug: "license", name: "License", fieldType: FieldType.SELECT, isRequired: false, sortOrder: 3, group: "technical", showInList: true, showInDetail: true, isFilterable: true, isSortable: false, options: ["Free", "Freemium", "Paid", "Open Source"] },
];

const appsTemplate: FieldTemplate[] = [
  // Details
  { slug: "category", name: "Category", fieldType: FieldType.SELECT, isRequired: true, sortOrder: 0, group: "details", showInList: true, showInDetail: true, isFilterable: true, isSortable: true, options: ["Social", "Productivity", "Entertainment", "Finance", "Health", "Education", "Utility", "Communication"] },
  { slug: "rating", name: "Rating", fieldType: FieldType.RATING, isRequired: false, sortOrder: 1, group: "details", showInList: true, showInDetail: true, isFilterable: false, isSortable: true, validation: { min: 0, max: 5 } },
  { slug: "developer", name: "Developer", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  { slug: "publisher", name: "Publisher", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  { slug: "releaseDate", name: "Release Date", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 4, group: "details", showInList: false, showInDetail: true, isFilterable: false, isSortable: true },
  // Technical
  { slug: "fileSize", name: "File Size", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 0, group: "technical", showInList: true, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. 120 MB" },
  { slug: "version", name: "Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. v5.2.0" },
  { slug: "operatingSystem", name: "Operating System", fieldType: FieldType.MULTI_SELECT, isRequired: false, sortOrder: 2, group: "technical", showInList: false, showInDetail: true, isFilterable: true, isSortable: false, options: ["iOS", "Android", "Windows", "macOS"] },
  { slug: "minOsVersion", name: "Min OS Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, placeholder: "e.g. iOS 16+, Android 12+" },
  // Flags
  { slug: "isTrending", name: "Is Trending", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 0, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isPopular", name: "Is Popular", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 1, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "updatedToday", name: "Updated Today", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 2, group: "flags", showInList: false, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  // Media
  { slug: "screenshots", name: "Screenshots", fieldType: FieldType.IMAGE_ARRAY, isRequired: false, sortOrder: 0, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "features", name: "Features", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "languages", name: "Languages", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 2, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
];

const defaultTemplate: FieldTemplate[] = [
  // Details
  { slug: "rating", name: "Rating", fieldType: FieldType.RATING, isRequired: false, sortOrder: 0, group: "details", showInList: true, showInDetail: true, isFilterable: false, isSortable: true, validation: { min: 0, max: 5 } },
  { slug: "releaseDate", name: "Release Date", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "details", showInList: false, showInDetail: true, isFilterable: false, isSortable: true },
  { slug: "developer", name: "Developer", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 2, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  { slug: "publisher", name: "Publisher", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 3, group: "details", showInList: false, showInDetail: true, isFilterable: true, isSortable: false },
  // Technical
  { slug: "fileSize", name: "File Size", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 0, group: "technical", showInList: true, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "version", name: "Version", fieldType: FieldType.TEXT, isRequired: false, sortOrder: 1, group: "technical", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  // Engagement
  { slug: "likes", name: "Likes", fieldType: FieldType.NUMBER, isRequired: false, sortOrder: 0, group: "engagement", showInList: false, showInDetail: true, isFilterable: false, isSortable: true, defaultValue: 0 },
  { slug: "dislikes", name: "Dislikes", fieldType: FieldType.NUMBER, isRequired: false, sortOrder: 1, group: "engagement", showInList: false, showInDetail: true, isFilterable: false, isSortable: false, defaultValue: 0 },
  // Flags
  { slug: "isTrending", name: "Is Trending", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 0, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "isPopular", name: "Is Popular", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 1, group: "flags", showInList: true, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  { slug: "updatedToday", name: "Updated Today", fieldType: FieldType.BOOLEAN, isRequired: false, sortOrder: 2, group: "flags", showInList: false, showInDetail: false, isFilterable: true, isSortable: false, defaultValue: false },
  // Media
  { slug: "screenshots", name: "Screenshots", fieldType: FieldType.IMAGE_ARRAY, isRequired: false, sortOrder: 0, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "features", name: "Features", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "languages", name: "Languages", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 2, group: "media", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  // System Requirements
  { slug: "systemReqMin", name: "Minimum Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 0, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
  { slug: "systemReqRec", name: "Recommended Requirements", fieldType: FieldType.TEXT_ARRAY, isRequired: false, sortOrder: 1, group: "system_requirements", showInList: false, showInDetail: true, isFilterable: false, isSortable: false },
];

const templateMap: Record<string, FieldTemplate[]> = {
  games: gamesTemplate,
  software: softwareTemplate,
  plugins: pluginsTemplate,
  apps: appsTemplate,
};

// Partial match rules: slug substring → template key
const partialMatches: [string, string][] = [
  ["game", "games"],
  ["software", "software"],
  ["tool", "software"],
  ["plugin", "plugins"],
  ["extension", "plugins"],
  ["addon", "plugins"],
  ["app", "apps"],
  ["mobile", "apps"],
];

/**
 * Returns the field template for a given content type slug.
 * Checks exact match first, then partial (substring) matches, then falls back to default.
 */
export function getFieldTemplate(slug: string): FieldTemplate[] {
  const lower = slug.toLowerCase();

  // Exact match
  if (templateMap[lower]) {
    return templateMap[lower];
  }

  // Partial match
  for (const [substring, key] of partialMatches) {
    if (lower.includes(substring)) {
      return templateMap[key];
    }
  }

  return defaultTemplate;
}
