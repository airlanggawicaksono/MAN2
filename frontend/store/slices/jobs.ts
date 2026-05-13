import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { JobResponse, JobStatus, JobType } from "@/types/jobs";

interface TrackedJob {
  jobId: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  total: number;
  startedAt: string;
}

interface JobsState {
  tracked: Record<string, TrackedJob>;
}

const initialState: JobsState = {
  tracked: {},
};

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    trackJob(state, action: PayloadAction<JobResponse>) {
      const j = action.payload;
      state.tracked[j.job_id] = {
        jobId: j.job_id,
        jobType: j.job_type,
        status: j.status,
        progress: j.progress,
        total: j.total,
        startedAt: j.created_at,
      };
    },
    updateJob(state, action: PayloadAction<JobResponse>) {
      const j = action.payload;
      const existing = state.tracked[j.job_id];
      if (!existing) return;
      existing.status = j.status;
      existing.progress = j.progress;
      existing.total = j.total;
    },
    untrackJob(state, action: PayloadAction<string>) {
      delete state.tracked[action.payload];
    },
    clearJobs(state) {
      state.tracked = {};
    },
  },
});

export const { trackJob, updateJob, untrackJob, clearJobs } = jobsSlice.actions;

export default jobsSlice.reducer;
