import supabase from './db-client.js';

function corrId() {
  return 'sfg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

async function logEvent(row) {
  const { data, error } = await supabase.from('sagaforge_events').insert(row).select().single();
  if (error) throw error;
  return data;
}

async function loadSteps(sagaId) {
  const { data, error } = await supabase
    .from('sagaforge_steps')
    .select('*')
    .eq('saga_id', sagaId)
    .order('step_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function compensate(exec, steps, userId) {
  const completed = steps.filter((s) => s.step_order < exec.current_step);
  const reversed = [...completed].sort((a, b) => b.step_order - a.step_order);

  await supabase
    .from('sagaforge_executions')
    .update({ status: 'compensating' })
    .eq('id', exec.id);

  await logEvent({
    execution_id: exec.id,
    saga_id: exec.saga_id,
    step_id: null,
    event_type: 'saga.compensating',
    event_name: 'SagaCompensationStarted',
    payload: JSON.stringify({ remaining: reversed.length }),
    direction: 'compensate',
    status: 'success',
    message: `Starting compensating transactions for ${reversed.length} completed step(s)`,
    duration_ms: 0,
  });

  for (const step of reversed) {
    const latency = 40 + Math.floor(Math.random() * 180);
    await logEvent({
      execution_id: exec.id,
      saga_id: exec.saga_id,
      step_id: step.id,
      event_type: 'compensate.command',
      event_name: step.compensate_action || `Compensate${step.action || step.name}`,
      payload: JSON.stringify({ step: step.name, action: step.compensate_action }),
      direction: 'compensate',
      status: 'success',
      message: `Compensating “${step.name}” via ${step.compensate_action || 'rollback'}`,
      duration_ms: latency,
    });
    await logEvent({
      execution_id: exec.id,
      saga_id: exec.saga_id,
      step_id: step.id,
      event_type: 'compensate.completed',
      event_name: (step.compensate_action || 'Compensated') + 'Completed',
      payload: JSON.stringify({ step: step.name }),
      direction: 'compensate',
      status: 'success',
      message: `Compensation for “${step.name}” committed`,
      duration_ms: latency,
    });
  }

  const finalStatus = reversed.length ? 'compensated' : 'failed';
  const { data: updated, error } = await supabase
    .from('sagaforge_executions')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', exec.id)
    .select()
    .single();
  if (error) throw error;

  await logEvent({
    execution_id: exec.id,
    saga_id: exec.saga_id,
    step_id: null,
    event_type: finalStatus === 'compensated' ? 'saga.compensated' : 'saga.failed',
    event_name: finalStatus === 'compensated' ? 'SagaCompensated' : 'SagaFailed',
    payload: JSON.stringify({ status: finalStatus }),
    direction: 'emit',
    status: finalStatus === 'compensated' ? 'success' : 'failure',
    message: finalStatus === 'compensated'
      ? 'Saga rolled back. All compensating transactions completed.'
      : 'Saga failed on the first step. Nothing to compensate.',
    duration_ms: 0,
  });

  return updated;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: auth, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !auth?.user) return res.status(401).json({ error: 'Invalid token' });
    const user = auth.user;

    const { action, saga_id, execution_id, payload } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action is required' });

    if (action === 'start') {
      if (!saga_id) return res.status(400).json({ error: 'saga_id is required' });
      const { data: saga, error: sErr } = await supabase
        .from('sagaforge_sagas')
        .select('*')
        .eq('id', saga_id)
        .single();
      if (sErr || !saga) return res.status(404).json({ error: 'Saga not found' });
      const steps = await loadSteps(saga_id);
      if (!steps.length) return res.status(400).json({ error: 'Saga has no steps' });

      const first = steps[0];
      const bodyPayload = typeof payload === 'string' ? payload : JSON.stringify(payload || { orderId: 'ORD-' + Date.now() });
      const { data: exec, error: eErr } = await supabase
        .from('sagaforge_executions')
        .insert({
          saga_id,
          saga_name: saga.name,
          user_id: user.id,
          correlation_id: corrId(),
          status: 'running',
          current_step: first.step_order,
          payload: bodyPayload,
        })
        .select()
        .single();
      if (eErr) throw eErr;

      await logEvent({
        execution_id: exec.id,
        saga_id,
        step_id: null,
        event_type: 'saga.started',
        event_name: 'SagaStarted',
        payload: bodyPayload,
        direction: 'emit',
        status: 'success',
        message: `Orchestrator started “${saga.name}” (${saga.pattern})`,
        duration_ms: 0,
      });
      await logEvent({
        execution_id: exec.id,
        saga_id,
        step_id: first.id,
        event_type: 'step.command',
        event_name: first.action || first.name,
        payload: bodyPayload,
        direction: 'emit',
        status: 'success',
        message: `Dispatch ${first.action || first.name} → ${first.name}`,
        duration_ms: 12,
      });

      return res.status(201).json(exec);
    }

    if (!execution_id) return res.status(400).json({ error: 'execution_id is required' });
    const { data: exec, error: exErr } = await supabase
      .from('sagaforge_executions')
      .select('*')
      .eq('id', execution_id)
      .single();
    if (exErr || !exec) return res.status(404).json({ error: 'Execution not found' });
    if (['completed', 'failed', 'compensated'].includes(exec.status) && action !== 'succeed' && action !== 'fail' && action !== 'autorun') {
      return res.status(400).json({ error: 'Execution already finished' });
    }
    if (['completed', 'failed', 'compensated'].includes(exec.status)) {
      return res.status(400).json({ error: 'Execution already finished' });
    }

    const steps = await loadSteps(exec.saga_id);
    const current = steps.find((s) => s.step_order === exec.current_step);
    if (!current && action !== 'autorun') return res.status(400).json({ error: 'Current step not found' });

    if (action === 'succeed') {
      const latency = 30 + Math.floor(Math.random() * 240);
      await logEvent({
        execution_id: exec.id,
        saga_id: exec.saga_id,
        step_id: current.id,
        event_type: 'step.succeeded',
        event_name: current.event_success || (current.action + 'Succeeded'),
        payload: exec.payload,
        direction: 'consume',
        status: 'success',
        message: `“${current.name}” succeeded · ${current.event_success || 'ok'}`,
        duration_ms: latency,
      });

      const next = steps.find((s) => s.step_order === exec.current_step + 1);
      if (!next) {
        const { data: updated, error } = await supabase
          .from('sagaforge_executions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', exec.id)
          .select()
          .single();
        if (error) throw error;
        await logEvent({
          execution_id: exec.id,
          saga_id: exec.saga_id,
          step_id: null,
          event_type: 'saga.completed',
          event_name: 'SagaCompleted',
          payload: exec.payload,
          direction: 'emit',
          status: 'success',
          message: 'All steps committed. Saga completed successfully.',
          duration_ms: 0,
        });
        return res.status(200).json(updated);
      }

      const { data: updated, error } = await supabase
        .from('sagaforge_executions')
        .update({ current_step: next.step_order, status: 'running' })
        .eq('id', exec.id)
        .select()
        .single();
      if (error) throw error;
      await logEvent({
        execution_id: exec.id,
        saga_id: exec.saga_id,
        step_id: next.id,
        event_type: 'step.command',
        event_name: next.action || next.name,
        payload: exec.payload,
        direction: 'emit',
        status: 'success',
        message: `Dispatch ${next.action || next.name} → ${next.name}`,
        duration_ms: 10,
      });
      return res.status(200).json(updated);
    }

    if (action === 'fail') {
      const latency = 20 + Math.floor(Math.random() * 160);
      await logEvent({
        execution_id: exec.id,
        saga_id: exec.saga_id,
        step_id: current.id,
        event_type: 'step.failed',
        event_name: current.event_failure || (current.action + 'Failed'),
        payload: exec.payload,
        direction: 'consume',
        status: 'failure',
        message: `“${current.name}” failed · beginning compensation`,
        duration_ms: latency,
      });
      const updated = await compensate(exec, steps, user.id);
      return res.status(200).json(updated);
    }

    if (action === 'autorun') {
      let state = exec;
      let guard = 0;
      while (state.status === 'running' && guard < 40) {
        guard += 1;
        const cur = steps.find((s) => s.step_order === state.current_step);
        if (!cur) break;
        const latency = 20 + Math.floor(Math.random() * 120);
        await logEvent({
          execution_id: state.id,
          saga_id: state.saga_id,
          step_id: cur.id,
          event_type: 'step.succeeded',
          event_name: cur.event_success || (cur.action + 'Succeeded'),
          payload: state.payload,
          direction: 'consume',
          status: 'success',
          message: `“${cur.name}” succeeded (auto-run)`,
          duration_ms: latency,
        });
        const next = steps.find((s) => s.step_order === state.current_step + 1);
        if (!next) {
          const { data: updated, error } = await supabase
            .from('sagaforge_executions')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', state.id)
            .select()
            .single();
          if (error) throw error;
          await logEvent({
            execution_id: state.id,
            saga_id: state.saga_id,
            step_id: null,
            event_type: 'saga.completed',
            event_name: 'SagaCompleted',
            payload: state.payload,
            direction: 'emit',
            status: 'success',
            message: 'Auto-run finished. Saga completed successfully.',
            duration_ms: 0,
          });
          return res.status(200).json(updated);
        }
        const { data: updated, error } = await supabase
          .from('sagaforge_executions')
          .update({ current_step: next.step_order, status: 'running' })
          .eq('id', state.id)
          .select()
          .single();
        if (error) throw error;
        await logEvent({
          execution_id: state.id,
          saga_id: state.saga_id,
          step_id: next.id,
          event_type: 'step.command',
          event_name: next.action || next.name,
          payload: state.payload,
          direction: 'emit',
          status: 'success',
          message: `Dispatch ${next.action || next.name} → ${next.name}`,
          duration_ms: 8,
        });
        state = updated;
      }
      return res.status(200).json(state);
    }

    return res.status(400).json({ error: 'Unknown action. Use start, succeed, fail, or autorun.' });
  } catch (err) {
    console.error('execute API error:', err);
    res.status(500).json({ error: err.message });
  }
}
