// api/sync/dianping.js - Dianping order sync (serverless)
import { supabase } from '../_supabase.js';
import crypto from 'crypto';

function generateSignature(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}${params[key]}`).join('') + secret;
    return crypto.createHash('md5').update(queryString).digest('hex');
}

async function fetchDianpingOrders(date) {
    const appkey = process.env.DP_APPKEY || '';
    const secret = process.env.DP_SECRET || '';
    if (!appkey || !secret) throw new Error('Dianping API credentials not configured');

    const params = { appkey, format: 'json', v: '1.0', date };
    params.sign = generateSignature(params, secret);

    const url = `https://api.dianping.com/order/query?${new URLSearchParams(params).toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.orders || [];
}

function convertOrder(dp) {
    return {
        id: `#DP${dp.order_id}`.padStart(6, '0'),
        source: 'dianping',
        customerName: dp.customer_name || '未知',
        customerPhone: dp.customer_phone || '',
        service: dp.service_name || '足疗 60min',
        date: dp.order_date,
        startTime: dp.start_time || '09:00',
        duration: parseInt(dp.duration) || 60,
        price: parseInt(dp.price) || 0,
        therapistId: parseInt(dp.therapist_id) || 1,
        bedId: parseInt(dp.bed_id) || 1,
        notes: dp.remark || '',
        status: 'pending',
        addons: [],
        createdAt: new Date().toISOString()
    };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const date = req.body.date || new Date().toISOString().split('T')[0];
        console.log(`[Sync] Fetching Dianping orders for ${date}`);

        const dpOrders = await fetchDianpingOrders(date);

        const { data: existing } = await supabase
            .from('orders')
            .select('data')
            .eq('date', date)
            .maybeSingle();

        const existingOrders = existing ? (existing.data || []) : [];
        const dpIds = new Set(existingOrders.filter(o => o.dianpingOrderId).map(o => o.dianpingOrderId));

        let syncedCount = 0;
        for (const dp of dpOrders) {
            if (!dpIds.has(dp.order_id)) {
                existingOrders.push({ ...convertOrder(dp), dianpingOrderId: dp.order_id });
                syncedCount++;
            }
        }

        if (syncedCount > 0) {
            const { data: prev } = await supabase
                .from('orders')
                .select('id')
                .eq('date', date)
                .maybeSingle();

            if (prev) {
                await supabase
                    .from('orders')
                    .update({ data: existingOrders, updated_at: new Date().toISOString() })
                    .eq('date', date);
            } else {
                await supabase.from('orders').insert({ date, data: existingOrders });
            }
            console.log(`[Sync] Saved ${syncedCount} new orders`);
        } else {
            console.log('[Sync] No new orders');
        }

        res.json({ success: true, synced: syncedCount });
    } catch (err) {
        console.error('[Sync] Error:', err);
        res.status(500).json({ error: err.message });
    }
}
