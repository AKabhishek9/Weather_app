import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Weather API proxy (same behavior as api/weather.js)
app.get('/api/weather', async (req, res) => {
  const API_KEY = process.env.WEATHER_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'Server misconfiguration: WEATHER_API_KEY is not set.',
    });
  }

  const { q, days = 6, aqi = 'no' } = req.query;

  if (!q) {
    return res.status(400).json({
      error: 'Missing query parameter "q" (city name or lat,lon).',
    });
  }

  try {
    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(
      q
    )}&days=${days}&aqi=${aqi}&alerts=no`;

    const apiRes = await fetch(apiUrl);

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}));
      return res.status(apiRes.status).json(errBody);
    }

    const data = await apiRes.json();

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach weather service.', detail: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const API_KEY = process.env.WEATHER_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: WEATHER_API_KEY is not set.' });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q".' });
  }

  try {
    const apiUrl = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${encodeURIComponent(q)}`;
    const apiRes = await fetch(apiUrl);

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}));
      return res.status(apiRes.status).json(errBody);
    }

    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach search service.', detail: err.message });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});