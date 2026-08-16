export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  endpoint: string;
  status: string;
  color: string;
  owner: string;
  created_at?: string;
}

export interface SagaStep {
  id: number;
  saga_id: number;
  service_id: number | null;
  step_order: number;
  name: string;
  action: string;
  event_success: string;
  event_failure: string;
  compensate_action: string;
  payload_schema: string;
  timeout_ms: number;
  retry_count: number;
}

export interface Saga {
  id: number;
  user_id: string;
  name: string;
  description: string;
  pattern: 'orchestrated' | 'choreographed' | string;
  status: string;
  created_at?: string;
  updated_at?: string;
  steps?: SagaStep[];
}

export interface Execution {
  id: number;
  saga_id: number;
  saga_name?: string;
  user_id: string;
  correlation_id: string;
  status: string;
  current_step: number;
  started_at?: string;
  completed_at?: string | null;
  payload: string;
  events?: BusEvent[];
  steps?: SagaStep[];
  saga?: Saga;
}

export interface BusEvent {
  id: number;
  execution_id: number;
  saga_id: number;
  step_id: number | null;
  event_type: string;
  event_name: string;
  payload: string;
  direction: string;
  status: string;
  message: string;
  duration_ms: number;
  created_at?: string;
}

export interface Stats {
  sagas: number;
  services: number;
  healthyServices: number;
  executions: number;
  byStatus: Record<string, number>;
  recentExecutions: Execution[];
  recentEvents: BusEvent[];
  publishedSagas: number;
}
