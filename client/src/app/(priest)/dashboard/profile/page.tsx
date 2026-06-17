"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ArrowLeft, UserCircle, BookOpen, Mail, Phone, Edit3, Check, X } from "lucide-react";
import NoteSection from "@/components/ui/NoteSection";
import { AvatarUploader } from "@/components/ui/AvatarUploader";
import { APP_VERSION } from "@/lib/version";
import en from "@/locales/en.json";
import am from "@/locales/am.json";


const PHONE_REGEX = /^(\+251|0)[79]\d{8}$/;


export default function PriestProfilePage() {
  const router = useRouter();
  const { user, updateProfile} = useAuth();
  const { t, locale } = useLocale();

  const LOCALE_DATA = { en, am } as const;
  const l = LOCALE_DATA[locale as keyof typeof LOCALE_DATA] || en;
  const scripture = l.notes.priest_scripture;

    // Inline editors
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name) { setError("Name cannot be empty"); return; }
    setSaving(true);
    try {
      await updateProfile({ formalName: name });
      setEditingName(false); setError("");
    } catch { setError("Failed to save."); }
    setSaving(false);
  };

  const savePhone = async () => {
    const phone = phoneDraft.trim();
    if (phone && !PHONE_REGEX.test(phone)) { setError("Invalid Ethiopian phone number"); return; }
    setSaving(true);
    try {
      await updateProfile({ phoneNumber: phone });
      setEditingPhone(false); setError("");
    } catch { setError("Failed to save."); }
    setSaving(false);
  };

  const initial = user?.spiritualName?.charAt(0)?.toUpperCase() || "?";

  const scriptureCard = (
    <div className="sacred-card bg-gradient-to-br from-gold-muted/5 to-parchment">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-gold-muted mt-0.5 shrink-0" />
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-umber-deep">
            {scripture.title}
          </h3>
          <p className="text-sm text-umber-soft/70 italic leading-relaxed">
            {scripture.intro}
          </p>
          <ul className="space-y-1">
            {scripture.verses.map((verse: string, i: number) => (
              <li key={i} className="text-sm text-umber-deep flex items-start gap-2">
                <span className="text-gold-muted mt-0.5">✝</span>
                {verse}
              </li>
            ))}
          </ul>
          <p className="text-xs text-umber-soft font-medium">
            — {scripture.reference}
          </p>
        </div>
      </div>
    </div>
  );

    return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-sm text-umber-soft hover:text-umber-deep transition-colors"
        aria-label="Go back to dashboard"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Profile header — avatar + editable name */}
      <div className="sacred-card text-center py-8 space-y-4">
        <div className="flex justify-center">
          <AvatarUploader
            src={user?.profilePictureUrl}
            name={user?.spiritualName}
            onChange={(dataUrl) => updateProfile({ profilePicture: dataUrl })}
            sizeClasses="w-28 h-28"
            textClasses="text-4xl"
          />
        </div>

        {editingName ? (
          <div className="flex items-center justify-center gap-2">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={100}
              autoFocus
              className="input-field text-center text-lg py-1.5 max-w-xs"
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="p-1.5 text-sage hover:bg-sage/10 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditingName(false); setError(""); }}
              className="p-1.5 text-warm-red hover:bg-warm-red/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold font-ethiopic text-umber-deep">
              {user?.formalName || "—"}
            </h1>
            <button
              onClick={() => { setNameDraft(user?.formalName || ""); setError(""); setEditingName(true); }}
              className="p-1 text-umber-soft hover:text-umber-deep transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}

        <span className="inline-block px-4 py-1.5 rounded-full bg-sage/10 text-sage text-xs font-bold uppercase tracking-wider">
          {t("priest.god_father")}
        </span>

        {error && <p className="text-xs text-warm-red">{error}</p>}
      </div>

      {/* Info card — role, email (static), phone (editable) */}
      <div className="sacred-card space-y-4">
        <h2 className="text-sm font-semibold text-umber-deep flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-gold-muted" />
          {t("priest.profile")}
        </h2>

        <div className="space-y-0 text-sm">
          {/* Role row */}
          <div className="flex justify-between items-center py-2 border-b border-parchment-dark/20">
            <span className="text-umber-soft">{t("priest.role")}</span>
            <span className="text-umber-deep font-medium bg-gold-muted/10 px-3 py-1 rounded-md">
              {t("priest.god_father")}
            </span>
          </div>

          {/* Email row — static */}
          <div className="flex justify-between items-center py-2 border-b border-parchment-dark/20">
            <span className="text-umber-soft flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold-muted" />
              {t("auth.email")}
            </span>
            <span className="text-umber-deep font-medium">
              {user?.email || "priest@theway.app"}
            </span>
          </div>

          {/* Phone row — editable */}
          <div className="flex justify-between items-center py-2">
            <span className="text-umber-soft flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold-muted" />
              {t("auth.phone")}
            </span>
            {editingPhone ? (
              <span className="flex items-center gap-1">
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="0912345678"
                  className="input-field text-sm py-1 w-40"
                  autoFocus
                />
                <button
                  onClick={savePhone}
                  disabled={saving}
                  className="p-1 text-sage hover:bg-sage/10 rounded disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingPhone(false); setError(""); }}
                  className="p-1 text-warm-red hover:bg-warm-red/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-umber-deep font-medium">
                  {user?.phoneNumber || (locale === "am" ? "ስልክ የለም" : "No phone")}
                </span>
                <button
                  onClick={() => { setPhoneDraft(user?.phoneNumber || ""); setError(""); setEditingPhone(true); }}
                  className="p-1 text-umber-soft hover:text-umber-deep transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notes Section with John 21 card */}
      <NoteSection scriptureCard={scriptureCard} />

      <p className="text-center text-[10px] text-umber-soft/60 tracking-wider pt-2">
        v{APP_VERSION}
      </p>
    </div>
  );
}
