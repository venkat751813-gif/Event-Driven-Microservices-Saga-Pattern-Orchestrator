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
        const { data, error } = await supabase
          .from('sagaforge_services')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      const { data, error } = await supabase
        .from('sagaforge_services')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: auth, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !auth?.user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'POST') {
      const { name, slug, description, endpoint, status, color, owner } = req.body || {};
      if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
      const { data, error } = await supabase
        .from('sagaforge_services')
        .insert({
          name,
          slug: String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          description: description || '',
          endpoint: endpoint || '',
          status: status || 'healthy',
          color: color || '#e8a317',
          owner: owner || auth.user.email || 'unassigned',
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, slug, description, endpoint, status, color, owner } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = {};
      if (name !== undefined) patch.name = name;
      if (slug !== undefined) patch.slug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (description !== undefined) patch.description = description;
      if (endpoint !== undefined) patch.endpoint = endpoint;
      if (status !== undefined) patch.status = status;
      if (color !== undefined) patch.color = color;
      if (owner !== undefined) patch.owner = owner;
      const { data, error } = await supabase
        .from('sagaforge_services')
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
      const { error } = await supabase.from('sagaforge_services').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('services API error:', err);
    res.status(500).json({ error: err.message });
  }
}
