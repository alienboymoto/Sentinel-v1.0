import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy to Binance to fetch current price without CORS issues
  app.get('/api/price/:symbol', async (req, res) => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${req.params.symbol}`);
      if (!response.ok) throw new Error('Binance API error');
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch price' });
    }
  });

  // Fetch klines and calculate SMA
  app.get('/api/sma/:symbol/:interval/:period', async (req, res) => {
    try {
      const { symbol, interval, period } = req.params;
      const limit = parseInt(period, 10);
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      if (!response.ok) throw new Error('Binance API error');
      const data = await response.json();
      
      // Close price is at index 4 in Binance kline array
      const closes = data.map((k: any) => parseFloat(k[4]));
      const sma = closes.reduce((a: number, b: number) => a + b, 0) / closes.length;
      
      res.json({ sma, currentPrice: closes[closes.length - 1] });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch SMA' });
    }
  });

  // Send Telegram Alert
  app.post('/api/alert', async (req, res) => {
    try {
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8849597742:AAHzYx2f7c89RzpR7syNCzDHTDtvIWDP570';
      const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6217754673';
      const text = req.body.text;

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
      });
      
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to send alert' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
