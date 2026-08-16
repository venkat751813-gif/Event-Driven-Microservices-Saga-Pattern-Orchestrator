import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, saga_id, status } = req.query;
      if (id) {
        const { data: exec, error } = await supabase
          .from('sagaforge_executions')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        const { data: events } = await supabase
          .from('sagaforge_events')
          .select('*')
          .eq('execution_id', id)
          .order('id', { ascending: true });
        const { data: steps } = await supabase
          .from('sagaforge_steps')
          .select('*')
          .eq('saga_id', exec.saga_id)
          .order('step_order', { ascending: true });
        const { data: saga } = await supabase
          .from('sagaforge_sagas')
          .select('*')
          .eq('id', exec.saga_id)
          .single();
        return res.status(200).json({ ...exec, events: events || [], steps: steps || [], saga });
      }
      let q = supabase.from('sagaforge_executions').select('*').order('id', { ascending: false });
      if (saga_id) q = q.eq('saga_id', saga_id);
      if (status) q = q.eq('status', status);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: auth, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !auth?.user) return res.status(401).json({ error: 'Invalid token' });
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      await supabase.from('sagaforge_events').delete().eq('execution_id', id);
      const { error } = await supabase.from('sagaforge_executions').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('executions API error:', err);
    res.status(500).json({ error: err.message });
  }
}
