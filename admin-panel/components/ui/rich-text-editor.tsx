"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Extension } from "@tiptap/core";
import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  LinkIcon,
  Unlink,
  Undo,
  Redo,
  Check,
  X,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ImageResize.configure({
        inline: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      // Exit heading on Enter at end of heading — creates a normal paragraph
      Extension.create({
        name: "headingEnterFix",
        addKeyboardShortcuts() {
          return {
            Enter: ({ editor: ed }) => {
              const { $from } = ed.state.selection;
              const parent = $from.parent;
              if (
                parent.type.name === "heading" &&
                $from.parentOffset === parent.content.size
              ) {
                ed.chain()
                  .insertContentAt($from.after(), { type: "paragraph" })
                  .focus()
                  .run();
                return true;
              }
              return false;
            },
          };
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g., editing existing article)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Focus link input when popover opens
  useEffect(() => {
    if (linkPopoverOpen && linkInputRef.current) {
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  }, [linkPopoverOpen]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor || !file.type.match(/^image\/(jpeg|png|webp|gif)$/)) return;
      if (file.size > 5 * 1024 * 1024) return;

      try {
        const base64 = await fileToBase64(file);
        const res = await api<{ success: boolean; data: { url: string } }>(
          "/admin/upload-image",
          {
            method: "POST",
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              data: base64,
            }),
          },
        );
        editor.chain().focus().setImage({ src: res.data.url }).run();
      } catch {
        // Upload failed
      }
    },
    [editor],
  );

  function openLinkPopover() {
    if (!editor) return;
    // Pre-fill with existing link URL if cursor is on a link
    const existingLink = editor.getAttributes("link").href || "";
    setLinkUrl(existingLink);
    setLinkPopoverOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url) {
      // If no text is selected, insert the URL as link text
      const { from, to } = editor.state.selection;
      if (from === to) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${url}</a>`)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      }
    }
    setLinkPopoverOpen(false);
    setLinkUrl("");
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPopoverOpen(false);
    setLinkUrl("");
  }

  function handleLinkKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLinkPopoverOpen(false);
      setLinkUrl("");
      editor?.chain().focus().run();
    }
  }

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b p-1.5 bg-muted/30 relative">
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        <ToolbarButton
          active={false}
          onClick={() => fileRef.current?.click()}
          title="Insert image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={openLinkPopover}
          title="Insert link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            active={false}
            onClick={removeLink}
            title="Remove link"
          >
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        {/* Link Popover */}
        {linkPopoverOpen && (
          <div className="absolute left-0 right-0 top-full z-50 border-t bg-background p-2 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={linkInputRef}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleLinkKeyDown}
              placeholder="https://example.com"
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={applyLink}
              title="Apply link"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setLinkPopoverOpen(false);
                setLinkUrl("");
                editor.chain().focus().run();
              }}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="tiptap prose-editor" />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${active ? "bg-muted" : ""}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
