const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));

const aiChat = require('./api/ai/chat.js');
app.post('/api/ai/chat', aiChat);

app.use(express.static(ROOT, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    }
  }
}));

app.use((req, res) => {
  if (req.method === 'GET' && !path.extname(req.path)) {
    return res.sendFile(path.join(ROOT, 'index.html'));
  }
  res.status(404).end();
});

app.listen(PORT, HOST, () => {
  console.log(`3D Studiya listening on http://${HOST}:${PORT}`);
});
