// api/config.js - System config (GET, POST)
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const { key } = req.query;

            let query = supabase.from('config').select('*');
            if (key) query = query.eq('key', key);

            const { data, error } = await query;
            if (error) throw error;

            // Mask sensitive fields
            const result = (data || []).map(item => {
                if (item.key === 'dianping' && item.data) {
                    const appkey = item.data.appkey || '';
                    return {
                        ...item,
                        data: {
                            ...item.data,
                            appkey: appkey ? '***' + appkey.slice(-4) : '',
                            secret: item.data.secret ? '***' : ''
                        }
                    };
                }
                return item;
            });

            return res.json(result);
        }

        if (req.method === 'POST') {
            const { key, data } = req.body;
            if (!key || !data) return res.status(400).json({ error: 'Missing key or data' });

            const { data: existing } = await supabase
                .from('config')
                .select('id')
                .eq('key', key)
                .maybeSingle();

            let result;
            if (existing) {
                result = await supabase
                    .from('config')
                    .update({ data })
                    .eq('key', key);
            } else {
                result = await supabase
                    .from('config')
                    .insert({ key, data });
            }

            if (result.error) throw result.error;
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[Config] Error:', err);
        res.status(500).json({ error: err.message });
    }
}
