"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Small } from "@/lib/tiptap-extensions/SmallMark";
import type { Editor } from "@tiptap/core";

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    // Paragraf, liste, HardBreak (Shift+Enter = <br>) varsayılan dahil
  }),
  Link.configure({
    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    openOnClick: false,
  }),
  Underline,
  Small,
];

interface RichHtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  title: string;
  className?: string;
  onAction: () => void;
  children: React.ReactNode;
}

function ToolbarButton({
  active = false,
  disabled = false,
  title,
  className = "",
  onAction,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        if (!disabled) onAction();
      }}
      className={`rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-slate-200 text-slate-900" : "hover:bg-slate-100"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Link URL:", editor.getAttributes("link").href ?? "https://");
    if (url == null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
      <ToolbarButton
        active={editor.isActive("bold")}
        onAction={() => editor.chain().focus().toggleBold().run()}
        className="p-1.5 text-sm font-semibold"
        title="Kalın"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onAction={() => editor.chain().focus().toggleItalic().run()}
        className="p-1.5 text-sm italic"
        title="İtalik"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onAction={() => editor.chain().focus().toggleUnderline().run()}
        className="p-1.5 text-sm underline"
        title="Altı çizili"
      >
        U
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarButton
        active={editor.isActive("paragraph")}
        onAction={() => editor.chain().focus().setParagraph().run()}
        className="px-2 py-1 text-xs"
        title="Paragraf"
      >
        P
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onAction={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="px-2 py-1 text-xs font-semibold"
        title="Başlık 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onAction={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className="px-2 py-1 text-xs font-semibold"
        title="Başlık 3"
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("small")}
        onAction={() => editor.chain().focus().toggleMark("small").run()}
        className="px-2 py-1 text-xs"
        title="Küçük metin"
      >
        Küçük
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onAction={() => editor.chain().focus().toggleBulletList().run()}
        className="p-1.5 text-sm"
        title="Madde listesi"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onAction={() => editor.chain().focus().toggleOrderedList().run()}
        className="px-2 py-1 text-sm"
        title="Numaralı liste"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onAction={() => editor.chain().focus().toggleBlockquote().run()}
        className="p-1.5 text-sm"
        title="Alıntı"
      >
        “
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarButton
        active={editor.isActive("link")}
        onAction={setLink}
        className="px-2 py-1 text-xs"
        title="Link"
      >
        Link
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarButton
        disabled={!editor.can().undo()}
        onAction={() => editor.chain().focus().undo().run()}
        className="px-2 py-1 text-xs"
        title="Geri al"
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        disabled={!editor.can().redo()}
        onAction={() => editor.chain().focus().redo().run()}
        className="px-2 py-1 text-xs"
        title="Yinele"
      >
        ↷
      </ToolbarButton>
    </div>
  );
}

const EDITOR_CLASS =
  "prose prose-slate max-w-none min-h-[220px] px-4 py-3 text-[15px] leading-7 focus:outline-none " +
  "prose-p:my-4 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:mt-5 prose-headings:mb-3 " +
  "prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 " +
  "prose-li:my-1 prose-li:leading-7 prose-blockquote:my-4 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600";

export function RichHtmlEditor({ value, onChange, placeholder }: RichHtmlEditorProps) {
  const lastEmitted = useRef<string>(value);

  const editor = useEditor({
    extensions,
    content: value || "",
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
      },
      handleKeyDown(_view, event) {
        // Enter / Shift+Enter sadece editörde kalsın; form submit veya diğer handler'lar tetiklenmesin
        if (event.key === "Enter") {
          event.stopPropagation();
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const isEmpty =
    !value?.trim() ||
    value.trim() === "<p></p>" ||
    value.trim() === "<p><br></p>";

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {placeholder && isEmpty && (
        <div className="pointer-events-none absolute left-4 top-14 text-sm leading-relaxed text-slate-400">
          {placeholder}
        </div>
      )}
    </div>
  );
}
