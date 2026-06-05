"use client";

import { useState, useEffect, FormEvent } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { apiFetch } from "@/lib/api";
import { Book, Trash2 } from "lucide-react";

interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const MAX_CHARS = 2000;

export default function NoteSection({
  scriptureCard,
}: {
  scriptureCard?: React.ReactNode;
}) {
  const { t } = useLocale();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const data = await apiFetch<NoteItem[]>("/api/notes");
        setNotes(data);
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    fetchNotes();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;

    setSaving(true);
    try {
      const note = await apiFetch<NoteItem>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ content: trimmed }),
      });
      setNotes((prev) => [note, ...prev]);
      setContent("");
    } catch {
      // silently fail
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently fail
    }
    setDeletingId(null);
  };

  const charsLeft = MAX_CHARS - content.length;

  return (
    <div className="space-y-6">
      {/* Scripture Card */}
      {scriptureCard}

      {/* New Note Form */}
      <form onSubmit={handleSubmit} className="sacred-card space-y-3">
        <h3 className="text-sm font-semibold text-umber-deep flex items-center gap-2">
          <Book className="w-4 h-4 text-gold-muted" />
          {t("notes.title")}
        </h3>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("notes.placeholder")}
          maxLength={MAX_CHARS}
          rows={4}
          className="input-field resize-none text-sm leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              charsLeft < 50 ? "text-warm-red" : "text-umber-soft"
            }`}
          >
            {t("notes.character_count").replace("{count}", String(charsLeft))}
          </span>

          <button
            type="submit"
            disabled={saving || !content.trim() || content.trim().length > MAX_CHARS}
            className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t("notes.saving") : t("notes.save")}
          </button>
        </div>
      </form>

      {/* Notes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-parchment rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-umber-soft text-center py-4">
          {t("notes.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="sacred-card relative group"
            >
              <p className="text-sm text-umber-deep whitespace-pre-wrap leading-relaxed pr-8">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-parchment-dark/20">
                <span className="text-xs text-umber-soft">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="text-umber-soft/50 hover:text-warm-red transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {deletingId === note.id && (
                <div className="absolute inset-0 bg-cream-white/60 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-umber-soft">{t("notes.deleting")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
