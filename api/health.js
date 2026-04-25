// api/health.js - Health check endpoint
export default function handler(req, res) {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: '乐轻松 Happy Spa API',
        version: '1.0.0'
    });
}
