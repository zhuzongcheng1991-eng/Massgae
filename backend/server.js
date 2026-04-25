const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Default config
let config = {
    dianping: {
        appkey: '',
        secret: ''
    }
};

// Orders storage
let orders = [];

// Load data from file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            orders = data.orders || [];
            config = data.config || config;
            console.log('Data loaded successfully');
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Save data to file
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ orders, config }, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Initialize data
loadData();

// ==================== Dianping API ====================

// Generate Dianping API signature
function generateDianpingSignature(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}${params[key]}`).join('') + secret;
    return crypto.createHash('md5').update(queryString).digest('hex');
}

// Call Dianping API
async function callDianpingApi(endpoint, params = {}) {
    const { appkey, secret } = config.dianping;

    if (!appkey || !secret) {
        throw new Error('Dianping API credentials not configured');
    }

    const defaultParams = {
        appkey: appkey,
        format: 'json',
        v: '1.0'
    };

    const allParams = { ...defaultParams, ...params };
    allParams.sign = generateDianpingSignature(allParams, secret);

    try {
        const response = await axios.get(`https://api.dianping.com/${endpoint}`, {
            params: allParams,
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error('Dianping API error:', error.response?.data || error.message);
        throw error;
    }
}

// Fetch orders from Dianping
async function fetchDianpingOrders(date) {
    try {
        // Note: This is a mock implementation. Actual API endpoint may vary.
        // You need to check Dianping API documentation for the correct endpoint.
        const result = await callDianpingApi('order/query', {
            date: date
        });

        if (result && result.orders) {
            return result.orders;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch Dianping orders:', error.message);
        return [];
    }
}

// Convert Dianping order to local format
function convertDianpingOrder(dianpingOrder) {
    return {
        id: `#DP${dianpingOrder.order_id}`.padStart(6, '0'),
        source: 'dianping',
        customerName: dianpingOrder.customer_name || '未知',
        customerPhone: dianpingOrder.customer_phone || '',
        service: dianpingOrder.service_name || '足疗 60min',
        date: dianpingOrder.order_date,
        startTime: dianpingOrder.start_time || '09:00',
        duration: parseInt(dianpingOrder.duration) || 60,
        price: parseInt(dianpingOrder.price) || 0,
        therapistId: parseInt(dianpingOrder.therapist_id) || 1,
        bedId: parseInt(dianpingOrder.bed_id) || 1,
        notes: dianpingOrder.remark || '',
        status: 'pending',
        addons: [],
        dianpingOrderId: dianpingOrder.order_id,
        createdAt: new Date().toISOString()
    };
}

// Sync orders from Dianping
async function syncDianpingOrders() {
    console.log('[Sync] Starting Dianping order sync...');

    const today = new Date().toISOString().split('T')[0];
    const dianpingOrders = await fetchDianpingOrders(today);

    let syncedCount = 0;

    for (const dpOrder of dianpingOrders) {
        // Check if order already exists
        const exists = orders.some(o => o.dianpingOrderId === dpOrder.order_id);

        if (!exists) {
            const newOrder = convertDianpingOrder(dpOrder);
            orders.push(newOrder);
            syncedCount++;
            console.log(`[Sync] New order synced: ${newOrder.id}`);
        }
    }

    if (syncedCount > 0) {
        saveData();
        console.log(`[Sync] ${syncedCount} new orders synced`);
    } else {
        console.log('[Sync] No new orders');
    }

    return syncedCount;
}

// ==================== API Routes ====================

// Get config
app.get('/api/config', (req, res) => {
    res.json({
        dianping: {
            appkey: config.dianping.appkey ? '***' + config.dianping.appkey.slice(-4) : '',
            configured: !!config.dianping.appkey && !!config.dianping.secret
        }
    });
});

// Update config
app.post('/api/config', (req, res) => {
    const { dianping } = req.body;

    if (dianping) {
        if (dianping.appkey) config.dianping.appkey = dianping.appkey;
        if (dianping.secret) config.dianping.secret = dianping.secret;
    }

    saveData();
    res.json({ success: true, message: '配置已保存' });
});

// Get orders
app.get('/api/orders', (req, res) => {
    const { date } = req.query;

    let filteredOrders = orders;

    if (date) {
        filteredOrders = orders.filter(o => o.date === date);
    }

    // Sort by start time
    filteredOrders.sort((a, b) => {
        const timeA = a.startTime.replace(':', '') * 1;
        const timeB = b.startTime.replace(':', '') * 1;
        return timeA - timeB;
    });

    res.json(filteredOrders);
});

// Create order
app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: `#${String(orders.length + 1).padStart(4, '0')}`,
        ...req.body,
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    saveData();

    res.json({ success: true, order: newOrder });
});

// Update order
app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
    }

    orders[orderIndex] = { ...orders[orderIndex], ...req.body };
    saveData();

    res.json({ success: true, order: orders[orderIndex] });
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
    }

    orders.splice(orderIndex, 1);
    saveData();

    res.json({ success: true });
});

// Sync Dianping orders manually
app.post('/api/sync/dianping', async (req, res) => {
    try {
        const count = await syncDianpingOrders();
        res.json({ success: true, synced: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== Cron Jobs ====================

// Sync Dianping orders every 30 minutes (9:00 - 22:00)
cron.schedule('*/30 9-21 * * *', () => {
    syncDianpingOrders();
});

// ==================== Start Server ====================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📅 Sync schedule: Every 30 minutes from 9:00 to 21:00`);

    // Initial sync
    setTimeout(() => {
        syncDianpingOrders();
    }, 2000);
});
