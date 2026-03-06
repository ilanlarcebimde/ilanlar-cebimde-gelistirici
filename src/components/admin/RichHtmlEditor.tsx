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
    // Paragraf ve liste varsayılan; Enter = yeni paragraf / yeni madde, boş maddede Enter = listeden çık
    hardBreak: true, // Shift+Enter = <br>
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
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded p-1.5 text-sm font-semibold ${editor.isActive("bold") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Kalın"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded p-1.5 text-sm italic ${editor.isActive("italic") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="İtalik"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`rounded p-1.5 text-sm underline ${editor.isActive("underline") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Altı çizili"
      >
        U
      </button>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`rounded px-2 py-1 text-xs ${editor.isActive("paragraph") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Paragraf"
      >
        P
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded px-2 py-1 text-xs font-semibold ${editor.isActive("heading", { level: 2 }) ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Başlık 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`rounded px-2 py-1 text-xs font-semibold ${editor.isActive("heading", { level: 3 }) ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Başlık 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleMark("small").run()}
        className={`rounded px-2 py-1 text-xs ${editor.isActive("small") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Küçük metin"
      >
        Küçük
      </button>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded p-1.5 text-sm ${editor.isActive("bulletList") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Madde listesi"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded px-2 py-1 text-sm ${editor.isActive("orderedList") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Numaralı liste"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`rounded p-1.5 text-sm ${editor.isActive("blockquote") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Alıntı"
      >
        “
      </button>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <button
        type="button"
        onClick={setLink}
        className={`rounded px-2 py-1 text-xs ${editor.isActive("link") ? "bg-slate-200" : "hover:bg-slate-100"}`}
        title="Link"
      >
        Link
      </button>
      <span className="mx-1 h-4 w-px bg-slate-300" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="rounded px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"
        title="Geri al"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="rounded px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"
        title="Yinele"
      >
        ↷
      </button>
    </div>
  );
}

const EDITOR_CLASS =
  "prose prose-slate max-w-none min-h-[220px] px-3 py-3 focus:outline-none " +
  "prose-p:mb-3 prose-p:leading-relaxed prose-p:first:mt-0 prose-headings:mt-4 prose-headings:mb-2 " +
  "prose-ul:list-disc prose-ul:pl-6 prose-ul:my-2 prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-2 prose-li:my-0.5 " +
  "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600";

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
