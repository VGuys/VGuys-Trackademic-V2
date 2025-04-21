const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const db = require('./db');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const serveFile = (filename, contentType) => {
    fs.readFile(path.join(__dirname, filename), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  };

  if (pathname === '/' || pathname === '/index.html') return serveFile('index.html', 'text/html');
  if (pathname === '/login.html') return serveFile('login.html', 'text/html');
  if (pathname === '/signup.html') return serveFile('signup.html', 'text/html');

  if (pathname === '/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const { user_id, password } = querystring.parse(body);
      try {
        const result = await db.query('SELECT * FROM users WHERE user_id = $1 AND password = $2', [user_id, password]);
        if (result.rows.length > 0) {
          res.writeHead(302, { 'Location': '/index.html' });
        } else {
          res.writeHead(401, { 'Content-Type': 'text/plain' });
          res.write('Invalid login');
        }
        res.end();
      } catch (err) {
        res.writeHead(500);
        res.end('DB error');
      }
    });
    return;
  }

  if (pathname === '/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const { user_id, password } = querystring.parse(body);
      try {
        const result = await db.query('INSERT INTO users (user_id, password) VALUES ($1, $2)', [user_id, password]);
        res.writeHead(302, { 'Location': '/login.html' });
        res.end();
      } catch (err) {
        res.writeHead(500);
        res.end('DB error or duplicate user_id');
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 1337;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
