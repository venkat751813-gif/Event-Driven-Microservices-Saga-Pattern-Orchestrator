import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { saga_id } = req.query;
      let q = supabase.from('sagaforge_steps').select('*').order('step_order', { ascending: true });
      if (saga_id) q = q.eq('saga_id', saga_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: auth, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !auth?.user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.saga_id || !body.name) return res.status(400).json({ error: 'saga_id and name are required' });
      let order = body.step_order;
      if (!order) {
        const { data: existing } = await supabase
          .from('sagaforge_steps')
          .select('step_order')
          .eq('saga_id', body.saga_id)
          .order('step_order', { ascending: false })
          .limit(1);
        order = existing && existing.length ? existing[0].step_order + 1 : 1;
      }
      const { data, error } = await supabase
        .from('sagaforge_steps')
        .insert({
          saga_id: body.saga_id,
          service_id: body.service_id || null,
          step_order: order,
          name: body.name,
          action: body.action || '',
          event_success: body.event_success || '',
          event_failure: body.event_failure || '',
          compensate_action: body.compensate_action || '',
          payload_schema: typeof body.payload_schema === 'string' ? body.payload_schema : JSON.stringify(body.payload_schema || {}),
          timeout_ms: body.timeout_ms || 5000,
          retry_count: body.retry_count || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...rest } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const allowed = [
        'service_id', 'step_order', 'name', 'action', 'event_success',
        'event_failure', 'compensate_action', 'payload_schema', 'timeout_ms', 'retry_count',
      ];
      const patch = {};
      for (const k of allowed) {
        if (rest[k] !== undefined) {
          patch[k] = k === 'payload_schema' && typeof rest[k] !== 'string'
            ? JSON.stringify(rest[k])
            : rest[k];
        }
      }
      const { data, error } = await supabase
        .from('sagaforge_steps')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data: step } = await supabase.from('sagaforge_steps').select('*').eq('id', id).single();
      const { error } = await supabase.from('sagaforge_steps').delete().eq('id', id);
      if (error) throw error;
      if (step) {
        const { data: remaining } = await supabase
          .from('sagaforge_steps')
          .select('*')
          .eq('saga_id', step.saga_id)
          .order('step_order', { ascending: true });
        if (remaining) {
          for (let i = 0; i < remaining.length; i++) {
            if (remaining[i].step_order !== i + 1) {
              await supabase.from('sagaforge_steps').update({ step_order: i + 1 }).eq('id', remaining[i].id);
            }
          }
        }
      }
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('steps API error:', err);
    res.status(500).json({ error: err.message });
  }
}
