"use client";
import { useEffect, useState } from "react";
import { supabasePM } from "@/lib/supabase-pm";
import { Project } from "@/types/pm";
import Link from "next/link";
import "../pm-globals.css";

export default function PMDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    const { data } = await (supabasePM as any)
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  async function createProject() {
    if (!newName.trim()) return;
    setSaving(true);
    await (supabasePM as any).from("projects").insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
    });
    setNewName(""); setNewDesc(""); setCreating(false); setSaving(false);
    fetchProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and all its data?")) return;
    await (supabasePM as any).from("projects").delete().eq("id", id);
    fetchProjects();
  }

  return (
    <div className="pm-root">
      <div style={{ borderBottom: "1px solid var(--pm-border)", padding: "24px 40px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <span style={{ fontFamily: "var(--pm-serif)", fontSize: "22px", fontWeight: 300, color: "var(--pm-accent)", fontStyle: "italic" }}>Ops</span>
          <span style={{ fontFamily: "var(--pm-mono)", fontSize: "11px", color: "var(--pm-muted)", letterSpacing: "0.1em" }}>PROJECT MANAGEMENT</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/pm/working-style" style={{ fontFamily: "var(--pm-mono)", fontSize: "11px", color: "var(--pm-muted)", textDecoration: "none", letterSpacing: "0.08em" }}>
            WORKING STYLE
          </Link>
          <button className="pm-btn pm-btn-accent" onClick={() => setCreating(true)}>+ NEW PROJECT</button>
        </div>
      </div>

      {creating && (
        <div style={{ borderBottom: "1px solid var(--pm-border)", padding: "24px 40px", background: "var(--pm-surface)" }}>
          <div className="pm-label" style={{ marginBottom: "12px" }}>NEW PROJECT</div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input className="pm-input" placeholder="Project name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: "1", minWidth: "200px" }} autoFocus onKeyDown={e => e.key === "Enter" && createProject()} />
            <input className="pm-input" placeholder="One-line description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ flex: "2", minWidth: "280px" }} onKeyDown={e => e.key === "Enter" && createProject()} />
            <button className="pm-btn pm-btn-accent" onClick={createProject} disabled={saving}>{saving ? "SAVING..." : "CREATE"}</button>
            <button className="pm-btn" onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }}>CANCEL</button>
          </div>
        </div>
      )}

      <div style={{ padding: "32px 40px" }}>
        {loading ? (
          <div style={{ color: "var(--pm-muted)", fontSize: "13px" }}>Loading...</div>
        ) : projects.length === 0 ? (
          <div style={{ color: "var(--pm-muted)", fontSize: "13px", padding: "60px 0", textAlign: "center" }}>No projects yet. Create one to start.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px 100px", gap: "24px", padding: "0 16px 12px 16px" }}>
              <span className="pm-label">PROJECT</span>
              <span className="pm-label">DESCRIPTION</span>
              <span className="pm-label">CREATED</span>
              <span className="pm-label"></span>
            </div>
            {projects.map(p => (
              <div key={p.id} className="pm-card" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px 100px", gap: "24px", padding: "16px", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--pm-border-bright)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--pm-border)")}>
                <Link href={`/pm/${p.id}`} style={{ textDecoration: "none", color: "var(--pm-text)", fontSize: "14px", fontWeight: 500 }}>{p.name}</Link>
                <span style={{ color: "var(--pm-muted)", fontSize: "12px" }}>{p.description || "-"}</span>
                <span style={{ color: "var(--pm-muted)", fontSize: "11px" }}>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <Link href={`/pm/${p.id}`}><button className="pm-btn" style={{ fontSize: "11px", padding: "4px 10px" }}>OPEN</button></Link>
                  <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "4px 10px" }} onClick={() => deleteProject(p.id)}>DEL</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}