const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db'); // PostgreSQL connection

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve HTML files
  if (req.method === 'GET') {
    let filePath = '';

    if (pathname === '/' || pathname === '/login') {
      filePath = 'login.html';
    } else if (pathname === '/signup') {
      filePath = 'signup.html';
    } else if (pathname === '/home') {
      filePath = 'index.html';
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    fs.readFile(path.join(__dirname, filePath), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Login
  if (pathname === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { user_id, password } = JSON.parse(body);
      try {
        const query = 'SELECT * FROM users WHERE user_id = $1 AND password = $2';
        const result = await db.query(query, [user_id, password]);
        if (result.rows.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error' }));
      }
    });
    return;
  }

  // Signup
  if (pathname === '/api/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { user_id, password } = JSON.parse(body);
      try {
        const insertQuery = 'INSERT INTO users (user_id, password) VALUES ($1, $2)';
        await db.query(insertQuery, [user_id, password]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Signup failed' }));
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
