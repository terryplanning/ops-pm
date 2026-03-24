"use client";
import { useEffect, useState } from "react";
import { supabasePM } from "@/lib/supabase-pm";
import Link from "next/link";
import "../../pm-globals.css";

export default function WorkingStylePage() {
  const [content, setContent] = useState("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (supabasePM as any).from("working_style").select("*").limit(1).then(({ data }: any) => {
      if (data && data[0]) { setContent(data[0].content); setRecordId(data[0].id); }
    });
  }, []);

  async function save() {
    setSaving(true);
    if (recordId) {
      await (supabasePM as any).from("working_style").update({ content }).eq("id", recordId);
    } else {
      const { data } = await (supabasePM as any).from("working_style").insert({ content }).select().single();
      if (data) setRecordId(data.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="pm-root">
      <div style={{ borderBottom: "1px solid var(--pm-border)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <Link href="/pm" style={{ color: "var(--pm-muted)", textDecoration: "none", fontSize: "11px", letterSpacing: "0.08em" }}>OPS</Link>
          <span style={{ color: "var(--pm-border-bright)" }}>/</span>
          <span style={{ fontFamily: "var(--pm-serif)", fontSize: "18px", fontWeight: 300 }}>Working Style</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="pm-btn" onClick={() => navigator.clipboard.writeText(content)}>COPY</button>
          <button className="pm-btn pm-btn-accent" onClick={save} disabled={saving}>{saved ? "SAVED" : saving ? "SAVING..." : "SAVE"}</button>
        </div>
      </div>
      <div style={{ padding: "32px 40px", maxWidth: "800px" }}>
        <div className="pm-label" style={{ marginBottom: "12px" }}>GLOBAL WORKING STYLE</div>
        <div style={{ fontSize: "12px", color: "var(--pm-muted)", marginBottom: "16px", lineHeight: "1.6" }}>
          This block is appended to every AI handover. Paste your working rules here once and every new Claude session will receive them automatically.
        </div>
        <textarea className="pm-input" value={content} onChange={e => setContent(e.target.value)} rows={24} placeholder="How I give instructions:&#10;- I copy-paste your files directly into the repo...&#10;&#10;How you should ask questions:&#10;- Before building anything non-trivial, ask clarifying questions..." style={{ resize: "vertical", lineHeight: "1.7" }} />
      </div>
    </div>
  );
}