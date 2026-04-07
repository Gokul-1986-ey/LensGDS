'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditInput, AuditReport } from '@/types/audit';

export type AuditStatus = 'idle' | 'collecting' | 'analyzing' | 'generating' | 'complete' | 'error';

interface AuditState {
  input: AuditInput | null;
  report: AuditReport | null;
  htmlContent: string | null;
  status: AuditStatus;
  error: string | null;
  progress: string[];

  // Actions
  startAudit: (input: AuditInput) => void;
  setStatus: (status: AuditStatus) => void;
  addProgress: (message: string) => void;
  setReport: (report: AuditReport, html: string) => void;
  setError: (error: string) => void;
  clearAudit: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      input: null,
      report: null,
      htmlContent: null,
      status: 'idle',
      error: null,
      progress: [],

      startAudit: (input: AuditInput) =>
        set({ input, report: null, htmlContent: null, status: 'collecting', error: null, progress: ['Audit started...'] }),

      setStatus: (status: AuditStatus) =>
        set({ status }),

      addProgress: (message: string) =>
        set((state) => ({ progress: [...state.progress, message] })),

      setReport: (report: AuditReport, html: string) =>
        set({ report, htmlContent: html, status: 'complete' }),

      setError: (error: string) =>
        set({ error, status: 'error' }),

      clearAudit: () =>
        set({ input: null, report: null, htmlContent: null, status: 'idle', error: null, progress: [] }),
    }),
    {
      name: 'audit-store',
      partialize: (state) => ({
        input: state.input,
        report: state.report,
        status: state.status === 'complete' ? 'complete' : 'idle',
      }),
    }
  )
);
