"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Zap } from "lucide-react";

const PRESET_KEYS = ["OS", "Processor", "RAM", "Storage", "GPU"];

const VALUE_PRESETS: Record<string, string[]> = {
  OS: ["Windows 7", "Windows 10", "Windows 11", "macOS", "Linux", "Android", "iOS"],
  Processor: [
    "Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9",
    "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7",
  ],
  RAM: ["2 GB", "4 GB", "8 GB", "12 GB", "16 GB", "32 GB"],
  Storage: ["500 MB", "1 GB", "2 GB", "5 GB", "10 GB", "20 GB", "50 GB", "100 GB"],
  GPU: [
    "Integrated", "GTX 750", "GTX 1050", "GTX 1060", "GTX 1660",
    "RTX 2060", "RTX 3060", "RTX 4060", "RX 570", "RX 580", "RX 6600",
  ],
};

const DEFAULT_VALUES: Record<string, string> = {
  OS: "Windows 10",
  Processor: "Intel Core i5",
  RAM: "8 GB",
  Storage: "20 GB",
  GPU: "GTX 1050",
};

interface RequirementsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface Row {
  key: string;
  value: string;
  customKey: boolean; // true if user typed a custom key
}

function parseRequirements(raw: string): Row[] {
  if (!raw) return [];

  // Try JSON first
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, val]) => ({
        key,
        value: String(val),
        customKey: !PRESET_KEYS.includes(key),
      }));
    }
  } catch {
    // Not JSON
  }

  // Try "Key: Value" line format
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length > 0 && lines.some((l) => l.includes(":"))) {
    return lines.map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { key: line.trim(), value: "", customKey: true };
      const key = line.slice(0, idx).trim();
      return {
        key,
        value: line.slice(idx + 1).trim(),
        customKey: !PRESET_KEYS.includes(key),
      };
    });
  }

  return [];
}

function rowsToJson(rows: Row[]): string {
  const obj: Record<string, string> = {};
  for (const row of rows) {
    if (row.key.trim()) {
      obj[row.key.trim()] = row.value.trim();
    }
  }
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : "";
}

export function RequirementsEditor({ value, onChange }: RequirementsEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => parseRequirements(value));

  useEffect(() => {
    const parsed = parseRequirements(value);
    if (parsed.length > 0 && rows.length === 0) {
      setRows(parsed);
    }
    // Only run when value changes externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function updateRows(newRows: Row[]) {
    setRows(newRows);
    onChange(rowsToJson(newRows));
  }

  function updateRow(index: number, field: "key" | "value", val: string) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    updateRows(updated);
  }

  function addRow() {
    updateRows([...rows, { key: "", value: "", customKey: true }]);
  }

  function removeRow(index: number) {
    updateRows(rows.filter((_, i) => i !== index));
  }

  function addStandardRequirements(withDefaults: boolean) {
    const existing = rows.map((r) => r.key);
    const newRows = PRESET_KEYS.filter((k) => !existing.includes(k)).map(
      (key) => ({ key, value: withDefaults ? (DEFAULT_VALUES[key] || "") : "", customKey: false }),
    );
    updateRows([...rows, ...newRows]);
  }

  function handleKeyChange(index: number, val: string) {
    if (val === "__custom__") {
      const updated = [...rows];
      updated[index] = { key: "", value: updated[index].value, customKey: true };
      setRows(updated);
      onChange(rowsToJson(updated));
    } else {
      const updated = [...rows];
      updated[index] = { ...updated[index], key: val, customKey: false };
      updateRows(updated);
    }
  }

  // Keys already used (to avoid duplicates in dropdown)
  const usedKeys = rows.map((r) => r.key);

  if (rows.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addStandardRequirements(true)}
        >
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          Add with Defaults
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addStandardRequirements(false)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Empty Fields
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addRow}
        >
          Custom Row
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => {
        const presets = VALUE_PRESETS[row.key] || null;
        return (
          <div key={i} className="rounded-lg border border-input bg-background/50 p-2.5 space-y-2">
            <div className="flex gap-2 items-center">
              {/* Key: dropdown or text input */}
              {row.customKey ? (
                <Input
                  placeholder="Custom key..."
                  value={row.key}
                  onChange={(e) => updateRow(i, "key", e.target.value)}
                  className="w-[140px] h-8 text-sm font-medium"
                  autoFocus={!row.key}
                />
              ) : (
                <Select
                  value={row.key || undefined}
                  onValueChange={(val) => handleKeyChange(i, val)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm font-medium">
                    <SelectValue placeholder="Select key" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_KEYS.map((k) => (
                      <SelectItem
                        key={k}
                        value={k}
                        disabled={usedKeys.includes(k) && row.key !== k}
                      >
                        {k}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">+ Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {/* Value input */}
              <Input
                placeholder={row.key ? `Enter ${row.key} requirement...` : "Value..."}
                value={row.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Value preset pills */}
            {presets && (
              <div className="flex flex-wrap gap-1">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                      row.value === p
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/40"
                    }`}
                    onClick={() => updateRow(i, "value", p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Row
        </Button>
        {!PRESET_KEYS.every((k) => rows.some((r) => r.key === k)) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addStandardRequirements(false)}
          >
            Add Missing Presets
          </Button>
        )}
      </div>
    </div>
  );
}
