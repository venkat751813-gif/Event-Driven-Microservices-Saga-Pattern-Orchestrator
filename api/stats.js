import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [sagas, services, executions, events] = await Promise.all([
      supabase.from('sagaforge_sagas').select('*'),
      supabase.from('sagaforge_services').select('*'),
      supabase.from('sagaforge_executions').select('*').order('id', { ascending: false }).limit(200),
      supabase.from('sagaforge_events').select('*').order('id', { ascending: false }).limit(12),
    ]);
    if (sagas.error) throw sagas.error;
    if (services.error) throw services.error;
    if (executions.error) throw executions.error;
    if (events.error) throw events.error;

    const execs = executions.data || [];
    const byStatus = execs.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});
    const healthy = (services.data || []).filter((s) => s.status === 'healthy').length;

    return res.status(200).json({
      sagas: (sagas.data || []).length,
      services: (services.data || []).length,
      healthyServices: healthy,
      executions: execs.length,
      byStatus,
      recentExecutions: execs.slice(0, 8),
      recentEvents: events.data || [],
      publishedSagas: (sagas.data || []).filter((s) => s.status === 'published').length,
    });
  } catch (err) {
    console.error('stats API error:', err);
    res.status(500).json({ error: err.message });
  }
}
