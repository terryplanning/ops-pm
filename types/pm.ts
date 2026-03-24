export type Project = {
  id: string;
  name: string;
  description: string | null;
  scope: string | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
};

export type Feature = {
  id: string;
  project_id: string;
  title: string;
  status: "Planned" | "In Progress" | "Done";
  notes: string | null;
  sort_order: number;
  created_at: string;
};

export type Note = {
  id: string;
  project_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
};

export type Commit = {
  id: string;
  project_id: string;
  hash: string | null;
  message: string;
  committed_at: string;
  created_at: string;
};

export type Resource = {
  id: string;
  project_id: string;
  label: string;
  url: string | null;
  resource_type: string | null;
  notes: string | null;
  created_at: string;
};

export type Credential = {
  id: string;
  project_id: string;
  label: string;
  credential_value: string | null;
  username: string | null;
  url: string | null;
  role_type: string | null;
  notes: string | null;
  created_at: string;
};

export type AIPrompt = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
};

export type WorkingStyle = {
  id: string;
  content: string;
  updated_at: string;
};