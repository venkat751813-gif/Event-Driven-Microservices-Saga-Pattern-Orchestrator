import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { execution_id, saga_id, limit } = req.query;
      let q = supabase.from('sagaforge_events').select('*').order('id', { ascending: false });
      if (execution_id) q = q.eq('execution_id', execution_id);
      if (saga_id) q = q.eq('saga_id', saga_id);
      const cap = Math.min(parseInt(limit || '200', 10) || 200, 500);
      const { data, error } = await q.limit(cap);
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('events API error:', err);
    res.status(500).json({ error: err.message });
  }
}
