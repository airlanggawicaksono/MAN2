export type JobStatus = "pending" | "running" | "succeeded" | "failed";

export type JobType =
  | "import_students"
  | "import_teachers"
  | "export_students"
  | "export_teachers";

export interface JobResponse {
  job_id: string;
  user_id: string;
  job_type: JobType;
  status: JobStatus;
  idempotency_key: string;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  progress: number;
  total: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export function isJobTerminal(status: JobStatus): boolean {
  return status === "succeeded" || status === "failed";
}
