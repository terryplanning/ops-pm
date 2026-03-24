"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabasePM } from "@/lib/supabase-pm";
import { Project, Feature, Note, Commit, Resource, Credential, AIPrompt } from "@/types/pm";
import Link from "next/link";
import "../../pm-globals.css";

type Tab = "scope" | "features" | "notes" | "resources" | "dev" | "ai";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("scope");
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);

  const fetchAll = useCallback(async () => {
    const [proj, feat, nts, cmts, res, creds, prompts] = await Promise.all([
      (supabasePM as any).from("projects").select("*").eq("id", id).single(),
      (supabasePM as any).from("project_features").select("*").eq("project_id", id).order("sort_order"),
      (supabasePM as any).from("project_notes").select("*").eq("project_id", id).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
      (supabasePM as any).from("project_commits").select("*").eq("project_id", id).order("committed_at", { ascending: false }),
      (supabasePM as any).from("project_resources").select("*").eq("project_id", id).order("created_at"),
      (supabasePM as any).from("project_credentials").select("*").eq("project_id", id).order("created_at"),
      (supabasePM as any).from("project_ai_prompts").select("*").eq("project_id", id).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    setProject(proj.data);
    setFeatures(feat.data || []);
    setNotes(nts.data || []);
    setCommits(cmts.data || []);
    setResources(res.data || []);
    setCredentials(creds.data || []);
    setAiPrompts(prompts.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="pm-root" style={{ padding: "40px", color: "var(--pm-muted)", fontSize: "13px" }}>Loading...</div>;
  if (!project) return <div className="pm-root" style={{ padding: "40px", color: "var(--pm-muted)", fontSize: "13px" }}>Project not found. <Link href="/pm" style={{ color: "var(--pm-accent)" }}>Back</Link></div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "scope", label: "SCOPE" },
    { key: "features", label: "FEATURES" },
    { key: "notes", label: "NOTES" },
    { key: "resources", label: "RESOURCES" },
    { key: "dev", label: "DEV" },
    { key: "ai", label: "AI CONTEXT" },
  ];

  return (
    <div className="pm-root">
      <div style={{ borderBottom: "1px solid var(--pm-border)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <Link href="/pm" style={{ color: "var(--pm-muted)", textDecoration: "none", fontSize: "11px", letterSpacing: "0.08em" }}>OPS</Link>
          <span style={{ color: "var(--pm-border-bright)" }}>/</span>
          <span style={{ fontFamily: "var(--pm-serif)", fontSize: "18px", fontWeight: 300, color: "var(--pm-text)" }}>{project.name}</span>
          {project.description && <span style={{ color: "var(--pm-muted)", fontSize: "12px" }}>{project.description}</span>}
        </div>
      </div>

      <div style={{ borderBottom: "1px solid var(--pm-border)", padding: "0 40px", display: "flex", gap: "28px" }}>
        {tabs.map(t => (
          <button key={t.key} className={`pm-tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "960px" }}>
        {tab === "scope" && <ScopeTab project={project} onSave={fetchAll} />}
        {tab === "features" && <FeaturesTab projectId={id} features={features} onSave={fetchAll} />}
        {tab === "notes" && <NotesTab projectId={id} notes={notes} onSave={fetchAll} />}
        {tab === "resources" && <ResourcesTab projectId={id} resources={resources} credentials={credentials} onSave={fetchAll} />}
        {tab === "dev" && <DevTab projectId={id} commits={commits} onSave={fetchAll} />}
        {tab === "ai" && <AITab project={project} features={features} notes={notes} commits={commits} resources={resources} aiPrompts={aiPrompts} onSave={fetchAll} />}
      </div>
    </div>
  );
}

function ScopeTab({ project, onSave }: { project: Project; onSave: () => void }) {
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description || "");
  const [scope, setScope] = useState(project.scope || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await (supabasePM as any).from("projects").update({ name, description: desc || null, scope: scope || null }).eq("id", project.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); onSave();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div className="pm-label" style={{ marginBottom: "8px" }}>PROJECT NAME</div>
        <input className="pm-input" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <div className="pm-label" style={{ marginBottom: "8px" }}>ONE-LINE DESCRIPTION</div>
        <input className="pm-input" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div>
        <div className="pm-label" style={{ marginBottom: "8px" }}>SCOPE</div>
        <textarea className="pm-input" value={scope} onChange={e => setScope(e.target.value)} rows={12} placeholder="Describe what this project is, what it solves, what is in scope and what is not..." style={{ resize: "vertical", lineHeight: "1.7" }} />
      </div>
      <button className="pm-btn pm-btn-accent" onClick={save} disabled={saving}>{saved ? "SAVED" : saving ? "SAVING..." : "SAVE SCOPE"}</button>
    </div>
  );
}

function FeaturesTab({ projectId, features, onSave }: { projectId: string; features: Feature[]; onSave: () => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Feature["status"]>("Planned");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function addFeature() {
    if (!title.trim()) return;
    setSaving(true);
    await (supabasePM as any).from("project_features").insert({ project_id: projectId, title: title.trim(), status, notes: notes || null, sort_order: features.length });
    setTitle(""); setNotes(""); setStatus("Planned"); setAdding(false); setSaving(false); onSave();
  }

  async function cycleStatus(f: Feature) {
    const cycle: Feature["status"][] = ["Planned", "In Progress", "Done"];
    const next = cycle[(cycle.indexOf(f.status) + 1) % cycle.length];
    await (supabasePM as any).from("project_features").update({ status: next }).eq("id", f.id);
    onSave();
  }

  async function deleteFeature(id: string) {
    await (supabasePM as any).from("project_features").delete().eq("id", id);
    onSave();
  }

  const statusClass = (s: string) => s === "Done" ? "pm-status pm-status-done" : s === "In Progress" ? "pm-status pm-status-inprogress" : "pm-status pm-status-planned";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="pm-label">{features.length} FEATURE{features.length !== 1 ? "S" : ""}</span>
        <button className="pm-btn pm-btn-accent" onClick={() => setAdding(true)}>+ ADD FEATURE</button>
      </div>
      {adding && (
        <div className="pm-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <input className="pm-input" placeholder="Feature title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <div style={{ display: "flex", gap: "8px" }}>
            {(["Planned", "In Progress", "Done"] as Feature["status"][]).map(s => (
              <button key={s} className={`pm-btn${status === s ? " pm-btn-accent" : ""}`} style={{ fontSize: "11px" }} onClick={() => setStatus(s)}>{s.toUpperCase()}</button>
            ))}
          </div>
          <textarea className="pm-input" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ resize: "vertical" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="pm-btn pm-btn-accent" onClick={addFeature} disabled={saving}>{saving ? "SAVING..." : "ADD"}</button>
            <button className="pm-btn" onClick={() => { setAdding(false); setTitle(""); setNotes(""); }}>CANCEL</button>
          </div>
        </div>
      )}
      {features.map(f => (
        <div key={f.id} className="pm-card" style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <span className={statusClass(f.status)} style={{ cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => cycleStatus(f)} title="Click to cycle status">{f.status.toUpperCase()}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", marginBottom: f.notes ? "4px" : 0 }}>{f.title}</div>
            {f.notes && <div style={{ fontSize: "11px", color: "var(--pm-muted)" }}>{f.notes}</div>}
          </div>
          <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "3px 8px" }} onClick={() => deleteFeature(f.id)}>DEL</button>
        </div>
      ))}
      {features.length === 0 && !adding && <div style={{ color: "var(--pm-muted)", fontSize: "12px", padding: "24px 0" }}>No features yet.</div>}
    </div>
  );
}

function NotesTab({ projectId, notes, onSave }: { projectId: string; notes: Note[]; onSave: () => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!content.trim()) return;
    setSaving(true);
    await (supabasePM as any).from("project_notes").insert({ project_id: projectId, content: content.trim() });
    setContent(""); setSaving(false); onSave();
  }

  async function togglePin(n: Note) {
    await (supabasePM as any).from("project_notes").update({ pinned: !n.pinned }).eq("id", n.id);
    onSave();
  }

  async function deleteNote(id: string) {
    await (supabasePM as any).from("project_notes").delete().eq("id", id);
    onSave();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="pm-label">NEW NOTE</div>
        <textarea className="pm-input" value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Paste anything - decisions, blockers, observations, links..." style={{ resize: "vertical", lineHeight: "1.7" }} />
        <div><button className="pm-btn pm-btn-accent" onClick={addNote} disabled={saving}>{saving ? "SAVING..." : "ADD NOTE"}</button></div>
      </div>
      <hr className="pm-divider" style={{ margin: "8px 0" }} />
      {notes.map(n => (
        <div key={n.id} className="pm-card" style={{ padding: "14px 16px", borderColor: n.pinned ? "var(--pm-accent-dim)" : "var(--pm-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", color: "var(--pm-muted)" }}>
              {new Date(n.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              {n.pinned && <span style={{ color: "var(--pm-accent)", marginLeft: "8px" }}>PINNED</span>}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button className="pm-copy-btn" onClick={() => navigator.clipboard.writeText(n.content)}>COPY</button>
              <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => togglePin(n)}>{n.pinned ? "UNPIN" : "PIN"}</button>
              <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => deleteNote(n.id)}>DEL</button>
            </div>
          </div>
          <div style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{n.content}</div>
        </div>
      ))}
      {notes.length === 0 && <div style={{ color: "var(--pm-muted)", fontSize: "12px", padding: "16px 0" }}>No notes yet.</div>}
    </div>
  );
}

function ResourcesTab({ projectId, resources, credentials, onSave }: { projectId: string; resources: Resource[]; credentials: Credential[]; onSave: () => void }) {
  const [resForm, setResForm] = useState({ label: "", url: "", resource_type: "URL", notes: "" });
  const [credForm, setCredForm] = useState({ label: "", credential_value: "", username: "", url: "", role_type: "API Key", notes: "" });
  const [addingRes, setAddingRes] = useState(false);
  const [addingCred, setAddingCred] = useState(false);
  const [showCreds, setShowCreds] = useState<Record<string, boolean>>({});

  async function addResource() {
    if (!resForm.label.trim()) return;
    await (supabasePM as any).from("project_resources").insert({ project_id: projectId, ...resForm });
    setResForm({ label: "", url: "", resource_type: "URL", notes: "" }); setAddingRes(false); onSave();
  }

  async function addCredential() {
    if (!credForm.label.trim()) return;
    await (supabasePM as any).from("project_credentials").insert({ project_id: projectId, ...credForm });
    setCredForm({ label: "", credential_value: "", username: "", url: "", role_type: "API Key", notes: "" }); setAddingCred(false); onSave();
  }

  async function deleteResource(id: string) {
    await (supabasePM as any).from("project_resources").delete().eq("id", id); onSave();
  }

  async function deleteCredential(id: string) {
    await (supabasePM as any).from("project_credentials").delete().eq("id", id); onSave();
  }

  const resTypes = ["URL", "API", "Docs", "Other"];
  const credTypes = ["API Key", "DB", "OAuth", "ENV", "Other"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span className="pm-label">RESOURCES ({resources.length})</span>
          <button className="pm-btn pm-btn-accent" onClick={() => setAddingRes(true)}>+ ADD RESOURCE</button>
        </div>
        {addingRes && (
          <div className="pm-card" style={{ padding: "16px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <input className="pm-input" placeholder="Label" value={resForm.label} onChange={e => setResForm(f => ({ ...f, label: e.target.value }))} autoFocus />
            <input className="pm-input" placeholder="URL" value={resForm.url} onChange={e => setResForm(f => ({ ...f, url: e.target.value }))} />
            <div style={{ display: "flex", gap: "6px" }}>
              {resTypes.map(t => <button key={t} className={`pm-btn${resForm.resource_type === t ? " pm-btn-accent" : ""}`} style={{ fontSize: "11px" }} onClick={() => setResForm(f => ({ ...f, resource_type: t }))}>{t}</button>)}
            </div>
            <input className="pm-input" placeholder="Notes (optional)" value={resForm.notes} onChange={e => setResForm(f => ({ ...f, notes: e.target.value }))} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="pm-btn pm-btn-accent" onClick={addResource}>ADD</button>
              <button className="pm-btn" onClick={() => setAddingRes(false)}>CANCEL</button>
            </div>
          </div>
        )}
        {resources.map(r => (
          <div key={r.id} className="pm-card" style={{ padding: "12px 16px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "10px", color: "var(--pm-muted)", border: "1px solid var(--pm-border)", padding: "2px 6px", whiteSpace: "nowrap" }}>{r.resource_type || "URL"}</span>
            <span style={{ flex: 1, fontSize: "13px" }}>{r.label}</span>
            {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "var(--pm-accent)", fontSize: "11px", textDecoration: "none" }}>OPEN</a>}
            {r.url && <button className="pm-copy-btn" onClick={() => navigator.clipboard.writeText(r.url!)}>COPY URL</button>}
            {r.notes && <span style={{ fontSize: "11px", color: "var(--pm-muted)" }}>{r.notes}</span>}
            <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => deleteResource(r.id)}>DEL</button>
          </div>
        ))}
        {resources.length === 0 && !addingRes && <div style={{ color: "var(--pm-muted)", fontSize: "12px" }}>No resources yet.</div>}
      </div>

      <hr className="pm-divider" />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span className="pm-label">CREDENTIALS ({credentials.length})</span>
          <button className="pm-btn pm-btn-accent" onClick={() => setAddingCred(true)}>+ ADD CREDENTIAL</button>
        </div>
        {addingCred && (
          <div className="pm-card" style={{ padding: "16px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <input className="pm-input" placeholder="Label (e.g. Supabase Anon Key)" value={credForm.label} onChange={e => setCredForm(f => ({ ...f, label: e.target.value }))} autoFocus />
            <input className="pm-input" placeholder="Value / Secret" value={credForm.credential_value} onChange={e => setCredForm(f => ({ ...f, credential_value: e.target.value }))} type="password" />
            <input className="pm-input" placeholder="Username / Email (optional)" value={credForm.username} onChange={e => setCredForm(f => ({ ...f, username: e.target.value }))} />
            <input className="pm-input" placeholder="URL (optional)" value={credForm.url} onChange={e => setCredForm(f => ({ ...f, url: e.target.value }))} />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {credTypes.map(t => <button key={t} className={`pm-btn${credForm.role_type === t ? " pm-btn-accent" : ""}`} style={{ fontSize: "11px" }} onClick={() => setCredForm(f => ({ ...f, role_type: t }))}>{t}</button>)}
            </div>
            <input className="pm-input" placeholder="Notes (optional)" value={credForm.notes} onChange={e => setCredForm(f => ({ ...f, notes: e.target.value }))} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="pm-btn pm-btn-accent" onClick={addCredential}>ADD</button>
              <button className="pm-btn" onClick={() => setAddingCred(false)}>CANCEL</button>
            </div>
          </div>
        )}
        {credentials.map(c => (
          <div key={c.id} className="pm-card" style={{ padding: "12px 16px", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", color: "var(--pm-accent)", border: "1px solid var(--pm-accent-dim)", padding: "2px 6px", whiteSpace: "nowrap" }}>{c.role_type || "CRED"}</span>
              <span style={{ flex: 1, fontSize: "13px" }}>{c.label}</span>
              {c.username && <span style={{ fontSize: "11px", color: "var(--pm-muted)" }}>{c.username}</span>}
              {c.url && <a href={c.url} target="_blank" rel="noreferrer" style={{ color: "var(--pm-accent)", fontSize: "11px", textDecoration: "none" }}>OPEN</a>}
              <button className="pm-copy-btn" onClick={() => setShowCreds(s => ({ ...s, [c.id]: !s[c.id] }))}>{showCreds[c.id] ? "HIDE" : "SHOW"}</button>
              {c.credential_value && <button className="pm-copy-btn" onClick={() => navigator.clipboard.writeText(c.credential_value!)}>COPY</button>}
              <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => deleteCredential(c.id)}>DEL</button>
            </div>
            {showCreds[c.id] && c.credential_value && (
              <div style={{ marginTop: "10px", background: "#0e0e0e", padding: "8px 12px", fontSize: "12px", color: "var(--pm-accent)", wordBreak: "break-all", border: "1px solid var(--pm-border)" }}>
                {c.credential_value}
              </div>
            )}
            {c.notes && <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--pm-muted)" }}>{c.notes}</div>}
          </div>
        ))}
        {credentials.length === 0 && !addingCred && <div style={{ color: "var(--pm-muted)", fontSize: "12px" }}>No credentials yet.</div>}
      </div>
    </div>
  );
}

function DevTab({ projectId, commits, onSave }: { projectId: string; commits: Commit[]; onSave: () => void }) {
  const [manualHash, setManualHash] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [gitLogRaw, setGitLogRaw] = useState("");
  const [mode, setMode] = useState<"manual" | "paste">("manual");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function addManual() {
    if (!manualMsg.trim()) return;
    setSaving(true);
    await (supabasePM as any).from("project_commits").insert({ project_id: projectId, hash: manualHash.trim() || null, message: manualMsg.trim() });
    setManualHash(""); setManualMsg(""); setSaving(false); onSave();
  }

  async function parseAndImport() {
    if (!gitLogRaw.trim()) return;
    setSaving(true);
    const lines = gitLogRaw.trim().split("\n").filter(Boolean);
    const rows = lines.map(line => {
      const match = line.match(/^([a-f0-9]{5,40})\s+(.+)$/);
      if (match) return { project_id: projectId, hash: match[1], message: match[2] };
      return { project_id: projectId, hash: null, message: line.trim() };
    });
    if (rows.length > 0) await (supabasePM as any).from("project_commits").insert(rows);
    setGitLogRaw(""); setSaving(false); onSave();
  }

  async function deleteCommit(id: string) {
    await (supabasePM as any).from("project_commits").delete().eq("id", id); onSave();
  }

  function exportCommits() {
    const text = commits.map(c => `${c.hash ? c.hash.slice(0, 7) + " " : ""}${c.message}  [${new Date(c.committed_at).toLocaleDateString("en-GB")}]`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button className={`pm-btn${mode === "manual" ? " pm-btn-accent" : ""}`} onClick={() => setMode("manual")}>MANUAL ENTRY</button>
        <button className={`pm-btn${mode === "paste" ? " pm-btn-accent" : ""}`} onClick={() => setMode("paste")}>PASTE GIT LOG</button>
        {commits.length > 0 && <button className="pm-btn" style={{ marginLeft: "auto" }} onClick={exportCommits}>{copied ? "COPIED!" : "EXPORT ALL"}</button>}
      </div>
      {mode === "manual" && (
        <div style={{ display: "flex", gap: "10px" }}>
          <input className="pm-input" placeholder="Hash (optional)" value={manualHash} onChange={e => setManualHash(e.target.value)} style={{ width: "140px", flexShrink: 0 }} />
          <input className="pm-input" placeholder="Commit message" value={manualMsg} onChange={e => setManualMsg(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && addManual()} />
          <button className="pm-btn pm-btn-accent" onClick={addManual} disabled={saving}>{saving ? "..." : "ADD"}</button>
        </div>
      )}
      {mode === "paste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="pm-label">PASTE OUTPUT OF: git log --oneline</div>
          <textarea className="pm-input" placeholder={"abc1234 feat: add login page\ndef5678 fix: resolve auth bug"} value={gitLogRaw} onChange={e => setGitLogRaw(e.target.value)} rows={8} style={{ resize: "vertical", lineHeight: "1.6" }} />
          <div><button className="pm-btn pm-btn-accent" onClick={parseAndImport} disabled={saving}>{saving ? "IMPORTING..." : "IMPORT"}</button></div>
        </div>
      )}
      <hr className="pm-divider" />
      <div className="pm-label">{commits.length} COMMIT{commits.length !== 1 ? "S" : ""}</div>
      {commits.map(c => (
        <div key={c.id} className="pm-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "2px" }}>
          {c.hash && <code style={{ fontSize: "11px", color: "var(--pm-accent)", background: "#0e0e0e", padding: "2px 6px", flexShrink: 0 }}>{c.hash.slice(0, 7)}</code>}
          <span style={{ flex: 1, fontSize: "13px" }}>{c.message}</span>
          <span style={{ fontSize: "10px", color: "var(--pm-muted)", whiteSpace: "nowrap" }}>{new Date(c.committed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => deleteCommit(c.id)}>DEL</button>
        </div>
      ))}
      {commits.length === 0 && <div style={{ color: "var(--pm-muted)", fontSize: "12px" }}>No commits logged.</div>}
    </div>
  );
}

function AITab({ project, features, notes, commits, resources, aiPrompts, onSave }: {
  project: Project; features: Feature[]; notes: Note[]; commits: Commit[]; resources: Resource[]; aiPrompts: AIPrompt[]; onSave: () => void;
}) {
  const [nextSteps, setNextSteps] = useState(project.next_steps || "");
  const [promptTitle, setPromptTitle] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [handover, setHandover] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedNS, setSavedNS] = useState(false);
  const [workingStyle, setWorkingStyle] = useState("");

  useEffect(() => {
    (supabasePM as any).from("working_style").select("*").limit(1).then(({ data }: any) => {
      if (data && data[0]) setWorkingStyle(data[0].content);
    });
  }, []);

  async function saveNextSteps() {
    await (supabasePM as any).from("projects").update({ next_steps: nextSteps || null }).eq("id", project.id);
    setSavedNS(true); setTimeout(() => setSavedNS(false), 2000); onSave();
  }

  async function addPrompt() {
    if (!promptTitle.trim() || !promptContent.trim()) return;
    await (supabasePM as any).from("project_ai_prompts").insert({ project_id: project.id, title: promptTitle.trim(), content: promptContent.trim() });
    setPromptTitle(""); setPromptContent(""); setAddingPrompt(false); onSave();
  }

  async function togglePinPrompt(p: AIPrompt) {
    await (supabasePM as any).from("project_ai_prompts").update({ pinned: !p.pinned }).eq("id", p.id); onSave();
  }

  async function deletePrompt(id: string) {
    await (supabasePM as any).from("project_ai_prompts").delete().eq("id", id); onSave();
  }

  function generateHandover() {
    const lines: string[] = [];
    lines.push("=".repeat(64));
    lines.push("AI HANDOVER BLOCK");
    lines.push("=".repeat(64));
    lines.push("");
    lines.push("PROJECT: " + project.name);
    if (project.description) lines.push("DESCRIPTION: " + project.description);
    lines.push("");
    if (project.scope) { lines.push("-- SCOPE --"); lines.push(project.scope); lines.push(""); }
    if (features.length > 0) {
      lines.push("-- FEATURES --");
      features.forEach(f => lines.push(`[${f.status.toUpperCase()}] ${f.title}${f.notes ? " // " + f.notes : ""}`));
      lines.push("");
    }
    const recentCommits = commits.slice(0, 10);
    if (recentCommits.length > 0) {
      lines.push("-- LAST " + recentCommits.length + " COMMITS --");
      recentCommits.forEach(c => lines.push(`${c.hash ? c.hash.slice(0, 7) + " " : ""}${c.message}`));
      lines.push("");
    }
    if (resources.length > 0) {
      lines.push("-- RESOURCES (no credentials) --");
      resources.forEach(r => lines.push(`[${r.resource_type || "URL"}] ${r.label}${r.url ? " -> " + r.url : ""}${r.notes ? " // " + r.notes : ""}`));
      lines.push("");
    }
    const notesToShow = [...notes.filter(n => n.pinned), ...notes.filter(n => !n.pinned).slice(0, 5)];
    if (notesToShow.length > 0) {
      lines.push("-- NOTES --");
      notesToShow.forEach(n => lines.push(`${n.pinned ? "[PINNED] " : ""}${n.content}`));
      lines.push("");
    }
    const pinnedPrompts = aiPrompts.filter(p => p.pinned);
    if (pinnedPrompts.length > 0) {
      lines.push("-- PINNED AI PROMPTS --");
      pinnedPrompts.forEach(p => { lines.push(p.title + ":"); lines.push(p.content); lines.push(""); });
    }
    if (nextSteps) { lines.push("-- NEXT STEPS --"); lines.push(nextSteps); lines.push(""); }
    if (workingStyle) { lines.push("-- WORKING STYLE --"); lines.push(workingStyle); lines.push(""); }
    lines.push("=".repeat(64));
    setHandover(lines.join("\n"));
  }

  function copyHandover() {
    navigator.clipboard.writeText(handover);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <div className="pm-label" style={{ marginBottom: "8px" }}>NEXT STEPS</div>
        <textarea className="pm-input" value={nextSteps} onChange={e => setNextSteps(e.target.value)} rows={4} placeholder="What needs to happen next? This will be included in the AI handover block." style={{ resize: "vertical", lineHeight: "1.7" }} />
        <div style={{ marginTop: "8px" }}>
          <button className="pm-btn pm-btn-accent" onClick={saveNextSteps}>{savedNS ? "SAVED" : "SAVE NEXT STEPS"}</button>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span className="pm-label">AI HANDOVER BLOCK</span>
          <button className="pm-btn pm-btn-accent" onClick={generateHandover}>GENERATE</button>
          {handover && <button className="pm-btn" onClick={copyHandover}>{copied ? "COPIED!" : "COPY ALL"}</button>}
        </div>
        {handover && (
          <pre style={{ background: "#0a0a0a", border: "1px solid var(--pm-border-bright)", padding: "16px", fontSize: "12px", lineHeight: "1.7", color: "var(--pm-text)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "480px", overflowY: "auto" }}>
            {handover}
          </pre>
        )}
      </div>
      <hr className="pm-divider" />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span className="pm-label">SAVED PROMPTS ({aiPrompts.length})</span>
          <button className="pm-btn pm-btn-accent" onClick={() => setAddingPrompt(true)}>+ ADD PROMPT</button>
        </div>
        {addingPrompt && (
          <div className="pm-card" style={{ padding: "16px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <input className="pm-input" placeholder="Prompt title" value={promptTitle} onChange={e => setPromptTitle(e.target.value)} autoFocus />
            <textarea className="pm-input" placeholder="Prompt content" value={promptContent} onChange={e => setPromptContent(e.target.value)} rows={6} style={{ resize: "vertical", lineHeight: "1.7" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="pm-btn pm-btn-accent" onClick={addPrompt}>SAVE</button>
              <button className="pm-btn" onClick={() => { setAddingPrompt(false); setPromptTitle(""); setPromptContent(""); }}>CANCEL</button>
            </div>
          </div>
        )}
        {aiPrompts.map(p => (
          <div key={p.id} className="pm-card" style={{ padding: "14px 16px", marginBottom: "4px", borderColor: p.pinned ? "var(--pm-accent-dim)" : "var(--pm-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500 }}>{p.pinned && <span style={{ color: "var(--pm-accent)", marginRight: "8px" }}>*</span>}{p.title}</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="pm-copy-btn" onClick={() => navigator.clipboard.writeText(p.content)}>COPY</button>
                <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => togglePinPrompt(p)}>{p.pinned ? "UNPIN" : "PIN"}</button>
                <button className="pm-btn pm-btn-danger" style={{ fontSize: "11px", padding: "2px 8px" }} onClick={() => deletePrompt(p.id)}>DEL</button>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--pm-muted)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{p.content}</div>
          </div>
        ))}
        {aiPrompts.length === 0 && !addingPrompt && <div style={{ color: "var(--pm-muted)", fontSize: "12px" }}>No prompts saved.</div>}
      </div>
    </div>
  );
}