"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { RequirementsEditor } from "@/components/content/RequirementsEditor";
import { X, Plus, Star } from "lucide-react";

const ROM_FORMATS = [
  ".nes", ".snes", ".gba", ".gbc", ".nds", ".n64", ".z64",
  ".iso", ".bin", ".cue", ".zip", ".7z", ".rar",
];

const FIRMWARE_SUGGESTIONS = [
  "Latest", "OFW 11.0", "CFW Required", "BIOS Required", "N/A",
];

const FEATURE_OPTIONS = [
  "Multiplayer", "Single Player", "Co-op", "Online", "Offline",
  "Controller Support", "Cloud Save", "Achievements", "Leaderboards",
  "Cross-Platform", "VR Support", "Mod Support", "Split Screen",
  "Open World", "Sandbox", "Story Mode", "Free Roam",
  "DLC Available", "Season Pass", "Microtransactions",
];

const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "German", "Italian",
  "Portuguese", "Russian", "Chinese", "Japanese", "Korean",
  "Arabic", "Dutch", "Polish", "Turkish", "Thai",
  "Vietnamese", "Indonesian", "Hindi", "Swedish", "Norwegian",
];

const VERSION_OPTIONS = [
  "1.0", "1.0.0", "1.0.1", "1.1", "1.1.0", "1.2", "2.0", "Latest",
];

const REGION_OPTIONS = [
  "Global", "USA", "Europe", "Japan", "Asia", "China",
  "Korea", "Australia", "Brazil", "Russia", "Multi-Region",
];

function TagSelector({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-background hover:bg-muted"
            }`}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function slugMatches(slug: string, ...patterns: string[]): boolean {
  const lower = slug.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export interface FieldDefinition {
  id: string;
  slug: string;
  name: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue: unknown;
  options: string[] | null;
  placeholder: string | null;
  helpText: string | null;
  sortOrder: number;
  group: string;
  validation: Record<string, unknown> | null;
  showInList?: boolean;
}

interface DynamicFieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  contentTypeId?: string;
}

function isGenreField(slug: string): boolean {
  const lower = slug.toLowerCase();
  return lower.includes("genre") || lower.includes("category");
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  contentTypeId,
}: DynamicFieldRendererProps) {
  const [arrayInput, setArrayInput] = useState("");
  const [fetchedOptions, setFetchedOptions] = useState<string[] | null>(null);

  const id = `field-${field.slug}`;
  const validation = field.validation || {};
  const min = validation.min as number | undefined;
  const max = validation.max as number | undefined;

  // Fetch genre/category options from the categories API (only if the field has no options defined)
  const shouldFetchGenres =
    (field.fieldType === "SELECT" || field.fieldType === "MULTI_SELECT") &&
    isGenreField(field.slug) &&
    (!field.options || field.options.length === 0);

  useEffect(() => {
    if (!shouldFetchGenres) return;
    const params = contentTypeId ? `?contentTypeId=${contentTypeId}&includeGeneral=true` : "";
    api<{ success: boolean; data: Array<{ name: string }> }>(`/admin/categories${params}`)
      .then((res) => {
        setFetchedOptions(res.data.map((c) => c.name));
      })
      .catch(() => {});
  }, [shouldFetchGenres, contentTypeId]);

  // Use field.options if defined, otherwise use fetched categories
  const effectiveOptions = field.options && field.options.length > 0
    ? field.options
    : (fetchedOptions ?? []);

  function renderInput() {
    switch (field.fieldType) {
      case "TEXT": {
        const slug = field.slug.toLowerCase();

        // ROM Format → Select dropdown
        if (slugMatches(slug, "rom_format", "romformat")) {
          return (
            <Select
              value={(value as string) || ""}
              onValueChange={(v) => onChange(v)}
            >
              <SelectTrigger id={id}>
                <SelectValue placeholder="Select format..." />
              </SelectTrigger>
              <SelectContent>
                {ROM_FORMATS.map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    {fmt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        // Firmware → Text + quick-fill buttons
        if (slugMatches(slug, "firmware", "required_firmware")) {
          return (
            <div className="space-y-2">
              <Input
                id={id}
                placeholder={field.placeholder || "e.g. Latest"}
                value={(value as string) || ""}
                onChange={(e) => onChange(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {FIRMWARE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="px-2 py-0.5 text-xs rounded-md border border-input bg-background hover:bg-muted transition-colors"
                    onClick={() => onChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // Version → input + option tabs
        if (slugMatches(slug, "version")) {
          return (
            <div className="space-y-2">
              <Input
                id={id}
                placeholder={field.placeholder || "e.g., 1.0.0"}
                value={(value as string) || ""}
                onChange={(e) => onChange(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {VERSION_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                      value === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-background hover:bg-muted"
                    }`}
                    onClick={() => onChange(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // Region → dropdown
        if (slugMatches(slug, "region")) {
          return (
            <Select
              value={(value as string) || ""}
              onValueChange={(v) => onChange(v)}
            >
              <SelectTrigger id={id}>
                <SelectValue placeholder="Select region..." />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        // Release date → date picker
        if (slugMatches(slug, "release_date", "releasedate", "release")) {
          return (
            <Input
              id={id}
              type="date"
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
            />
          );
        }

        // Requirements → structured editor (when stored as TEXT)
        if (slugMatches(slug, "requirements", "systemreq")) {
          return (
            <RequirementsEditor
              value={(value as string) || ""}
              onChange={(v) => onChange(v)}
            />
          );
        }

        // Title ID → helpful placeholder
        if (slugMatches(slug, "title_id", "titleid")) {
          return (
            <Input
              id={id}
              placeholder={field.placeholder || "e.g., CUSA12345 / 0100..."}
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
            />
          );
        }

        // Default text input
        return (
          <Input
            id={id}
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      }

      case "URL":
        return (
          <Input
            id={id}
            type="url"
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "IMAGE":
        return (
          <ImageUpload
            id={id}
            value={(value as string) || ""}
            onChange={(url) => onChange(url)}
            placeholder={field.placeholder || "Image URL"}
          />
        );

      case "TEXTAREA":
      case "RICH_TEXT":
        // Requirements fields → structured key-value editor
        if (slugMatches(field.slug, "requirements", "systemreq")) {
          return (
            <RequirementsEditor
              value={(value as string) || ""}
              onChange={(v) => onChange(v)}
            />
          );
        }

        return (
          <textarea
            id={id}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={field.placeholder || ""}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "NUMBER":
        return (
          <Input
            id={id}
            type="number"
            placeholder={field.placeholder || ""}
            min={min ?? 0}
            max={max}
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const v = e.target.value;
              onChange(v === "" ? undefined : Number(v));
            }}
          />
        );

      case "RATING":
        return <RatingInput value={(value as number) || 0} onChange={onChange} max={max || 5} />;

      case "BOOLEAN":
        return (
          <div className="flex items-center gap-2 pt-1">
            <Switch
              id={id}
              checked={!!value}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "Yes" : "No"}
            </span>
          </div>
        );

      case "DATE":
        return (
          <Input
            id={id}
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "SELECT":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {effectiveOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "MULTI_SELECT": {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        const available = effectiveOptions.filter(
          (o) => !selected.includes(o),
        );
        return (
          <div className="space-y-2">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((opt) => (
                  <Badge key={opt} variant="secondary" className="gap-1 pr-1">
                    {opt}
                    <button
                      type="button"
                      onClick={() =>
                        onChange(selected.filter((s) => s !== opt))
                      }
                      className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {available.length > 0 && (
              <Select
                value=""
                onValueChange={(v) => onChange([...selected, v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add..." />
                </SelectTrigger>
                <SelectContent>
                  {available.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      }

      case "TEXT_ARRAY": {
        // Requirements fields → structured key-value editor
        if (slugMatches(field.slug, "requirements", "systemreq")) {
          return (
            <RequirementsEditor
              value={typeof value === "string" ? value : (Array.isArray(value) ? JSON.stringify(value) : "")}
              onChange={(v) => onChange(v)}
            />
          );
        }

        const items = Array.isArray(value) ? (value as string[]) : [];

        // Detect features / languages slugs to show preset option tabs
        const presetOptions = slugMatches(field.slug, "feature")
          ? FEATURE_OPTIONS
          : slugMatches(field.slug, "language")
            ? LANGUAGE_OPTIONS
            : null;

        return (
          <div className="space-y-2">
            {/* Preset option tabs for features / languages */}
            {presetOptions && (
              <TagSelector
                options={presetOptions}
                selected={items}
                onToggle={(opt) => {
                  if (items.includes(opt)) {
                    onChange(items.filter((i) => i !== opt));
                  } else {
                    onChange([...items, opt]);
                  }
                }}
              />
            )}
            {/* Manual add input */}
            <div className="flex gap-2">
              <Input
                placeholder={field.placeholder || "Add custom item"}
                value={arrayInput}
                onChange={(e) => setArrayInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = arrayInput.trim();
                    if (v && !items.includes(v)) {
                      onChange([...items, v]);
                      setArrayInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const v = arrayInput.trim();
                  if (v && !items.includes(v)) {
                    onChange([...items, v]);
                    setArrayInput("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Selected items (only show items not in presets, or all if no presets) */}
            {items.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {items
                  .filter((item) => !presetOptions || !presetOptions.includes(item))
                  .map((item, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          onChange(items.filter((v) => v !== item))
                        }
                        className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        );
      }

      case "IMAGE_ARRAY": {
        const urls = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="space-y-3">
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <ImageUpload
                    value={url}
                    onChange={(newUrl) => {
                      const updated = [...urls];
                      updated[i] = newUrl;
                      onChange(updated);
                    }}
                    placeholder="Image URL"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 mt-0.5"
                  onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange([...urls, ""])}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Image
            </Button>
          </div>
        );
      }

      default:
        return (
          <Input
            id={id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  }

  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="flex items-center gap-1">
        {field.name}
        {field.isRequired && <span className="text-destructive">*</span>}
      </Label>
      {renderInput()}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}

// Star rating sub-component
function RatingInput({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: unknown) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1 pt-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            className="h-5 w-5"
            fill={star <= value ? "#f59e0b" : "none"}
            stroke={star <= value ? "#f59e0b" : "currentColor"}
          />
        </button>
      ))}
      <span className="text-sm text-muted-foreground ml-2">{value}/{max}</span>
    </div>
  );
}
