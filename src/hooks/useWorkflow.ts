import { useState, useCallback } from 'react';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));

function getHeaders() {
  const token = localStorage.getItem('campusspend_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export interface WorkflowStep {
  id: number;
  step_sequence: number;
  assigned_role_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'queued' | 'cancelled';
  sla_hours: number;
  due_at: string;
  actioned_at: string | null;
  comments: string | null;
  escalated_to_role: string | null;
  actioned_by_name?: string;
  entity_details?: {
    id: string;
    module: string;
    created_by: string;
    created_at: string;
    status: string;
    value: number;
  };
}

export interface WorkflowTimeline {
  instance: {
    id: number;
    module: string;
    entity_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  steps: WorkflowStep[];
  document: {
    status: string;
    current_approver: string | null;
    next_role: string | null;
    workflow_history: Array<{
      user: string;
      role?: string;
      action: string;
      comments?: string;
      timestamp: string;
    }>;
    approval_level: number;
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
  };
}

export function useWorkflow() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<WorkflowTimeline | null>(null);
  const [pendingSteps, setPendingSteps] = useState<WorkflowStep[]>([]);

  const fetchTimeline = useCallback(async (module: string, entityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/workflows/timeline/?module=${module}&entity_id=${entityId}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) {
          setTimeline(null);
          return null;
        }
        throw new Error('Failed to fetch workflow timeline');
      }
      const data = await res.json();
      setTimeline(data);
      return data as WorkflowTimeline;
    } catch (err: any) {
      setError(err.message || 'Error fetching timeline');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingSteps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/workflows/pending/`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch pending steps');
      const data = await res.json();
      setPendingSteps(data);
      return data as WorkflowStep[];
    } catch (err: any) {
      setError(err.message || 'Error fetching pending steps');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const submitDocumentWorkflow = useCallback(async (module: string, entityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/workflows/submit/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ module, entity_id: entityId }),
      });
      if (!res.ok) {
        const errorText = await res.json();
        throw new Error(errorText.error || 'Failed to submit workflow');
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Error submitting workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const actionWorkflowStep = useCallback(async (
    stepId: number, 
    action: 'approve' | 'reject' | 'hold' | 'send_back', 
    comments: string,
    justification?: string,
    recommended_vendor?: string,
    decision?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/workflows/action_step/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          step_id: stepId, 
          action, 
          comments,
          justification,
          recommended_vendor,
          decision
        }),
      });
      if (!res.ok) {
        const errorText = await res.json();
        throw new Error(errorText.error || 'Failed to action workflow step');
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Error actioning workflow step');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerEscalation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/workflows/escalate/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to escalate steps');
      const data = await res.json();
      return data;
    } catch (err: any) {
      setError(err.message || 'Error escalating steps');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    timeline,
    pendingSteps,
    fetchTimeline,
    fetchPendingSteps,
    submitDocumentWorkflow,
    actionWorkflowStep,
    triggerEscalation,
  };
}
