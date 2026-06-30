"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  group: string;
}

// Schema-driven settings layout
const SETTINGS_SCHEMA = [
  {
    section: "Homepage",
    description: "Controls the hero section on the homepage",
    fields: [
      { key: "homepage_hero_title", label: "Hero Title", type: "input" as const, group: "homepage" },
    ],
  },
  {
    section: "About Page",
    description: "Content displayed on the About page",
    fields: [
      { key: "about_heading", label: "About Heading", type: "input" as const, group: "about" },
      { key: "about_content", label: "About Content", type: "textarea" as const, group: "about" },
      { key: "about_mission", label: "About Mission", type: "textarea" as const, group: "about" },
    ],
  },
  {
    section: "General",
    description: "Global site identity",
    fields: [
      { key: "site_name", label: "Site Name", type: "input" as const, group: "general" },
      { key: "site_description", label: "Site Description", type: "input" as const, group: "general" },
    ],
  },
  {
    section: "SEO",
    description: "Search engine optimization defaults",
    fields: [
      { key: "meta_title", label: "Meta Title", type: "input" as const, group: "seo" },
      { key: "meta_description", label: "Meta Description", type: "textarea" as const, group: "seo" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      const res = await api<{ success: boolean; data: SiteSetting[] }>("/admin/settings");
      setSettings(res.data);
      const values: Record<string, string> = {};
      for (const s of res.data) {
        values[s.key] = s.value;
      }
      // Pre-populate schema keys that don't exist yet with empty string
      for (const section of SETTINGS_SCHEMA) {
        for (const field of section.fields) {
          if (values[field.key] === undefined) {
            values[field.key] = "";
          }
        }
      }
      setEditedValues(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadData();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  function handleChange(key: string, value: string) {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  }

  function getOriginalValue(key: string): string {
    const s = settings.find((s) => s.key === key);
    return s ? s.value : "";
  }

  function hasChanges(): boolean {
    for (const section of SETTINGS_SCHEMA) {
      for (const field of section.fields) {
        if ((editedValues[field.key] ?? "") !== getOriginalValue(field.key)) {
          return true;
        }
      }
    }
    return false;
  }

  async function handleSaveAll() {
    const modified: { key: string; value: string; group: string }[] = [];
    for (const section of SETTINGS_SCHEMA) {
      for (const field of section.fields) {
        const current = editedValues[field.key] ?? "";
        const original = getOriginalValue(field.key);
        if (current !== original) {
          modified.push({ key: field.key, value: current, group: field.group });
        }
      }
    }

    if (modified.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      await api("/admin/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: modified }),
      });
      toast.success(`${modified.length} setting(s) updated`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-32" />
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Settings</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const changed = hasChanges();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Site configuration for this deployment
          </p>
        </div>
      </div>

      {SETTINGS_SCHEMA.map((section) => (
        <Card key={section.section}>
          <CardHeader>
            <CardTitle className="text-base">{section.section}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.key}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editedValues[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={editedValues[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pb-8">
        <Button onClick={handleSaveAll} disabled={saving || !changed}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
