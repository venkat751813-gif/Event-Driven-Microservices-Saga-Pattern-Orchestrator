import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const { data: saga, error } = await supabase
          .from('sagaforge_sagas')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        const { data: steps, error: sErr } = await supabase
          .from('sagaforge_steps')
          .select('*')
          .eq('saga_id', id)
          .order('step_order', { ascending: true });
        if (sErr) throw sErr;
        return res.status(200).json({ ...saga, steps: steps || [] });
      }
      const { data, error } = await supabase
        .from('sagaforge_sagas')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: auth, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !auth?.user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'POST') {
      const { name, description, pattern, status, steps } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const { data: saga, error } = await supabase
        .from('sagaforge_sagas')
        .insert({
          user_id: auth.user.id,
          name,
          description: description || '',
          pattern: pattern === 'choreographed' ? 'choreographed' : 'orchestrated',
          status: status || 'draft',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      if (Array.isArray(steps) && steps.length) {
        const rows = steps.map((s, i) => ({
          saga_id: saga.id,
          service_id: s.service_id || null,
          step_order: s.step_order || i + 1,
          name: s.name || `Step ${i + 1}`,
          action: s.action || '',
          event_success: s.event_success || '',
          event_failure: s.event_failure || '',
          compensate_action: s.compensate_action || '',
          payload_schema: typeof s.payload_schema === 'string' ? s.payload_schema : JSON.stringify(s.payload_schema || {}),
          timeout_ms: s.timeout_ms || 5000,
          retry_count: s.retry_count || 0,
        }));
        const { error: stErr } = await supabase.from('sagaforge_steps').insert(rows);
        if (stErr) throw stErr;
      }

      const { data: createdSteps } = await supabase
        .from('sagaforge_steps')
        .select('*')
        .eq('saga_id', saga.id)
        .order('step_order', { ascending: true });
      return res.status(201).json({ ...saga, steps: createdSteps || [] });
    }

    if (req.method === 'PUT') {
      const { id, name, description, pattern, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = { updated_at: new Date().toISOString() };
      if (name !== undefined) patch.name = name;
      if (description !== undefined) patch.description = description;
      if (pattern !== undefined) patch.pattern = pattern;
      if (status !== undefined) patch.status = status;
      const { data, error } = await supabase
        .from('sagaforge_sagas')
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
      await supabase.from('sagaforge_steps').delete().eq('saga_id', id);
      const { error } = await supabase.from('sagaforge_sagas').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('sagas API error:', err);
    res.status(500).json({ error: err.message });
  }
}
