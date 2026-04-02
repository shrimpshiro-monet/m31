import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Serve the built React app
const distPath = path.join(__dirname, 'apps/web/dist');
app.use(express.static(distPath));

// Proxy API calls to the Express server on port 3000
app.post('/api/director/generate', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/api/director/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SPA fallback - serve index.html for any route
app.use((req, res, next) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = 5173;
app.listen(PORT, () => {
  console.log(`\n🎨 UI Server running on http://localhost:${PORT}`);
  console.log(`📡 Backend API at http://localhost:3000`);
  console.log(`🎬 Visit: http://localhost:${PORT}/demo/ai-director-ui\n`);
});
