"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Gaming",
    emojis: [
      "\uD83C\uDFAE", "\uD83D\uDD79\uFE0F", "\uD83C\uDFB2", "\uD83C\uDFB0",
      "\uD83C\uDFC6", "\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49",
      "\u2694\uFE0F", "\uD83D\uDEE1\uFE0F", "\uD83C\uDFF9", "\uD83D\uDD2B",
      "\uD83D\uDCA3", "\uD83D\uDC7E", "\uD83D\uDC7B", "\uD83E\uDD16",
    ],
  },
  {
    label: "Tech",
    emojis: [
      "\uD83D\uDCBB", "\uD83D\uDDA5\uFE0F", "\uD83D\uDCF1", "\u2328\uFE0F",
      "\uD83D\uDDB1\uFE0F", "\uD83D\uDCBE", "\uD83D\uDCBF", "\uD83D\uDCC0",
      "\uD83D\uDD27", "\u2699\uFE0F", "\uD83D\uDD0C", "\uD83D\uDD0B",
      "\uD83D\uDCE1", "\uD83D\uDCE6", "\uD83D\uDCC2", "\uD83D\uDCDD",
    ],
  },
  {
    label: "Media",
    emojis: [
      "\uD83C\uDFAC", "\uD83C\uDFA5", "\uD83C\uDFB5", "\uD83C\uDFA8",
      "\uD83C\uDFAD", "\uD83D\uDCFA", "\uD83D\uDCFB", "\uD83C\uDFA7",
      "\uD83C\uDFB6", "\uD83C\uDFA4", "\uD83D\uDCF7", "\uD83D\uDCF8",
      "\uD83D\uDCF9", "\uD83D\uDCFC", "\uD83D\uDD0D", "\uD83D\uDDBC\uFE0F",
    ],
  },
  {
    label: "General",
    emojis: [
      "\u2B50", "\uD83D\uDD25", "\u2764\uFE0F", "\uD83D\uDCA1",
      "\uD83D\uDE80", "\u26A1", "\uD83C\uDF1F", "\uD83C\uDF08",
      "\uD83C\uDF89", "\uD83C\uDF81", "\uD83D\uDCE2", "\uD83D\uDCCC",
      "\u2705", "\u274C", "\u26A0\uFE0F", "\u2139\uFE0F",
    ],
  },
  {
    label: "Nature",
    emojis: [
      "\uD83C\uDF0D", "\uD83C\uDF19", "\u2600\uFE0F", "\u2601\uFE0F",
      "\uD83C\uDF3F", "\uD83C\uDF31", "\uD83C\uDF3A", "\uD83C\uDF32",
      "\uD83C\uDF0A", "\uD83D\uDD25", "\u2744\uFE0F", "\uD83C\uDF0B",
      "\u26C8\uFE0F", "\uD83C\uDF24\uFE0F", "\uD83C\uDF04", "\uD83C\uDF05",
    ],
  },
  {
    label: "Symbols",
    emojis: [
      "\uD83D\uDD12", "\uD83D\uDD13", "\uD83D\uDD11", "\uD83D\uDEA9",
      "\uD83C\uDFF4", "\uD83C\uDFF3\uFE0F", "\uD83D\uDCB0", "\uD83D\uDCB3",
      "\uD83D\uDCCA", "\uD83D\uDCC8", "\uD83D\uDCC9", "\uD83D\uDCCB",
      "\uD83D\uDD17", "\u267B\uFE0F", "\u269B\uFE0F", "\uD83D\uDD2E",
    ],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export function EmojiPicker({ value, onChange, id, placeholder = "e.g. \uD83C\uDFAE" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title="Pick emoji"
      >
        <Smile className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pick an Icon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {EMOJI_CATEGORIES.map((category) => (
              <div key={category.label}>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {category.label}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {category.emojis.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      className="h-9 w-9 flex items-center justify-center rounded-md text-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        onChange(emoji);
                        setOpen(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
