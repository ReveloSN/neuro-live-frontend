"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface WorkspaceEditorProps {
  userId: string;
}

export default function WorkspaceEditor({ userId }: WorkspaceEditorProps) {
  const storageKey = `nl_session_${userId}`;
  const [sessionTitle, setSessionTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "nl-editor-content outline-none min-h-[320px] px-5 py-4 text-sm text-gray-700 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText().trim();
      setWordCount(text === "" ? 0 : text.split(/\s+/).filter(Boolean).length);
    },
  });

  useEffect(() => {
    if (!editor) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const { title, content } = JSON.parse(saved);
      if (title) setSessionTitle(title);
      if (content) {
        editor.commands.setContent(content);
        const text = editor.getText().trim();
        setWordCount(text === "" ? 0 : text.split(/\s+/).filter(Boolean).length);
      }
    } catch {}
  }, [editor, storageKey]);

  function handleSave() {
    if (!editor) return;
    localStorage.setItem(storageKey, JSON.stringify({
      title: sessionTitle,
      content: editor.getJSON(),
    }));
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }

  function handleNewSession() {
    if (!window.confirm("¿Iniciar una nueva sesión? El contenido actual no guardado se perderá.")) return;
    setSessionTitle("");
    editor?.commands.clearContent();
    setWordCount(0);
  }

  function handleImageUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Ingresa la URL del enlace:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function handleCopy() {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getText());
  }

  return (
    <>
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
      >
        <input
          type="text"
          placeholder="Título de la sesión..."
          value={sessionTitle}
          onChange={(e) => setSessionTitle(e.target.value)}
          className="w-full px-5 py-4 text-lg font-semibold text-gray-800 placeholder:text-gray-300 bg-transparent focus:outline-none"
          style={{ borderBottom: "1px solid #F3F4F6" }}
        />

        <div
          className="flex items-center gap-0.5 px-3 py-2 flex-wrap"
          style={{ borderBottom: "1px solid #F3F4F6" }}
        >
          <ToolbarBtn
            title="Negrita"
            active={editor?.isActive("bold") ?? false}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <span className="text-sm font-bold leading-none">B</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Cursiva"
            active={editor?.isActive("italic") ?? false}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <span className="text-sm italic leading-none" style={{ fontFamily: "Georgia, serif" }}>I</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Subrayado"
            active={editor?.isActive("underline") ?? false}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <span className="text-sm underline leading-none">U</span>
          </ToolbarBtn>

          <div className="w-px h-5 mx-1.5 flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }} />

          <ToolbarBtn
            title="Lista con viñetas"
            active={editor?.isActive("bulletList") ?? false}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <BulletListIcon />
          </ToolbarBtn>
          <ToolbarBtn
            title="Lista numerada"
            active={editor?.isActive("orderedList") ?? false}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <NumberedListIcon />
          </ToolbarBtn>

          <div className="w-px h-5 mx-1.5 flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }} />

          <ToolbarBtn title="Insertar imagen" active={false} onClick={handleImageUpload}>
            <ImageIcon />
          </ToolbarBtn>
          <ToolbarBtn
            title="Insertar enlace"
            active={editor?.isActive("link") ?? false}
            onClick={handleLink}
          >
            <LinkIcon />
          </ToolbarBtn>
          <ToolbarBtn title="Copiar contenido" active={false} onClick={handleCopy}>
            <CopyIcon />
          </ToolbarBtn>
        </div>

        <EditorContent editor={editor} />

        <div
          className="flex items-center justify-between px-5 py-2.5 text-xs"
          style={{ borderTop: "1px solid #F3F4F6" }}
        >
          <span className="text-gray-400">Palabras: {wordCount}</span>
          <span
            className="font-medium transition-opacity duration-300"
            style={{
              color: "#4A7FA5",
              opacity: showSaved ? 1 : 0,
              pointerEvents: "none",
            }}
          >
            Guardado
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: "#4A7FA5" }}
        >
          Guardar sesión
        </button>
        <button
          onClick={handleNewSession}
          className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ color: "#6B7280", border: "1px solid #E5E7EB", backgroundColor: "#ffffff" }}
        >
          Nueva sesión
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

function ToolbarBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200"
      style={{
        backgroundColor: active ? "#D6E8F5" : "transparent",
        color: active ? "#4A7FA5" : "#6B7280",
      }}
    >
      {children}
    </button>
  );
}

function BulletListIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="4.5" r="1.1" />
      <circle cx="2.5" cy="8" r="1.1" />
      <circle cx="2.5" cy="11.5" r="1.1" />
      <rect x="5" y="3.75" width="9" height="1.5" rx="0.75" />
      <rect x="5" y="7.25" width="9" height="1.5" rx="0.75" />
      <rect x="5" y="10.75" width="9" height="1.5" rx="0.75" />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <text x="0.5" y="5.5" fontSize="4.5" fontFamily="monospace">1.</text>
      <text x="0.5" y="9" fontSize="4.5" fontFamily="monospace">2.</text>
      <text x="0.5" y="12.5" fontSize="4.5" fontFamily="monospace">3.</text>
      <rect x="6" y="3.75" width="8.5" height="1.5" rx="0.75" />
      <rect x="6" y="7.25" width="8.5" height="1.5" rx="0.75" />
      <rect x="6" y="10.75" width="8.5" height="1.5" rx="0.75" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <circle cx="5.5" cy="5.75" r="1.25" />
      <path d="M1.5 11.5l3.5-3.5 3 3 2.5-2.5 3.5 3.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" strokeLinecap="round" />
      <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L8.5 12.5" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <rect x="5.5" y="1.5" width="9" height="9" rx="1.5" />
      <path d="M10.5 10.5v2a1.5 1.5 0 01-1.5 1.5h-7a1.5 1.5 0 01-1.5-1.5v-7A1.5 1.5 0 012 4.5h2" strokeLinecap="round" />
    </svg>
  );
}
