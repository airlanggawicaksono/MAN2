"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useGetJobQuery } from "@/api/admin/jobs";
import { updateJob, untrackJob } from "@/store/slices/jobs";
import { isJobTerminal, type JobResponse } from "@/types/jobs";

interface UseJobPollingOptions {
  jobId: string | null;
  intervalMs?: number;
  onSucceeded?: (job: JobResponse) => void;
  onFailed?: (job: JobResponse) => void;
}

export function useJobPolling({
  jobId,
  intervalMs = 1500,
  onSucceeded,
  onFailed,
}: UseJobPollingOptions) {
  const dispatch = useDispatch();
  const handledRef = useRef<string | null>(null);

  const { data, isFetching, error } = useGetJobQuery(jobId ?? "", {
    skip: !jobId,
    pollingInterval: jobId ? intervalMs : 0,
  });

  useEffect(() => {
    if (!data || !jobId) return;
    dispatch(updateJob(data));
    if (!isJobTerminal(data.status)) return;
    if (handledRef.current === data.job_id) return;
    handledRef.current = data.job_id;
    if (data.status === "succeeded") {
      onSucceeded?.(data);
    } else if (data.status === "failed") {
      onFailed?.(data);
    }
    dispatch(untrackJob(data.job_id));
  }, [data, dispatch, jobId, onSucceeded, onFailed]);

  return {
    job: data,
    isPolling: isFetching && !!jobId,
    error,
  };
}
