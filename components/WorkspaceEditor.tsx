"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface Session {
  id: string;
  title: string;
  content: object;
  savedAt: string;
}

interface KeystrokeEntry {
  dwellTime: number;
  flightTime: number | null;
  isError: boolean;
}

interface WorkspaceEditorProps {
  userId?: number;
  userToken?: string;
  onMetricsUpdate?: (dwellTimePct: number, flightTimePct: number) => void;
}

const MAX_SESSIONS = 10;
const BACKEND_URL = "https://neurolive-backend.azurewebsites.net";

function ResizableImageView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper as="span" style={{ display: "inline-block" }}>
      <span
        contentEditable={false}
        style={{
          display: "inline-block",
          resize: "both",
          overflow: "hidden",
          maxWidth: "100%",
          minWidth: "50px",
          minHeight: "50px",
        }}
      >
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) || ""}
          title={(node.attrs.title as string) || ""}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
            borderRadius: "0.5rem",
            margin: 0,
          }}
        />
      </span>
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  inline: true,
  group: "inline",
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default function WorkspaceEditor({ userId, userToken, onMetricsUpdate }: WorkspaceEditorProps) {
  const storageKey = `nl_sessions_${userToken ?? ""}`;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const keyDownTimesRef = useRef<Map<string, { time: number; flightTime: number | null }>>(new Map());
  const lastKeyUpTimeRef = useRef<number | null>(null);
  const keystrokeBufferRef = useRef<KeystrokeEntry[]>([]);
  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  useEffect(() => { onMetricsUpdateRef.current = onMetricsUpdate; });

  function loadSessions(): Session[] {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      return JSON.parse(raw) as Session[];
    } catch {
      return [];
    }
  }

  function persistSessions(updated: Session[]) {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSessions(updated);
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      ResizableImage,
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
      setCanUndo(editor.can().undo());
      setCanRedo(editor.can().redo());
    },
    onTransaction: ({ editor }) => {
      setCanUndo(editor.can().undo());
      setCanRedo(editor.can().redo());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      const latest = loaded[0];
      setCurrentSessionId(latest.id);
      setSessionTitle(latest.title);
      editor.commands.setContent(latest.content);
      const text = editor.getText().trim();
      setWordCount(text === "" ? 0 : text.split(/\s+/).filter(Boolean).length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, storageKey]);

  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;

    function onKeyDown(e: KeyboardEvent) {
      const now = performance.now();
      const flightTime = lastKeyUpTimeRef.current !== null ? now - lastKeyUpTimeRef.current : null;
      keyDownTimesRef.current.set(e.key, { time: now, flightTime });
    }

    function onKeyUp(e: KeyboardEvent) {
      const keyInfo = keyDownTimesRef.current.get(e.key);
      if (!keyInfo) return;
      const now = performance.now();
      const dwellTime = now - keyInfo.time;
      keyDownTimesRef.current.delete(e.key);
      lastKeyUpTimeRef.current = now;
      const buffer = keystrokeBufferRef.current;
      buffer.push({ dwellTime, flightTime: keyInfo.flightTime, isError: e.key === "Backspace" });
      if (buffer.length > 20) buffer.shift();
    }

    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("keyup", onKeyUp);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("keyup", onKeyUp);
    };
  }, [editor]);

  useEffect(() => {
    if (!userId || !userToken) return;
    const sessionId = sessionIdRef.current;
    const id = setInterval(async () => {
      const buffer = keystrokeBufferRef.current;
      if (buffer.length < 5) return;
      const snapshot = [...buffer];
      keystrokeBufferRef.current = [];
      const dwellTimes = snapshot.map((k) => k.dwellTime);
      const flightTimes = snapshot.map((k) => k.flightTime).filter((ft): ft is number => ft !== null);
      const errorCount = snapshot.filter((k) => k.isError).length;
      const avgDwellTime = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
      const avgFlightTime = flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0;
      const errorRate = errorCount / snapshot.length;
      const dwellTimePct = Math.min(100, (avgDwellTime / 300) * 100);
      const flightTimePct = Math.min(100, (avgFlightTime / 500) * 100);
      onMetricsUpdateRef.current?.(dwellTimePct, flightTimePct);
      try {
        await fetch(`${BACKEND_URL}/biometrics/keystrokes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            userId,
            sessionId,
            dwellTime: avgDwellTime,
            flightTime: avgFlightTime,
            errorCount,
            errorRate,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {
        // silent
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [userId, userToken]);

  function handleSave() {
    if (!editor) return;
    const content = editor.getJSON();
    const now = new Date().toISOString();
    let updated: Session[];

    if (currentSessionId) {
      updated = sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: sessionTitle || "Sin título", content, savedAt: now }
          : s
      );
    } else {
      const newSession: Session = {
        id: crypto.randomUUID(),
        title: sessionTitle || "Sin título",
        content,
        savedAt: now,
      };
      updated = [newSession, ...sessions];
      setCurrentSessionId(newSession.id);
    }

    updated = updated
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, MAX_SESSIONS);

    persistSessions(updated);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }

  function handleNewSession() {
    if (!window.confirm("¿Iniciar una nueva sesión? El contenido actual no guardado se perderá.")) return;
    setSessionTitle("");
    setCurrentSessionId(null);
    editor?.commands.clearContent();
    setWordCount(0);
  }

  function handleOpenSession(session: Session) {
    if (!editor) return;
    setCurrentSessionId(session.id);
    setSessionTitle(session.title);
    editor.commands.setContent(session.content);
    const text = editor.getText().trim();
    setWordCount(text === "" ? 0 : text.split(/\s+/).filter(Boolean).length);
  }

  function handleDeleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    persistSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setSessionTitle("");
      editor?.commands.clearContent();
      setWordCount(0);
    }
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

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }

  return (
    <>
      {/* Sessions panel */}
      <div
        className="flex flex-col rounded-2xl overflow-hidden mb-4"
        style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB" }}
      >
        <div className="px-5 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <h3 className="text-sm font-semibold text-gray-700">Sesiones guardadas</h3>
        </div>

        {sessions.length === 0 ? (
          <div className="px-5 py-4 text-sm text-gray-400">
            No tienes sesiones guardadas aún
          </div>
        ) : (
          <div>
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50"
                style={{
                  borderBottom: index < sessions.length - 1 ? "1px solid #F9FAFB" : "none",
                  backgroundColor: currentSessionId === session.id ? "#EFF6FF" : undefined,
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {session.title || "Sin título"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(session.savedAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenSession(session)}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition hover:bg-blue-50 focus:outline-none"
                    style={{ color: "#4A7FA5", border: "1px solid #D6E8F5" }}
                  >
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session.id)}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium transition hover:bg-red-50 focus:outline-none"
                    style={{ color: "#EF4444", border: "1px solid #FEE2E2" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
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

          <div className="w-px h-5 mx-1.5 flex-shrink-0" style={{ backgroundColor: "#E5E7EB" }} />

          <ToolbarBtn
            title="Deshacer"
            active={false}
            disabled={!canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <span className="text-sm leading-none">↩</span>
          </ToolbarBtn>
          <ToolbarBtn
            title="Rehacer"
            active={false}
            disabled={!canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <span className="text-sm leading-none">↪</span>
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
  disabled,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
