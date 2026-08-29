import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  console.log(`[${req.method}] ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (req.url.startsWith('/api/data/')) {
    const filename = req.url.replace('/api/data/', '');
    // Simple sanitization to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid filename' }));
        return;
    }

    const filepath = path.join(dataDir, filename);

    if (req.method === 'GET') {
      try {
        if (!fs.existsSync(filepath)) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }
        const ext = path.extname(filepath);
        if (ext === '.json') {
          const content = fs.readFileSync(filepath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(content);
        } else if (ext === '.js') {
            const content = fs.readFileSync(filepath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(content);
        }
         else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Unsupported file type' }));
        }
      } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const ext = path.extname(filepath);
          if (ext === '.json') {
             // ensure it's valid JSON before saving
             JSON.parse(body);
             fs.writeFileSync(filepath, body, 'utf8');
             res.writeHead(200, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ success: true }));
          } else if (ext === '.js') {
             fs.writeFileSync(filepath, body, 'utf8');
             res.writeHead(200, { 'Content-Type': 'application/json' });
             res.end(JSON.stringify({ success: true }));
          } else {
             res.writeHead(400);
             res.end(JSON.stringify({ error: 'Unsupported file type' }));
          }

        } catch (err) {
          console.error(err);
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid data format or save error' }));
        }
      });
      return;
    }
  }

  if (req.url === '/api/list') {
      if (req.method === 'GET') {
          try {
              const files = fs.readdirSync(dataDir);
              const result = files.filter(f => f.endsWith('.json') || f.endsWith('.js'));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
          } catch(err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'Failed to list files' }));
          }
          return;
      }
  }

  // Serve static files for the editor
  let filePath = req.url === '/' ? '/index.html' : req.url;

  // Clean query params
  filePath = filePath.split('?')[0];

  const fullPath = path.join(__dirname, filePath);

  try {
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const extname = String(path.extname(fullPath)).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        const content = fs.readFileSync(fullPath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    } else {
         res.writeHead(404);
         res.end(`File not found: ${filePath}`);
    }
  } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Internal Server Error');
  }

});

server.listen(PORT, () => {
  console.log(`RPG Data Editor Server running at http://localhost:${PORT}/`);
  console.log(`Serving data from: ${dataDir}`);

  // Automatically open the browser
  const url = `http://localhost:${PORT}/`;
  const startCommand = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${startCommand} ${url}`);
});
