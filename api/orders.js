// api/orders.js - Orders CRUD (GET list, POST create/update)
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            let query = supabase.from('orders').select('*');

            if (req.query.date) {
                query = query.eq('date', req.query.date);
            }

            const { data, error } = await query.order('date', { ascending: false });
            if (error) throw error;
            return res.json(data || []);
        }

        if (req.method === 'POST') {
            const { date, data: orders } = req.body;
            if (!date || !orders) {
                return res.status(400).json({ error: 'Missing date or data' });
            }

            const { data: existing } = await supabase
                .from('orders')
                .select('id')
                .eq('date', date)
                .maybeSingle();

            let result;
            if (existing) {
                result = await supabase
                    .from('orders')
                    .update({ data: orders, updated_at: new Date().toISOString() })
                    .eq('date', date);
            } else {
                result = await supabase
                    .from('orders')
                    .insert({ date, data: orders });
            }

            if (result.error) throw result.error;
            return res.json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { date } = req.body;
            if (!date) return res.status(400).json({ error: 'Missing date' });
            const { error } = await supabase.from('orders').delete().eq('date', date);
            if (error) throw error;
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('[Orders] Error:', err);
        res.status(500).json({ error: err.message });
    }
}
